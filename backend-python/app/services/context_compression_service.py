"""
Context Compression Service — Token-optimization Layer 5
--------------------------------------------------------
Shrinks the retrieved context before it reaches the LLM:
  • Drop exact + near-duplicate chunks (same info retrieved twice).
  • Merge chunks that heavily overlap (one is largely contained in another).
  • Cap total context length so the prompt stays small.

Pure string work — no model calls. Returns a compacted list of text blocks.
"""

import re

_MAX_CONTEXT_CHARS = 4000     # hard cap on combined context sent to the LLM


def _normalize(s: str) -> str:
    return re.sub(r"\s+", " ", s.lower()).strip()


def _shingles(s: str, n: int = 4) -> set:
    toks = _normalize(s).split()
    return {" ".join(toks[i:i + n]) for i in range(max(0, len(toks) - n + 1))} or {_normalize(s)}


def _similar(a: str, b: str, threshold: float = 0.7) -> bool:
    sa, sb = _shingles(a), _shingles(b)
    if not sa or not sb:
        return False
    inter = len(sa & sb)
    smaller = min(len(sa), len(sb))
    return smaller > 0 and (inter / smaller) >= threshold


def compress(blocks: list[str], max_chars: int = _MAX_CONTEXT_CHARS) -> list[str]:
    """
    Deduplicate/merge overlapping context blocks and cap total size.
    Preserves order and keeps the longer block when two overlap.
    """
    kept: list[str] = []
    seen_exact: set[str] = set()

    for block in blocks:
        b = block.strip()
        if not b:
            continue
        norm = _normalize(b)
        if norm in seen_exact:
            continue
        # If this block is near-duplicate of a kept one, keep the longer.
        merged = False
        for i, existing in enumerate(kept):
            if _similar(b, existing):
                if len(b) > len(existing):
                    kept[i] = b
                    seen_exact.add(norm)
                merged = True
                break
        if not merged:
            kept.append(b)
            seen_exact.add(norm)

    # Enforce total character budget.
    out, total = [], 0
    for b in kept:
        if total + len(b) > max_chars:
            remaining = max_chars - total
            if remaining > 200:
                out.append(b[:remaining])
            break
        out.append(b)
        total += len(b)
    return out


def compress_text(context: str, max_chars: int = _MAX_CONTEXT_CHARS) -> str:
    """Compress a single context string split on blank lines."""
    blocks = [b for b in context.split("\n\n") if b.strip()]
    return "\n\n".join(compress(blocks, max_chars))
