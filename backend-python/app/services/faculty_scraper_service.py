"""
Faculty Scraper Service
-----------------------
Scrapes the full DIU faculty directory (https://faculty.daffodilvarsity.edu.bd/)
into structured {name, designation, department} records.

Site structure (STATIC server-rendered HTML — plain requests, no browser):
  • Landing page lists departments as links: /teachers/<code>.html
  • Each department page lists members as <h3>Name</h3><h4>Designation</h4> pairs,
    under school headers like "Faculty of ..." / "Department of ..." (skipped).

The /teachers/*.html pages are static (verified: no API, no pagination, no JS),
so a handful of fast HTTP GETs replace headless rendering — this even runs on
the Render web dyno. Returns clean records the sync layer stores in kb_faculty
(Supabase) so the app serves faculty directly from the DB — no LLM tokens.
"""

import logging
import re
import time

import requests

logger = logging.getLogger(__name__)

BASE = "https://faculty.daffodilvarsity.edu.bd"
LANDING = BASE + "/"
_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
       "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

_DEPT_LINK = re.compile(r"/teachers/([\w-]+)\.html$", re.I)
# Lines that are section headers, not people.
_HEADER = re.compile(r"^(faculty of|department of|school of)\b", re.I)
_DESIG = re.compile(
    r"professor|lecturer|assistant|associate|head|dean|instructor|coordinator|"
    r"chairman|director|fellow|teacher", re.I)


