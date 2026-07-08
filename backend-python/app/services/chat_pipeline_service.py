"""
Chat Pipeline Service — 6-layer token-optimization orchestrator
===============================================================
Runs a user message through the layers in order, stopping at the first that can
answer so the LLM is only ever called as a last resort:

  Layer 1  intent_service          greeting/thanks/bye/smalltalk → canned reply
  Layer 2  faq_service             structured FAQ match          → stored answer
  Layer 3  semantic_cache_service  >=95% similar past question    → cached answer
  Layer 4  rag_service (via groq)  retrieve top-K grounded chunks
  Layer 5  context_compression     inside rag_service.build_context
  Layer 6  groq_service            LLM generation (then answer is cached)

Every call is logged to kb_query_log with token accounting, and the durable
metric counters (kb_metrics) are updated so the admin dashboard can show cache
hit ratio and tokens saved. Degrades safely: any layer failure falls through to
the next, and the whole thing falls back to a plain LLM call if the DB is down.
"""

import logging
import time

from app.config.settings import Config
from app.db import pg
from app.services import (
    question_normalizer, intent_service, faq_service,
    semantic_cache_service, embedding_service, vector_store_service,
)

logger = logging.getLogger(__name__)

# Rough token cost of a full RAG LLM call we AVOID on a cache/FAQ/intent hit:
# the RAG system prompt (templates + context) is large, so a hit saves a lot.
_AVG_PROMPT_TOKENS_SAVED = 1400


def _metric(key: str, by: int = 1) -> None:
    try:
        from app.repositories import metrics_repo
        metrics_repo.incr(key, by)
    except Exception:  # noqa: BLE001
        pass


def _log(question, norm, source, layer, similarity, tp, tc, saved, ms) -> None:
    try:
        from app.repositories import query_log_repo
        query_log_repo.log(question, norm, source, layer, similarity, tp, tc, saved, ms)
    except Exception:  # noqa: BLE001
        pass


def _cached_result(answer: str, source: str, model: str, extra: dict | None = None) -> dict:
    out = {
        "success": True,
        "response": answer,
        "modelUsed": model,
        "status": "success",
        "ragMode": source,
        "answerSource": source,
        "cached": source != "rag_llm",
        "tokensUsed": {"prompt": 0, "completion": 0, "total": 0},
        "confidence": 0.95,
    }
    if extra:
        out.update(extra)
    return out


def answer(groq_service, prompt: str, context: str = "", module_type: str = "general",
           history: list | None = None, user_id: str = "anonymous") -> dict:
    """
    Main entry. `groq_service` is the initialised GroqService (Layer 6). Returns
    the same dict shape the frontend already consumes, plus `answerSource`.
    """
    started = time.time()
    history = history or []
    has_history = bool(history)
    norm = question_normalizer.normalize(prompt)

    def elapsed_ms() -> int:
        return int((time.time() - started) * 1000)

    # ── Layer 1: Intent (always on; greetings are context-free) ───────────────
    intent = intent_service.detect(prompt)
    if intent:
        _metric("cache_hits"); _metric("tokens_saved", _AVG_PROMPT_TOKENS_SAVED)
        _log(prompt, norm, "intent", 1, None, 0, 0, _AVG_PROMPT_TOKENS_SAVED, elapsed_ms())
        return _cached_result(intent["reply"], "intent", "intent-layer",
                              {"intent": intent["intent"]})

    # Layers 2 & 3 are context-sensitive → only for standalone questions.
    query_vec = None
    if not has_history and pg.is_configured():
        # ── Layer 2: FAQ ─────────────────────────────────────────────────────
        faq = faq_service.match(prompt)
        if faq:
            _metric("cache_hits"); _metric("tokens_saved", _AVG_PROMPT_TOKENS_SAVED)
            _log(prompt, norm, "faq", 2, faq.get("score"), 0, 0,
                 _AVG_PROMPT_TOKENS_SAVED, elapsed_ms())
            return _cached_result(faq["answer"], "faq", "faq-layer",
                                  {"faqId": faq["faq_id"], "match": faq["matched"]})

        # ── Layer 3: Semantic cache ──────────────────────────────────────────
        if semantic_cache_service.is_available():
            try:
                query_vec = embedding_service.embed_text(prompt, task_type="RETRIEVAL_QUERY")
                cached = semantic_cache_service.lookup(query_vec)
                if cached:
                    _metric("cache_hits"); _metric("tokens_saved", _AVG_PROMPT_TOKENS_SAVED)
                    _log(prompt, norm, "semantic_cache", 3, cached.get("score"),
                         0, 0, _AVG_PROMPT_TOKENS_SAVED, elapsed_ms())
                    return _cached_result(cached["answer"], "semantic_cache", "semantic-cache",
                                          {"similarity": round(cached.get("score", 0), 4)})
            except Exception as e:  # noqa: BLE001
                logger.warning("Layer 3 embed/lookup failed: %s", e)

    # ── Layers 4–6: RAG retrieval + compression + LLM ─────────────────────────
    result = groq_service.process_prompt(prompt, context, module_type, history)
    tokens = result.get("tokensUsed", {})
    tp, tc = tokens.get("prompt", 0), tokens.get("completion", 0)
    _metric("cache_misses"); _metric("total_llm_calls")
    _log(prompt, norm, "rag_llm", 6, None, tp, tc, 0, elapsed_ms())
    result["answerSource"] = "rag_llm"

    # ── Store the answer in the semantic cache for next time ──────────────────
    if not has_history and result.get("success") and semantic_cache_service.is_available():
        try:
            if query_vec is None:
                query_vec = embedding_service.embed_text(prompt, task_type="RETRIEVAL_QUERY")
            doc_ids = _grounding_doc_ids(query_vec)
            semantic_cache_service.store(
                norm, prompt, result.get("response", ""), query_vec,
                doc_ids, category=module_type,
            )
        except Exception as e:  # noqa: BLE001 - caching is best-effort
            logger.warning("Post-LLM cache store failed: %s", e)

    return result


def _grounding_doc_ids(query_vec: list[float], limit: int = 3) -> list[str]:
    """Document ids of the top KB chunks — tags the cache entry for invalidation."""
    try:
        hits = vector_store_service.search(query_vec, limit=limit, min_score=Config.RAG_MIN_SCORE)
        ids = []
        for h in hits:
            did = h.get("payload", {}).get("document_id")
            if did and did not in ids:
                ids.append(did)
        return ids
    except Exception:  # noqa: BLE001
        return []
