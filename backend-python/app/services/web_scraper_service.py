"""
Web Scraper Service
--------------------
Fetches real-time data from official DIU websites:
  - Scholarships : https://daffodilvarsity.edu.bd/scholarship/diu-scholarship
  - Tuition Fees : https://daffodilvarsity.edu.bd/tuition-fees
  - Faculty Dir  : https://faculty.daffodilvarsity.edu.bd/

Results are cached in-memory for CACHE_TTL seconds (default 3600 = 1 hour).
All external calls are best-effort: failures return empty data so the rest of
the app keeps working.
"""

import time
import logging
import re
import requests

logger = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────

CACHE_TTL = 3600  # seconds

SCHOLARSHIP_URL = "https://daffodilvarsity.edu.bd/scholarship/diu-scholarship"
TUITION_FEE_URL = "https://daffodilvarsity.edu.bd/tuition-fees"
FACULTY_BASE_URL = "https://faculty.daffodilvarsity.edu.bd"
FACULTY_LIST_URL = "https://faculty.daffodilvarsity.edu.bd/"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# ── In-memory cache ───────────────────────────────────────────────────────────

_cache: dict = {}


def _get_cached(key: str):
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"] < CACHE_TTL):
        return entry["data"]
    return None


def _set_cached(key: str, data):
    _cache[key] = {"ts": time.time(), "data": data}


def invalidate_cache():
    """Force-clear all cached scrape results."""
    _cache.clear()
    logger.info("Web scraper cache cleared")


# ── HTTP helpers ──────────────────────────────────────────────────────────────

def _fetch(url: str, timeout: int = 20) -> str | None:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout)
        resp.raise_for_status()
        return resp.text
    except Exception as exc:
        logger.warning("Scrape failed [%s]: %s", url, exc)
        return None


def _make_soup(html: str):
    try:
        from bs4 import BeautifulSoup
        return BeautifulSoup(html, "lxml")
    except ImportError:
        from bs4 import BeautifulSoup
        return BeautifulSoup(html, "html.parser")


def _clean(soup) -> None:
    """Remove noise elements from a soup in-place."""
    for tag in soup.find_all(["nav", "footer", "script", "style", "noscript",
                               "header", "aside"]):
        tag.decompose()


def _visible_text(soup) -> str:
    return re.sub(r"\n{3,}", "\n\n", soup.get_text(separator="\n", strip=True))


# ── Scholarship Scraper ───────────────────────────────────────────────────────