_HEADERS = {"User-Agent": _UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"}


def is_available() -> bool:
    # Static HTTP scrape — always available (no browser needed).
    return True


def _fetch(url: str, timeout: int = 20, retries: int = 3) -> str | None:
    for attempt in range(1, retries + 1):
        try:
            resp = requests.get(url, headers=_HEADERS, timeout=timeout)
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as e:
            if attempt < retries:
                time.sleep(min(2 ** attempt, 6))
            else:
                logger.warning("Faculty fetch failed [%s]: %s", url, e)
    return None


def _make_soup(html: str):
    from bs4 import BeautifulSoup
    try:
        return BeautifulSoup(html, "lxml")
    except Exception:  # noqa: BLE001
        return BeautifulSoup(html, "html.parser")


def _clean_dept(name: str) -> str:
    """'Department of Computer Science and Engineering' → 'Computer Science and Engineering'."""
    return re.sub(r"^(department|school)\s+of\s+", "", name, flags=re.I).strip()


def _parse_department_page(html: str, dept_name: str, dept_code: str) -> list[dict]:
    """Extract (name, designation) pairs from a department teachers page."""
    soup = _make_soup(html)
    for tag in soup.find_all(["script", "style", "nav", "footer"]):
        tag.decompose()

    headings = soup.find_all(["h3", "h4"])
    records: list[dict] = []
    i = 0
    while i < len(headings):
        h = headings[i]
        name = h.get_text(" ", strip=True)
        # A person = an h3 name immediately followed by an h4 designation.
        if h.name == "h3" and name and not _HEADER.match(name):
            nxt = headings[i + 1] if i + 1 < len(headings) else None
            if nxt is not None and nxt.name == "h4":
                designation = nxt.get_text(" ", strip=True)
                if designation and not _HEADER.match(designation):
                    link = h.find("a", href=True) or h.find_parent("a", href=True)
                    profile_url = None
                    if link and link.get("href"):
                        href = link["href"]
                        profile_url = href if href.startswith("http") else BASE + "/" + href.lstrip("/")
                    records.append({
                        "name": re.sub(r"\s+", " ", name).strip(),
                        "designation": re.sub(r"\s+", " ", designation).strip(),
                        "department": dept_name,
                        "department_code": dept_code,
                        "profile_url": profile_url,
                    })
                    i += 2
                    continue
        i += 1
    return records


def get_department_links() -> list[dict]:
    """Return [{code, name, url}] for every department from the landing page."""
    html = _fetch(LANDING)
    if not html:
        return []
    soup = _make_soup(html)
    seen, departments = set(), []
    for a in soup.find_all("a", href=True):
        m = _DEPT_LINK.search(a["href"])
        if not m:
            continue
        code = m.group(1).lower()
        if code in seen:
            continue
        seen.add(code)
        url = a["href"] if a["href"].startswith("http") else BASE + "/teachers/" + code + ".html"
        departments.append({"code": code, "name": _clean_dept(a.get_text(" ", strip=True)), "url": url})
    return departments


def scrape_all_faculty(max_departments: int | None = None) -> dict:
    """
    Fetch the directory and every department page (plain HTTP), returning:
      {success, count, departments, faculty:[{name, designation, department, ...}]}
    Best-effort per department: one failing page never aborts the whole run.
    """
    departments = get_department_links()
    if not departments:
        return {"success": False, "error": "no department links found", "faculty": []}
    if max_departments:
        departments = departments[:max_departments]
    logger.info("Faculty scraper: %d departments found", len(departments))

    faculty: list[dict] = []
    for d in departments:
        html = _fetch(d["url"])
        if not html:
            continue
        recs = _parse_department_page(html, d["name"], d["code"])
        faculty.extend(recs)
        logger.info("  %-12s %d members", d["code"], len(recs))

    return {"success": True, "count": len(faculty),
            "departments": departments, "faculty": faculty}


def sync(index_for_rag: bool = True) -> dict:
    """
    Full faculty sync:
      1. Scrape all departments → structured records.
      2. Upsert into kb_faculty (change detection) + deactivate anyone who left.
      3. (optional) Build one document per department and index it into the RAG
         collection so the chatbot answers faculty questions from REAL data.
    Returns counts. Requires Playwright + DATABASE_URL.
    """
    from app.db import pg
    from app.repositories import faculty_repo, sources_repo
    from app.services import content_extractor_service as ce

    if not pg.is_configured():
        return {"success": False, "error": "DATABASE_URL not configured"}
    if not is_available():
        return {"success": False, "error": "playwright not installed (off-Render worker only)"}

    scraped = scrape_all_faculty()
    if not scraped.get("success"):
        return scraped

    records = scraped["faculty"]
    counts = {"created": 0, "updated": 0, "unchanged": 0}
    seen_keys: set[tuple] = set()
    by_dept: dict[str, list[dict]] = {}
    for rec in records:
        action = faculty_repo.upsert(rec)
        counts[action] = counts.get(action, 0) + 1
        seen_keys.add((rec["name"], rec["department"]))
        by_dept.setdefault(rec["department"], []).append(rec)
    deactivated = faculty_repo.deactivate_missing(seen_keys)

    indexed = 0
    if index_for_rag:
        try:
            from app.services import change_detection_service, incremental_index_service as idx
            src = sources_repo.get_by_category("faculty")
            if src:
                source = src[0]
                docs = []
                for dept, members in by_dept.items():
                    lines = [f"Department of {dept} — Faculty Members:"]
                    for m in members:
                        lines.append(f"- {m['name']} — {m['designation']}")
                    content = "\n".join(lines)
                    slug = re.sub(r"[^a-z0-9]+", "-", dept.lower()).strip("-")[:60]
                    docs.append({
                        "natural_key": f"{source['url']}#faculty-{slug}",
                        "title": f"{dept} Faculty",
                        "category": "faculty",
                        "content": content,
                        "content_hash": ce.sha256(content),
                        "token_estimate": ce.estimate_tokens(content),
                    })
                change = change_detection_service.apply(source["id"], source["url"], docs)
                idx.ensure_ready()
                for d in change["created"] + change["updated"]:
                    r = idx.index_document(d)
                    indexed += r["embedded"]
        except Exception as e:  # noqa: BLE001 - RAG indexing is best-effort
            logger.warning("Faculty RAG indexing failed: %s", e)

    return {"success": True, "scraped": len(records), "departments": len(by_dept),
            **counts, "deactivated": deactivated, "rag_embedded": indexed}
