"""
Question Normalizer
-------------------
Normalizes a user question before any lookup so that "CSE fee", "CSE Fee?",
"cse fees", and "how much is cse" collapse toward the same cache/FAQ key.

Steps: lowercase → strip punctuation → collapse whitespace → expand a small
synonym map → drop leading filler. Cheap, deterministic, no external calls.
"""

import re

# Synonym / canonicalisation map (token → canonical token). Keep small + safe.
_SYNONYMS = {
    "fees": "fee", "tuition": "fee", "cost": "fee", "costs": "fee",
    "price": "fee", "pricing": "fee",
    "eligibility": "eligible", "requirements": "requirement",
    "requirement": "requirement", "require": "requirement",
    "scholarships": "scholarship", "waivers": "waiver", "waver": "waiver",
    "departments": "department", "dept": "department", "depts": "department",
    "faculties": "faculty", "teachers": "faculty", "teacher": "faculty",
    "admissions": "admission", "apply": "admission", "applying": "admission",
    "cgpa": "gpa",
}

# Department code expansions so "cse" and "computer science" align.
_DEPT_EXPAND = {
    "cse": "computer science engineering",
    "swe": "software engineering",
    "cis": "computing information system",
    "eee": "electrical electronic engineering",
    "bba": "business administration",
    "mct": "multimedia creative technology",
}

_FILLER_PREFIX = re.compile(
    r"^(please |can you |could you |i want to know |tell me |what is |what are |"
    r"how much is |how much are |how to |do you know |i need |give me )+"
)


def normalize(text: str) -> str:
    if not text:
        return ""
    t = text.lower().strip()
    t = _FILLER_PREFIX.sub("", t)
    t = re.sub(r"[^\w\s]", " ", t)          # strip punctuation
    t = re.sub(r"\s+", " ", t).strip()
    tokens = [_SYNONYMS.get(tok, tok) for tok in t.split()]
    # expand dept codes to their words (keep the code too for recall)
    expanded: list[str] = []
    for tok in tokens:
        expanded.append(tok)
        if tok in _DEPT_EXPAND:
            expanded.extend(_DEPT_EXPAND[tok].split())
    return " ".join(expanded).strip()


def key(text: str) -> str:
    """A stable exact-match key: normalized tokens sorted-unique-free, order kept."""
    return normalize(text)
