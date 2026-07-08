"""
Content Extraction Service
--------------------------
Turns a fetched HTML page into a list of clean, structured DOCUMENTS ready for
change detection and embedding.

Responsibilities (spec: Content Extraction → Data Cleaning):
  • Strip noise: nav, footer, header, aside, script, style, noscript, ads.
  • Split a page into meaningful sections keyed by their heading, so a single
    section maps to a STABLE `natural_key` across crawls (url#slug). This is what
    lets change detection compare like-for-like and re-embed only what changed.
  • Compute a SHA-256 content hash over normalized text.
  • Estimate token count for prompt-budget accounting.

Generic by design: works for all 5 DIU sources without bespoke parsers. Structured
per-source parsers (faculty table → kb_faculty, etc.) build on top of this in a
later phase and are additive, not required for incremental sync to work.
"""

import hashlib
import logging
import re

logger = logging.getLogger(__name__)

_NOISE_TAGS = ["nav", "footer", "header", "aside", "script", "style", "noscript", "form"]
_NOISE_CLASS = re.compile(
    r"(nav|footer|header|menu|sidebar|breadcrumb|cookie|banner|advert|social|"
    r"share|subscribe|newsletter|search|pagination)",
    re.I,
)
_MIN_SECTION_CHARS = 40      # ignore trivially short sections
_MAX_SECTION_CHARS = 8000    # cap a single section (long ones get chunked later)


# ── helpers ───────────────────────────────────────────────────────────────────

def _make_soup(html: str):
    try:
        from bs4 import BeautifulSoup
        return BeautifulSoup(html, "lxml")
    except Exception:  # noqa: BLE001 - lxml may be unavailable
        from bs4 import BeautifulSoup
        return BeautifulSoup(html, "html.parser")


def _strip_noise(soup) -> None:
    for tag in soup.find_all(_NOISE_TAGS):
        tag.decompose()
    for el in soup.find_all(attrs={"class": _NOISE_CLASS}):
        el.decompose()
    for el in soup.find_all(attrs={"id": _NOISE_CLASS}):
        el.decompose()
    for el in soup.find_all(attrs={"role": re.compile(r"navigation|banner|search", re.I)}):
        el.decompose()


def normalize_text(text: str) -> str:
    """Collapse whitespace so hashes are stable against cosmetic HTML changes."""
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def sha256(text: str) -> str:
    return hashlib.sha256(normalize_text(text).encode("utf-8")).hexdigest()


def estimate_tokens(text: str) -> int:
    """Cheap token estimate (~4 chars/token) — good enough for budgeting."""
    return max(1, len(text) // 4)


def _slug(text: str) -> str:
    s = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    s = re.sub(r"[\s_-]+", "-", s)
    return s[:80] or "section"


# ── main API ──────────────────────────────────────────────────────────────────

def extract_documents(html: str, url: str, category: str) -> list[dict]:
    """
    Extract a page into clean section documents.

    Returns [{natural_key, title, category, content, content_hash, token_estimate}].
    Sections are delimited by h1-h4 headings; content before the first heading is
    captured as an 'intro' section. Deduplicates identical section bodies.
    """
    if not html:
        return []

    soup = _make_soup(html)
    _strip_noise(soup)

    root = soup.find("main") or soup.find("article") or soup.body or soup
    if root is None:
        return []

    page_title = ""
    if soup.title and soup.title.string:
        page_title = soup.title.string.strip()

    sections: list[dict] = []
    current_title = page_title or "Introduction"
    current_slug = "intro"
    buf: list[str] = []

    def flush():
        if not buf:
            return
        body = normalize_text("\n".join(buf))
        if len(body) < _MIN_SECTION_CHARS:
            return
        body = body[:_MAX_SECTION_CHARS]
        sections.append({"title": current_title, "slug": current_slug, "content": body})

    for el in root.find_all(["h1", "h2", "h3", "h4", "p", "li", "td", "th", "dd", "dt"]):
        text = el.get_text(" ", strip=True)
        if not text:
            continue
        if el.name in ("h1", "h2", "h3", "h4"):
            flush()
            current_title = text[:200]
            current_slug = _slug(text)
            buf = []
        else:
            buf.append(text)
    flush()

    # Fallback: no headings produced usable sections → treat whole page as one doc.
    if not sections:
        body = normalize_text(root.get_text("\n", strip=True))[:_MAX_SECTION_CHARS]
        if len(body) >= _MIN_SECTION_CHARS:
            sections.append({"title": page_title or url, "slug": "page", "content": body})

    docs: list[dict] = []
    seen_hashes: set[str] = set()
    slug_counts: dict[str, int] = {}
    for sec in sections:
        h = sha256(sec["content"])
        if h in seen_hashes:            # drop duplicate blocks within the page
            continue
        seen_hashes.add(h)
        # Disambiguate repeated slugs so natural_key stays unique per section.
        slug = sec["slug"]
        slug_counts[slug] = slug_counts.get(slug, 0) + 1
        if slug_counts[slug] > 1:
            slug = f"{slug}-{slug_counts[slug]}"
        docs.append({
            "natural_key": f"{url}#{slug}",
            "title": sec["title"],
            "category": category,
            "content": sec["content"],
            "content_hash": h,
            "token_estimate": estimate_tokens(sec["content"]),
        })

    logger.info("Extracted %d section-docs from %s", len(docs), url)
    return docs
