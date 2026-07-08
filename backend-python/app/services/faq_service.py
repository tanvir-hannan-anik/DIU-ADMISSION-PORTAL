"""
FAQ Service — Token-optimization Layer 2
----------------------------------------
Searches the structured FAQ table. On a confident match it returns the stored
answer with NO LLM call. Two-stage match:

  1. Exact normalized-question match (fast, precise).
  2. Keyword-overlap match with a minimum-overlap guard so unrelated questions
     don't return a wrong FAQ.

Returns {"answer", "faq_id", "matched": "exact"|"keyword", "score"} or None.
"""

import logging

from app.db import pg
from app.services import question_normalizer
from app.repositories import faq_repo

logger = logging.getLogger(__name__)

_MIN_OVERLAP = 2         # need >=2 shared keywords for a keyword match
_MIN_COVERAGE = 0.5      # matched keywords must cover >=50% of the query tokens
_STOP = {"the", "a", "an", "is", "are", "of", "for", "to", "in", "on", "and",
         "or", "me", "my", "i", "you", "what", "how", "much", "do", "does"}


def _tokens(normalized_q: str) -> list[str]:
    return [t for t in normalized_q.split() if t not in _STOP and len(t) > 1]


def match(message: str) -> dict | None:
    if not pg.is_configured():
        return None
    norm = question_normalizer.normalize(message)
    if not norm:
        return None

    try:
        exact = faq_repo.get_by_normalized(norm)
        if exact:
            faq_repo.increment_hit(exact["id"])
            return {"answer": exact["answer"], "faq_id": exact["id"],
                    "matched": "exact", "score": 1.0}

        tokens = _tokens(norm)
        candidates = faq_repo.search_keywords(tokens, limit=5)
        if candidates and tokens:
            best = candidates[0]
            overlap = int(best.get("overlap", 0))
            coverage = overlap / len(tokens)
            # Require both a minimum overlap AND that the matched keywords cover a
            # good fraction of the query — otherwise a couple of shared common
            # words (e.g. "cse", "requirement") would wrongly shadow the LLM.
            if overlap >= _MIN_OVERLAP and coverage >= _MIN_COVERAGE:
                faq_repo.increment_hit(best["id"])
                return {"answer": best["answer"], "faq_id": best["id"],
                        "matched": "keyword", "score": round(coverage, 3)}
    except Exception as e:  # noqa: BLE001 - FAQ layer must never break chat
        logger.warning("FAQ match failed: %s", e)
    return None
