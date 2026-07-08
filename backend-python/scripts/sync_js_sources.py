"""
JS-source sync worker (run OFF Render)
======================================
Syncs only the `render_js = true` sources (tuition-fees, faculty, faculties)
using headless Chromium. It writes documents to Supabase and vectors to Qdrant —
the SAME stores the Render web service reads from — so the browser never has to
run on Render.

Prerequisites (once):
    pip install -r requirements.txt -r requirements-worker.txt
    playwright install chromium

Run:
    python scripts/sync_js_sources.py

Environment: needs the same .env as the web service (DATABASE_URL, GEMINI_API_KEY,
QDRANT_URL, QDRANT_API_KEY).

Schedule it off-Render, e.g. GitHub Actions (.github/workflows/js-sync.yml):

    name: DIU JS Source Sync
    on:
      schedule: [{ cron: "0 * * * *" }]   # hourly
      workflow_dispatch:
    jobs:
      sync:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-python@v5
            with: { python-version: "3.12" }
          - working-directory: backend-python
            run: |
              pip install -r requirements.txt -r requirements-worker.txt
              playwright install --with-deps chromium
              python scripts/sync_js_sources.py
            env:
              DATABASE_URL:   ${{ secrets.DATABASE_URL }}
              GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
              QDRANT_URL:     ${{ secrets.QDRANT_URL }}
              QDRANT_API_KEY: ${{ secrets.QDRANT_API_KEY }}
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import pg                       # noqa: E402
from app.services import sync_service        # noqa: E402
from app.services import rendered_fetch_service  # noqa: E402


def main() -> int:
    if not pg.is_configured():
        print("ERROR: DATABASE_URL not configured.")
        return 1
    if not rendered_fetch_service.is_available():
        print("ERROR: Playwright not installed. Run:\n"
              "  pip install -r requirements-worker.txt && playwright install chromium")
        return 1

    rows = pg.query("SELECT id, name FROM kb_sources WHERE render_js = TRUE AND is_active = TRUE ORDER BY id")
    if not rows:
        print("No active render_js sources.")
        return 0

    print(f"Syncing {len(rows)} JS source(s) with headless Chromium...\n")
    failures = 0
    for s in rows:
        res = sync_service.run_source(s["id"])
        st = res.get("stats", {})
        ok = res.get("success") and not res.get("skipped")
        flag = "OK " if ok else "!! "
        print(f"{flag}#{s['id']} {s['name']:<18} "
              f"changed={st.get('pages_changed',0)} unchanged={st.get('pages_unchanged',0)} "
              f"embedded={st.get('embeddings_generated',0)} "
              f"{'' if ok else res.get('error') or res.get('reason','')}")
        if not ok:
            failures += 1
    print(f"\nDone. {len(rows)-failures}/{len(rows)} succeeded.")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
