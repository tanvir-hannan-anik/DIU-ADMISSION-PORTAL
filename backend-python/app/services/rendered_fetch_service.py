"""
Rendered Fetch Service (JS pages)
---------------------------------
Fetches fully-rendered HTML for JavaScript-driven pages using Playwright
(headless Chromium). Only the 3 DIU sources flagged `render_js=true`
(tuition-fees, faculty directory, faculties) need this.

KEEPING RENDER LIGHT
====================
Playwright + Chromium is heavy (~150 MB) and must NOT ship in the always-on
Render web dyno. Therefore:

  • `playwright` is NOT in requirements.txt (the web service). It lives in
    requirements-worker.txt, installed only where the JS sync actually runs
    (your local machine, a GitHub Actions cron, or a dedicated worker).
  • This module lazy-imports Playwright. If it's unavailable, it returns a
    clear "unavailable" result instead of crashing — so the web service can
    call run_all() safely; it simply skips JS sources with a logged note.
  • Run the JS sync OFF Render with:  python scripts/sync_js_sources.py
    (see that script's header for the GitHub Actions recipe).

The rendered HTML then flows through the SAME extract → change-detect → index
pipeline as static pages, so SHA-256 change detection and incremental embedding
work identically.
"""

import logging

logger = logging.getLogger(__name__)

_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def is_available() -> bool:
    """True only if Playwright is importable in this environment."""
    try:
        import playwright  # noqa: F401
        return True
    except Exception:  # noqa: BLE001
        return False


def fetch_rendered(url: str, timeout_ms: int = 30000,
                   wait_selector: str | None = None) -> dict:
    """
    Return {status:'ok'|'unavailable'|'error', html, error}.

    Renders the page with headless Chromium, waits for network idle (and an
    optional selector), then returns the settled DOM as HTML.
    """
    try:
        from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
    except Exception as e:  # noqa: BLE001
        logger.warning("Playwright not installed — JS render unavailable: %s", e)
        return {"status": "unavailable",
                "error": "playwright not installed (run: pip install -r requirements-worker.txt "
                         "&& playwright install chromium)"}

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            page = browser.new_page(user_agent=_UA)
            page.goto(url, wait_until="networkidle", timeout=timeout_ms)
            if wait_selector:
                try:
                    page.wait_for_selector(wait_selector, timeout=timeout_ms)
                except PWTimeout:
                    logger.info("wait_selector %r not found on %s (continuing)", wait_selector, url)
            html = page.content()
            browser.close()
            return {"status": "ok", "html": html}
    except Exception as e:  # noqa: BLE001
        logger.warning("Playwright render failed for %s: %s", url, e)
        return {"status": "error", "error": str(e)}
