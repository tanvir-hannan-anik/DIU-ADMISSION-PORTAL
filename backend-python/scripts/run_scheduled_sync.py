"""
Scheduled sync entry point (run off-Render, e.g. GitHub Actions cron).
Syncs only sources whose interval has elapsed (run_due), so calling it every
5–15 minutes honours each source's own cadence. JS sources render via Playwright
if it's installed; otherwise they're skipped cleanly.

Run:  python scripts/run_scheduled_sync.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import pg                       # noqa: E402
from app.services import sync_service        # noqa: E402


def main() -> int:
    if not pg.is_configured():
        print("ERROR: DATABASE_URL not configured.")
        return 1
    result = sync_service.run_due()
    synced = result.get("synced", 0)
    print(f"Ran {synced} due source(s).")
    for r in result.get("results", []):
        st = r.get("stats", {})
        print(f"  #{r.get('source_id')}: success={r.get('success')} "
              f"changed={st.get('pages_changed', 0)} embedded={st.get('embeddings_generated', 0)} "
              f"{r.get('error') or r.get('reason') or ''}")

    # Keep the structured faculty directory (kb_faculty) fresh too. Fast static
    # HTTP scrape + change detection, so re-runs are cheap.
    try:
        from app.services import faculty_scraper_service
        fr = faculty_scraper_service.sync()
        if fr.get("success"):
            print(f"  faculty: scraped={fr['scraped']} created={fr['created']} "
                  f"updated={fr['updated']} unchanged={fr['unchanged']} deactivated={fr['deactivated']}")
        else:
            print(f"  faculty sync skipped: {fr.get('error')}")
    except Exception as e:  # noqa: BLE001
        print(f"  faculty sync error: {e}")

    # Keep the structured tuition fees (kb_tuition_fees) fresh (public JSON API).
    try:
        from app.services import tuition_fee_service
        tr = tuition_fee_service.sync()
        if tr.get("success"):
            print(f"  tuition: programs={tr['programs']} created={tr['created']} "
                  f"updated={tr['updated']} unchanged={tr['unchanged']} deactivated={tr['deactivated']}")
        else:
            print(f"  tuition sync skipped: {tr.get('error')}")
    except Exception as e:  # noqa: BLE001
        print(f"  tuition sync error: {e}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
