"""
Tuition Fee Service
-------------------
Pulls the official DIU tuition-fee table from the site's public JSON API
(no HTML scraping, no browser) and stores the 4 headline figures per program
into kb_tuition_fees (Supabase). Served token-free to the UI + chatbot.

Source API (discovered from the tuition-fees page network calls):
    https://webbackend.daffodilvarsity.edu.bd/api/v1/public/tuition-fees?tuition_category_id=1
category 1 = the default view = all 50 programs across every faculty.

Field mapping (API → our columns → UI label):
    admission_fees → payable_admission → "Payable During Admission"
    semester_cost  → avg_semester_fee  → "Average Semester Fees"
    tuition_fees   → total_tuition_fee → "Total Tuition Fees"
    total_fees     → total_program_fee → "Total Program Fees"
"""

import hashlib
import logging
import time

import requests

logger = logging.getLogger(__name__)

API_URL = "https://webbackend.daffodilvarsity.edu.bd/api/v1/public/tuition-fees"
_HEADERS = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
# tuition_category_id=1 is the default full list shown on the page.
_CATEGORIES = [1]


def is_available() -> bool:
    return True


def _fetch_category(cid: int, retries: int = 3) -> list[dict]:
    for attempt in range(1, retries + 1):
        try:
            r = requests.get(API_URL, params={"tuition_category_id": cid},
                             headers=_HEADERS, timeout=25)
            r.raise_for_status()
            return r.json().get("tuitions", []) or []
        except Exception as e:  # noqa: BLE001
            if attempt < retries:
                time.sleep(min(2 ** attempt, 6))
            else:
                logger.warning("Tuition API failed (cat %s): %s", cid, e)
    return []


def _norm(rec: dict) -> dict:
    """Map one API record to our structured fee row."""
    return {
        "external_id": rec.get("id"),
        "program_name": (rec.get("program_name") or "").strip(),
        "department_name": (rec.get("department_name") or "").strip(),
        "faculty_name": (rec.get("faculty_name") or "").strip(),
        "faculty_short": (rec.get("faculty_short_name") or "").strip(),
        "program_type": (rec.get("program_type") or "").strip(),
        "credit": str(rec.get("credit") or "").strip(),
        "majors": (rec.get("majors") or "").strip(),
        "duration": (rec.get("program_duration") or "").strip(),
        "payable_admission": str(rec.get("admission_fees") or "").strip(),
        "avg_semester_fee": str(rec.get("semester_cost") or "").strip(),
        "total_tuition_fee": str(rec.get("tuition_fees") or "").strip(),
        "total_program_fee": str(rec.get("total_fees") or "").strip(),
    }


def fetch_all() -> list[dict]:
    """All programs across the configured categories, de-duplicated by external_id."""
    seen, out = set(), []
    for cid in _CATEGORIES:
        for rec in _fetch_category(cid):
            row = _norm(rec)
            if row["external_id"] in seen or not row["program_name"]:
                continue
            seen.add(row["external_id"])
            out.append(row)
    return out


def content_hash(row: dict) -> str:
    key = "|".join(str(row.get(k, "")) for k in (
        "program_name", "payable_admission", "avg_semester_fee",
        "total_tuition_fee", "total_program_fee", "credit", "majors", "duration"))
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def sync(index_for_rag: bool = True) -> dict:
    """
    Fetch → upsert kb_tuition_fees (change detection) → optionally index into RAG
    so the chatbot answers fee questions with the real 4 figures.
    """
    from app.db import pg
    from app.repositories import tuition_fee_repo as repo, sources_repo
    from app.services import content_extractor_service as ce

    if not pg.is_configured():
        return {"success": False, "error": "DATABASE_URL not configured"}

    rows = fetch_all()
    if not rows:
        return {"success": False, "error": "no tuition data returned from API"}

    counts = {"created": 0, "updated": 0, "unchanged": 0}
    seen_ids = set()
    for row in rows:
        row["content_hash"] = content_hash(row)
        action = repo.upsert(row)
        counts[action] = counts.get(action, 0) + 1
        seen_ids.add(row["external_id"])
    deactivated = repo.deactivate_missing(seen_ids)

    embedded = 0
    if index_for_rag:
        try:
            from app.services import change_detection_service, incremental_index_service as idx
            src = sources_repo.get_by_category("fees")
            if src:
                source = src[0]
                docs = []
                for row in rows:
                    content = (
                        f"{row['program_name']} ({row['faculty_name']}) — Tuition Fees:\n"
                        f"- Payable During Admission: BDT {row['payable_admission']}\n"
                        f"- Average Semester Fees: BDT {row['avg_semester_fee']}\n"
                        f"- Total Tuition Fees: BDT {row['total_tuition_fee']}\n"
                        f"- Total Program Fees: BDT {row['total_program_fee']}\n"
                        f"- Credits: {row['credit']} | Duration: {row['duration']}"
                    )
                    docs.append({
                        "natural_key": f"{source['url']}#program-{row['external_id']}",
                        "title": f"{row['program_name']} Fees",
                        "category": "fees",
                        "content": content,
                        "content_hash": ce.sha256(content),
                        "token_estimate": ce.estimate_tokens(content),
                    })
                change = change_detection_service.apply(source["id"], source["url"], docs)
                idx.ensure_ready()
                for d in change["created"] + change["updated"]:
                    embedded += idx.index_document(d)["embedded"]
        except Exception as e:  # noqa: BLE001 - RAG indexing is best-effort
            logger.warning("Tuition RAG indexing failed: %s", e)

    return {"success": True, "programs": len(rows), **counts,
            "deactivated": deactivated, "rag_embedded": embedded}