def fetch_scholarships(force: bool = False) -> dict:
    """
    Fetch scholarship data from the DIU scholarship page.
    Returns:
      {
        success: bool,
        url: str,
        scholarships: [{"title": ..., "details": ...}, ...],
        raw_text: str,
        fetched_at: str,
      }
    """
    if not force:
        cached = _get_cached("scholarships")
        if cached:
            return cached

    html = _fetch(SCHOLARSHIP_URL)
    if not html:
        result = {
            "success": False,
            "url": SCHOLARSHIP_URL,
            "scholarships": [],
            "raw_text": "",
            "error": "Could not reach scholarship page",
            "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        _set_cached("scholarships", result)
        return result

    soup = _make_soup(html)
    _clean(soup)

    scholarships = []

    # Strategy 1: table rows
    for table in soup.find_all("table"):
        headers: list[str] = []
        for i, row in enumerate(table.find_all("tr")):
            cells = row.find_all(["th", "td"])
            texts = [c.get_text(strip=True) for c in cells]
            if not any(texts):
                continue
            if i == 0 or all(c.name == "th" for c in cells):
                headers = texts
                continue
            if headers and len(texts) == len(headers):
                scholarships.append(dict(zip(headers, texts)))
            elif texts:
                scholarships.append({"info": " | ".join(t for t in texts if t)})

    # Strategy 2: headings + paragraphs / list items
    if not scholarships:
        current_title = ""
        for elem in soup.find_all(["h1", "h2", "h3", "h4", "p", "li"]):
            text = elem.get_text(strip=True)
            if not text or len(text) < 5:
                continue
            if elem.name in ("h1", "h2", "h3", "h4"):
                current_title = text
            elif current_title and len(text) > 20:
                scholarships.append({"title": current_title, "details": text})

    raw_text = _visible_text(soup)[:10000]

    result = {
        "success": True,
        "url": SCHOLARSHIP_URL,
        "scholarships": scholarships,
        "raw_text": raw_text,
        "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    _set_cached("scholarships", result)
    logger.info("Scholarships scraped: %d entries", len(scholarships))
    return result


# ── Tuition Fee Scraper ───────────────────────────────────────────────────────

def fetch_tuition_fees(force: bool = False) -> dict:
    """
    Fetch department-wise tuition fee data.
    Returns:
      {
        success: bool,
        url: str,
        fees: [{"department": ..., "semester_fee": ..., "total_fee": ..., ...}],
        raw_text: str,
        fetched_at: str,
      }
    """
    if not force:
        cached = _get_cached("tuition_fees")
        if cached:
            return cached

    html = _fetch(TUITION_FEE_URL)
    if not html:
        result = {
            "success": False,
            "url": TUITION_FEE_URL,
            "fees": [],
            "raw_text": "",
            "error": "Could not reach tuition fees page",
            "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        _set_cached("tuition_fees", result)
        return result

    soup = _make_soup(html)
    _clean(soup)

    fees = []

    # Strategy 1: tables (most fee pages use tables)
    for table in soup.find_all("table"):
        headers: list[str] = []
        for i, row in enumerate(table.find_all("tr")):
            cells = row.find_all(["th", "td"])
            texts = [c.get_text(strip=True) for c in cells]
            if not any(t for t in texts if t):
                continue
            if i == 0 or all(c.name == "th" for c in cells):
                headers = [t for t in texts]
                continue
            if headers and texts:
                entry = dict(zip(headers, texts))
                fees.append(entry)
            elif texts:
                fees.append({"info": " | ".join(t for t in texts if t)})

    # Strategy 2: headings + amounts in plain text
    if not fees:
        current_dept = ""
        fee_pattern = re.compile(r"(?:BDT|Tk\.?|৳)\s*[\d,]+|[\d,]+\s*(?:BDT|Tk\.?|৳)", re.I)
        for elem in soup.find_all(["h2", "h3", "h4", "p", "li", "td"]):
            text = elem.get_text(strip=True)
            if not text:
                continue
            if elem.name in ("h2", "h3", "h4") and len(text) < 80:
                current_dept = text
            elif fee_pattern.search(text) and current_dept:
                fees.append({"department": current_dept, "fee_info": text})

    raw_text = _visible_text(soup)[:10000]

    result = {
        "success": True,
        "url": TUITION_FEE_URL,
        "fees": fees,
        "raw_text": raw_text,
        "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    _set_cached("tuition_fees", result)
    logger.info("Tuition fees scraped: %d entries", len(fees))
    return result


# ── Faculty Scraper ───────────────────────────────────────────────────────────

_FACULTY_PROFILE_FIELDS = [
    "name", "department", "designation", "email", "phone",
    "personal_info", "academic_qualification", "training_experience",
    "teaching_research_interest", "publications", "memberships",
    "previous_employment",
]

_FIELD_KEYWORDS = {
    "academic_qualification": ["academic qualification", "education", "degree", "academic background"],
    "training_experience":    ["training", "experience", "workshop", "certification"],
    "teaching_research_interest": ["teaching", "research interest", "area of interest", "specialization"],
    "publications":           ["publication", "journal", "paper", "research paper", "book"],
    "memberships":            ["membership", "member of", "professional body", "association"],
    "previous_employment":    ["previous employment", "work experience", "career", "employment history"],
    "personal_info":          ["personal", "biography", "about", "profile"],
}


def _map_section_to_field(heading: str) -> str | None:
    h = heading.lower()
    for field, keywords in _FIELD_KEYWORDS.items():
        if any(kw in h for kw in keywords):
            return field
    return None


def _scrape_faculty_profile(url: str) -> dict:
    """Fetch one faculty profile page and extract structured fields."""
    html = _fetch(url, timeout=15)
    if not html:
        return {}

    soup = _make_soup(html)
    _clean(soup)

    profile: dict = {"profile_url": url}

    # Name: look for prominent heading or h1
    name_elem = (
        soup.find("h1")
        or soup.find("h2", class_=re.compile(r"name|title|faculty", re.I))
        or soup.find(class_=re.compile(r"faculty-name|name|title", re.I))
    )
    if name_elem:
        profile["name"] = name_elem.get_text(strip=True)

    # Department & designation via common class names
    for key, patterns in [
        ("department", ["department", "dept"]),
        ("designation", ["designation", "position", "title"]),
        ("email", ["email", "mail"]),
    ]:
        for pat in patterns:
            found = soup.find(class_=re.compile(pat, re.I))
            if not found:
                found = soup.find(string=re.compile(pat, re.I))
                if found:
                    found = found.parent
            if found:
                val = found.get_text(strip=True)
                if val and key not in profile:
                    profile[key] = val
                    break

    # Section-based extraction: find headings and collect following content
    current_field = None
    current_items: list[str] = []

    def _flush(field, items):
        if field and items:
            profile[field] = " ".join(items)

    for elem in soup.find_all(["h2", "h3", "h4", "h5", "p", "li", "td"]):
        text = elem.get_text(strip=True)
        if not text or len(text) < 2:
            continue
        if elem.name in ("h2", "h3", "h4", "h5"):
            _flush(current_field, current_items)
            current_field = _map_section_to_field(text)
            current_items = []
        elif current_field and len(text) > 3:
            current_items.append(text)

    _flush(current_field, current_items)

    return profile


def fetch_faculty_list(force: bool = False, max_profiles: int = 60) -> dict:
    """
    Fetch the faculty directory and basic profiles.
    Returns:
      {
        success: bool,
        url: str,
        faculty: [{name, department, designation, profile_url, ...}, ...],
        raw_text: str,
        fetched_at: str,
      }
    """
    if not force:
        cached = _get_cached("faculty_list")
        if cached:
            return cached

    html = _fetch(FACULTY_LIST_URL)
    if not html:
        result = {
            "success": False,
            "url": FACULTY_LIST_URL,
            "faculty": [],
            "raw_text": "",
            "error": "Could not reach faculty directory",
            "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        _set_cached("faculty_list", result)
        return result

    soup = _make_soup(html)
    _clean(soup)

    faculty = []
    profile_urls: list[str] = []

    # Strategy 1: cards / repeated structural blocks
    # Many faculty directories use <div class="teacher-item"> or similar
    card_selectors = [
        {"class": re.compile(r"teacher|faculty|staff|profile|member", re.I)},
    ]
    cards = []
    for sel in card_selectors:
        cards = soup.find_all(["div", "article", "li"], attrs=sel)
        if cards:
            break

    if cards:
        for card in cards[:max_profiles]:
            entry: dict = {}
            # Name
            name_tag = (
                card.find(["h2", "h3", "h4", "h5", "strong"])
                or card.find(class_=re.compile(r"name|title", re.I))
            )
            if name_tag:
                entry["name"] = name_tag.get_text(strip=True)
            # Designation / department via text
            for tag in card.find_all(["p", "span", "small"]):
                t = tag.get_text(strip=True)
                if not t or len(t) > 120:
                    continue
                tl = t.lower()
                if any(k in tl for k in ["professor", "lecturer", "assistant", "associate", "head"]):
                    entry.setdefault("designation", t)
                elif any(k in tl for k in ["department", "dept", "engineering", "science", "business"]):
                    entry.setdefault("department", t)
            # Profile link
            link = card.find("a", href=True)
            if link:
                href = link["href"]
                full_url = href if href.startswith("http") else FACULTY_BASE_URL + "/" + href.lstrip("/")
                entry["profile_url"] = full_url
                profile_urls.append(full_url)

            if entry:
                faculty.append(entry)

    # Strategy 2: all links that look like profile pages
    if not faculty:
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if re.search(r"/(profile|faculty|teacher|member)/", href, re.I):
                full_url = href if href.startswith("http") else FACULTY_BASE_URL + "/" + href.lstrip("/")
                name = link.get_text(strip=True)
                if name and 3 < len(name) < 80:
                    faculty.append({"name": name, "profile_url": full_url})
                    profile_urls.append(full_url)
                    if len(faculty) >= max_profiles:
                        break

    raw_text = _visible_text(soup)[:10000]

    result = {
        "success": True,
        "url": FACULTY_LIST_URL,
        "faculty": faculty,
        "raw_text": raw_text,
        "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    _set_cached("faculty_list", result)
    logger.info("Faculty list scraped: %d entries", len(faculty))
    return result


def fetch_faculty_profile(profile_url: str) -> dict:
    """
    Fetch detailed profile for a single faculty member.
    Returns the structured dict from _scrape_faculty_profile().
    Cached by URL.
    """
    cache_key = f"faculty_profile:{profile_url}"
    cached = _get_cached(cache_key)
    if cached:
        return cached
    profile = _scrape_faculty_profile(profile_url)
    if profile:
        _set_cached(cache_key, profile)
    return profile


# ── RAG document builders ─────────────────────────────────────────────────────

def scholarship_to_rag_docs() -> list[dict]:
    """Convert scraped scholarship data into RAG-ready documents."""
    data = fetch_scholarships()
    docs = []
    if data.get("raw_text"):
        docs.append({
            "text": f"DIU Scholarship Information (live from {data.get('fetched_at', '')})\n\n"
                    + data["raw_text"],
            "title": "DIU Scholarships (Live)",
            "source": "web_scraped",
            "type": "scholarship",
            "department": "",
        })
    for i, s in enumerate(data.get("scholarships", [])):
        text = " | ".join(f"{k}: {v}" for k, v in s.items() if v)
        if text:
            docs.append({
                "text": text,
                "title": f"DIU Scholarship #{i + 1}",
                "source": "web_scraped",
                "type": "scholarship",
                "department": "",
            })
    return docs


def tuition_fees_to_rag_docs() -> list[dict]:
    """Convert scraped tuition fee data into RAG-ready documents."""
    data = fetch_tuition_fees()
    docs = []
    if data.get("raw_text"):
        docs.append({
            "text": f"DIU Tuition Fee Structure (live from {data.get('fetched_at', '')})\n\n"
                    + data["raw_text"],
            "title": "DIU Tuition Fees (Live)",
            "source": "web_scraped",
            "type": "fees",
            "department": "",
        })
    for i, f in enumerate(data.get("fees", [])):
        text = " | ".join(f"{k}: {v}" for k, v in f.items() if v)
        if text:
            docs.append({
                "text": text,
                "title": f"Tuition Fee Entry #{i + 1}",
                "source": "web_scraped",
                "type": "fees",
                "department": f.get("department", ""),
            })
    return docs


def faculty_to_rag_docs() -> list[dict]:
    """Convert scraped faculty list into RAG-ready documents."""
    data = fetch_faculty_list()
    docs = []
    if data.get("raw_text"):
        docs.append({
            "text": f"DIU Faculty Directory (live from {data.get('fetched_at', '')})\n\n"
                    + data["raw_text"],
            "title": "DIU Faculty Directory (Live)",
            "source": "web_scraped",
            "type": "faculty",
            "department": "",
        })
    for member in data.get("faculty", []):
        parts = []
        if member.get("name"):
            parts.append(f"Name: {member['name']}")
        for field in _FACULTY_PROFILE_FIELDS[1:]:
            val = member.get(field)
            if val:
                parts.append(f"{field.replace('_', ' ').title()}: {val}")
        if parts:
            dept = member.get("department", "")
            docs.append({
                "text": "\n".join(parts),
                "title": f"Faculty: {member.get('name', 'Unknown')}",
                "source": "web_scraped",
                "type": "faculty",
                "department": dept,
            })
    return docs


def all_scraped_rag_docs() -> list[dict]:
    """Return all RAG documents from all three live sources."""
    docs = []
    try:
        docs.extend(scholarship_to_rag_docs())
    except Exception as exc:
        logger.warning("Scholarship RAG docs failed: %s", exc)
    try:
        docs.extend(tuition_fees_to_rag_docs())
    except Exception as exc:
        logger.warning("Tuition fees RAG docs failed: %s", exc)
    try:
        docs.extend(faculty_to_rag_docs())
    except Exception as exc:
        logger.warning("Faculty RAG docs failed: %s", exc)
    return docs
