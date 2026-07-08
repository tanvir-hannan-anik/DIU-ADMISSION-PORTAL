"""
Scrape the full DIU faculty directory into Supabase (kb_faculty) and index it
for the chatbot. Run OFF Render (needs Playwright/Chromium).

Prereqs:
    pip install -r requirements.txt -r requirements-worker.txt
    playwright install chromium

Run:
    python scripts/sync_faculty.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import pg                                  # noqa: E402
from app.services import faculty_scraper_service as fs  # noqa: E402


def main() -> int:
    if not pg.is_configured():
        print("ERROR: DATABASE_URL not configured.")
        return 1
    if not fs.is_available():
        print("ERROR: Playwright not installed. Run:\n"
              "  pip install -r requirements-worker.txt && playwright install chromium")
        return 1
    print("Scraping faculty directory (this renders ~35 pages)...")
    res = fs.sync()
    if not res.get("success"):
        print("FAILED:", res.get("error"))
        return 1
    print(f"\nDone. scraped={res['scraped']} across {res['departments']} departments")
    print(f"  created={res['created']} updated={res['updated']} unchanged={res['unchanged']} "
          f"deactivated={res['deactivated']} rag_embedded={res['rag_embedded']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
