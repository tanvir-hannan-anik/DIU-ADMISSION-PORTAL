"""
Change Detection Service
------------------------
Given a source and the freshly-extracted documents, decide per document whether
to SKIP (unchanged), INSERT (new) or UPDATE (hash changed), and DEACTIVATE any
previously-active document that vanished from the site.

The SHA-256 comparison itself lives in documents_repo.upsert (single source of
truth). This module is the per-source coordinator that turns a page's extracted
docs into a change set the indexer can act on — so unchanged pages never reach
the embedding layer.
"""

import logging
from app.repositories import documents_repo

logger = logging.getLogger(__name__)


def apply(source_id: int, source_url: str, extracted_docs: list[dict]) -> dict:
    """
    Apply change detection for one source's extracted documents.

    Returns:
      {
        "created":   [document_row, ...],   # need embedding
        "updated":   [document_row, ...],   # need re-embedding (delete old first)
        "unchanged": [document_row, ...],   # skipped entirely
        "deactivated":[document_row, ...],  # vectors must be deleted
        "counts": {created, updated, unchanged, deactivated},
      }
    """
    created, updated, unchanged = [], [], []
    seen_keys: set[str] = set()

    for doc in extracted_docs:
        seen_keys.add(doc["natural_key"])
        result = documents_repo.upsert(source_id, source_url, doc)
        action, row = result["action"], result["document"]
        if action == "created":
            created.append(row)
        elif action == "updated":
            updated.append(row)
        else:
            unchanged.append(row)

    deactivated = documents_repo.deactivate_missing(source_id, seen_keys)

    counts = {
        "created": len(created),
        "updated": len(updated),
        "unchanged": len(unchanged),
        "deactivated": len(deactivated),
    }
    logger.info("Change detection [source %s]: %s", source_id, counts)
    return {
        "created": created,
        "updated": updated,
        "unchanged": unchanged,
        "deactivated": deactivated,
        "counts": counts,
    }
