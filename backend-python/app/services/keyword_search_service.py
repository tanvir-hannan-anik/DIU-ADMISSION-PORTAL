"""
Keyword Search Service
----------------------
Matches short / keyword-style user messages (e.g. "Ai", "web", "game", "law")
to the DIU departments they relate to — even when the RAG vector search returns
nothing because a 1–2 word query embeds too weakly to clear RAG_MIN_SCORE.

Two matching layers:
  1. CURATED TOPIC MAP  — hand-tuned concept → departments with a human reason
                          and priority (this is what makes "Ai" resolve to
                          CIS → CSE → SWE, "game" → MCT, "law" → LL.B., etc.).
  2. INVERTED INDEX     — auto-built from the real departments_dataset.json
                          fields (careers, curriculum, labs, overview) so any
                          token the curated map misses can still match grounded
                          department data.

`build_context()` returns a grounded text block that is fused into the RAG
context, so the LLM recommends real departments using real facts — never
hallucinated. If nothing matches it returns ("", False, []) and the caller
falls back to normal RAG / legacy behaviour.
"""

import re
import logging
from collections import defaultdict

from app.services import knowledge_base_service as kb

logger = logging.getLogger(__name__)

# ── Curated topic map ─────────────────────────────────────────────────────────
# concept keyword/phrase -> list of (canonical short_name, reason, priority)
# Higher priority sorts first. Phrases (with spaces) are matched as substrings;
# single tokens are matched as whole words.
_TOPIC_MAP: dict[str, list[tuple[str, str, float]]] = {
    # ---- AI / ML / Data ------------------------------------------------------
    "ai": [
        ("CIS", "AI is built into the CIS curriculum (Artificial Intelligence, Machine Learning for IoT, Big Data Analytics) with a dedicated AI & Machine Learning Lab — open to ALL groups", 3.0),
        ("CSE", "strong algorithms + programming foundation, ideal for AI/ML engineering careers", 2.0),
        ("SWE", "best for building and shipping AI-powered software products", 1.0),
    ],
    "artificial intelligence": [("CIS", "dedicated AI courses & AI/ML Lab", 3.0), ("CSE", "core CS foundation for AI", 2.0), ("SWE", "deploy AI-powered software", 1.0)],
    "machine learning": [("CIS", "Machine Learning for IoT + AI courses and lab", 3.0), ("CSE", "math & algorithms base for ML", 2.0), ("SWE", "productionising ML systems", 1.0)],
    "ml": [("CIS", "ML courses and AI/ML Lab", 3.0), ("CSE", "algorithmic foundation for ML", 2.0), ("SWE", "ML-driven software delivery", 1.0)],
    "deep learning": [("CIS", "Advanced AI & Deep Learning in the CIS curriculum", 3.0), ("CSE", "strong CS base for deep learning", 2.0)],
    "data science": [("CIS", "Data Analysis + Big Data Analytics Lab", 3.0), ("CSE", "statistics & algorithms for data science", 2.0), ("SWE", "data-driven product engineering", 1.0)],
    "data": [("CIS", "Data Analysis, Big Data Analytics & Business Intelligence Lab", 2.5), ("CSE", "data structures & algorithms core", 1.5)],
    "analytics": [("CIS", "Big Data Analytics + Business Intelligence Lab", 2.5), ("CSE", "analytical/algorithmic foundation", 1.2)],
    "data analyst": [("CIS", "Data Analyst is a named CIS career path", 3.0)],
    "business intelligence": [("CIS", "CIS has the only dedicated Business Intelligence Lab at DIU", 3.0)],
    "bi": [("CIS", "dedicated Business Intelligence Lab", 3.0)],
    "neural": [("CIS", "AI & neural network coursework", 2.5), ("CSE", "CS foundation for neural nets", 1.5)],
    "nlp": [("CIS", "NLP is covered in the AI & ML Lab research areas", 3.0), ("CSE", "language-processing algorithms base", 1.5)],
    "computer vision": [("CIS", "computer vision in the AI & ML Lab", 3.0), ("CSE", "image/algorithm foundation", 1.5)],

    # ---- Software / Web / Systems -------------------------------------------
    "software": [("SWE", "Software Engineering — the whole degree is about building software", 3.0), ("CSE", "strong software + engineering base", 2.0), ("CIS", "applied software & information systems", 1.5)],
    "programming": [("CSE", "core programming & problem solving", 2.5), ("SWE", "software construction focus", 2.5), ("CIS", "applied programming", 1.5)],
    "coding": [("CSE", "programming-heavy curriculum", 2.5), ("SWE", "software engineering practice", 2.5), ("CIS", "applied coding", 1.5)],
    "developer": [("SWE", "trains professional software developers", 2.5), ("CSE", "software developer career path", 2.5), ("CIS", "Software/Web Developer career path", 2.0)],
    "web": [("CIS", "Website Development, Web Engineering + Web Engineering Lab", 2.5), ("CSE", "web technologies on a strong CS base", 2.0), ("SWE", "web application engineering", 2.0)],
    "app": [("SWE", "mobile & software app engineering", 2.5), ("CIS", "Mobile Application Development course", 2.0), ("CSE", "app development on CS foundation", 1.5)],
    "mobile": [("CIS", "Mobile Application Development course", 2.5), ("SWE", "mobile app engineering", 2.0)],
    "cyber": [("CSE", "security foundations on a CS core", 2.5), ("CIS", "Cybersecurity Fundamentals + Network Security & Cryptography Lab", 2.5)],
    "cybersecurity": [("CSE", "security on a CS core", 2.5), ("CIS", "Cybersecurity + Network Security Lab", 2.5)],
    "security": [("CIS", "Network Security & Cryptography Lab", 2.2), ("CSE", "security-focused CS courses", 2.2)],
    "network": [("CSE", "Computer Networks + Networks Lab", 2.5), ("CIS", "Computer Networks course", 2.0)],
    "networking": [("CSE", "Computer Networks Lab", 2.5), ("CIS", "Computer Networks course", 2.0)],
    "cloud": [("CIS", "Cloud Computing course", 2.5), ("CSE", "distributed systems foundation", 1.5)],
    "iot": [("CIS", "IoT & Embedded Systems course + lab", 2.5), ("RME", "embedded & robotics systems", 2.0)],
    "database": [("CIS", "Database Management + DBMS Lab", 2.5), ("CSE", "database systems on a CS core", 2.0)],

    # ---- Multimedia / Design / Games ----------------------------------------
    "game": [("MCT", "Game Design, AR/VR development & Animation labs", 3.0)],
    "gaming": [("MCT", "Gaming & Interactive Media career track", 3.0)],
    "animation": [("MCT", "3D Animation, Character Animation & VFX labs", 3.0)],
    "vfx": [("MCT", "dedicated VFX Lab and film/animation careers", 3.0)],
    "3d": [("MCT", "3D Animation Lab", 3.0)],
    "film": [("MCT", "Film production, VFX & Animation track", 3.0)],
    "graphics": [("MCT", "Graphic Design fundamentals + Motion Graphics careers", 3.0)],
    "design": [("MCT", "creative & graphic design foundation", 2.2), ("B.Arch", "architectural design", 1.5)],
    "multimedia": [("MCT", "Multimedia and Creative Technology", 3.0)],
    "creative": [("MCT", "Creative Technology degree", 2.5)],
    "ar": [("MCT", "AR/VR Developer track", 2.5)],
    "vr": [("MCT", "AR/VR Developer track", 2.5)],

    # ---- Business ------------------------------------------------------------
    "business": [("BBA", "Bachelor of Business Administration — core business degree", 3.0), ("BE", "Innovation & Entrepreneurship for business builders", 1.5)],
    "management": [("BBA", "management-focused BBA", 2.5)],
    "marketing": [("BBA in Marketing", "specialised BBA in Marketing", 3.0), ("BBA", "marketing within general BBA", 1.5)],
    "finance": [("BBA in Finance & Banking", "specialised BBA in Finance & Banking", 3.0), ("BBA", "finance within general BBA", 1.5)],
    "banking": [("BBA in Finance & Banking", "Finance & Banking specialisation", 3.0)],
    "accounting": [("BBA", "BBA in Accounting specialisation", 2.8)],
    "entrepreneur": [("BE", "Bachelor of Innovation and Entrepreneurship", 3.0), ("BBA", "entrepreneurship within BBA", 1.5)],
    "entrepreneurship": [("BE", "Bachelor of Innovation and Entrepreneurship", 3.0)],
    "startup": [("BE", "Innovation & Entrepreneurship for founders", 3.0)],

    # ---- Health / Life sciences ---------------------------------------------
    "pharmacy": [("B. Pharm (Hons.)", "Bachelor of Pharmacy", 3.0)],
    "pharmacist": [("B. Pharm (Hons.)", "Bachelor of Pharmacy", 3.0)],
    "medicine": [("B. Pharm (Hons.)", "pharmaceutical / drug science", 2.5), ("BPH", "Public Health", 2.0)],
    "doctor": [("B. Pharm (Hons.)", "pharmacy / medicine pathway", 2.5), ("BPH", "Public Health career", 2.0), ("NFE", "clinical nutrition pathway", 1.0)],
    "nurse": [("BPH", "Public Health / healthcare pathway", 2.5), ("NFE", "clinical nutrition pathway", 1.5)],
    "hospital": [("BPH", "Public Health & hospital management", 2.5)],
    "drug": [("B. Pharm (Hons.)", "pharmaceutical science", 3.0)],
    "health": [("BPH", "Bachelor of Public Health", 3.0), ("NFE", "Nutrition & Food (health-linked)", 1.5)],
    "public health": [("BPH", "Bachelor of Public Health", 3.0)],
    "nutrition": [("NFE", "Nutrition & Food Engineering", 3.0)],
    "food": [("NFE", "Nutrition & Food Engineering", 3.0)],
    "genetic": [("GEB", "Genetic Engineering and Biotechnology", 3.0)],
    "biotech": [("GEB", "Genetic Engineering and Biotechnology", 3.0)],
    "biology": [("GEB", "Genetic Engineering & Biotechnology", 2.5)],

    # ---- Engineering ---------------------------------------------------------
    "electrical": [("EEE", "Electrical & Electronic Engineering", 3.0)],
    "electronics": [("EEE", "Electrical & Electronic Engineering", 3.0), ("ICE", "Information & Communication Engineering", 2.0)],
    "power": [("EEE", "power systems focus in EEE", 2.5)],
    "telecom": [("ICE", "Information & Communication Engineering", 3.0), ("EEE", "telecom within EEE", 1.5)],
    "communication engineering": [("ICE", "Information & Communication Engineering", 3.0)],
    "robot": [("RME", "Robotics and Mechatronics Engineering", 3.0)],
    "robotics": [("RME", "Robotics and Mechatronics Engineering", 3.0)],
    "mechatronics": [("RME", "Robotics and Mechatronics Engineering", 3.0)],
    "automation": [("RME", "robotics & automation systems", 2.5)],
    "civil": [("CE", "Civil Engineering", 3.0)],
    "construction": [("CE", "Civil Engineering — construction & infrastructure", 3.0)],
    "structural": [("CE", "structural / civil engineering", 3.0)],
    "architecture": [("B.Arch", "Bachelor of Architecture", 3.0)],
    "architect": [("B.Arch", "Bachelor of Architecture", 3.0)],
    "textile": [("TE", "Textile Engineering", 3.0)],
    "fashion": [("TE", "textile & apparel engineering", 2.0)],
    "garments": [("TE", "textile / garments engineering", 2.5)],

    # ---- Environment ---------------------------------------------------------
    "environment": [("ESDM", "Environmental Science & Disaster Management", 3.0)],
    "environmental": [("ESDM", "Environmental Science & Disaster Management", 3.0)],
    "climate": [("ESDM", "climate & disaster management", 2.5)],
    "disaster": [("ESDM", "Disaster Management", 3.0)],

    # ---- Humanities / Social -------------------------------------------------
    "law": [("LL.B. (Hons.)", "Bachelor of Laws (LL.B.)", 3.0)],
    "lawyer": [("LL.B. (Hons.)", "Bachelor of Laws (LL.B.)", 3.0)],
    "legal": [("LL.B. (Hons.)", "Bachelor of Laws (LL.B.)", 3.0)],
    "english": [("English", "B.A. (Hons) in English", 3.0)],
    "literature": [("English", "English literature & language", 2.5)],
    "journalism": [("JMC", "Journalism, Media & Communication", 3.0)],
    "media": [("JMC", "Journalism, Media & Communication", 2.8), ("MCT", "digital media & multimedia", 1.5)],
    "news": [("JMC", "Journalism & news media", 2.5)],
    "reporter": [("JMC", "Journalism career path", 2.5)],

    # ---- Misc lifestyle ------------------------------------------------------
    "sports": [("PESS", "Physical Education and Sports Science", 3.0)],
    "physical education": [("PESS", "Physical Education and Sports Science", 3.0)],
    "fitness": [("PESS", "sports science & fitness", 2.5)],
    "tourism": [("BTHM", "Tourism and Hospitality Management", 3.0)],
    "hospitality": [("BTHM", "Tourism and Hospitality Management", 3.0)],
    "hotel": [("BTHM", "hospitality & hotel management", 2.5)],
    "real estate": [("BRE", "Bachelor of Real Estate", 3.0)],
    "property": [("BRE", "Real Estate", 2.5)],
}

# Common English stop-words we never treat as topic tokens.
_STOP = {
    "a", "an", "the", "is", "are", "am", "for", "to", "of", "in", "on", "and",
    "or", "me", "my", "i", "you", "your", "want", "need", "about", "tell",
    "what", "which", "can", "do", "does", "with", "best", "good", "want",
    "study", "read", "learn", "know", "please", "hi", "hello", "hey",
}

# Intent keywords — when any of these appears, the user is asking for a SPECIFIC
# fact (fee, eligibility, …), so we answer directly instead of dropping into
# proactive "recommend departments" mode. See is_interest_query().
_INTENT_KEYWORDS = {
    "fee", "fees", "tuition", "cost", "price", "pricing", "eligibility",
    "eligible", "require", "required", "requirement", "requirements", "waiver",
    "scholarship", "credit", "credits", "duration", "semester", "admission",
    "admit", "apply", "application", "gpa", "cgpa", "result", "results",
    "curriculum", "syllabus", "course", "courses", "faculty", "teacher",
    "teachers", "head", "seat", "seats", "intake", "deadline", "how", "when",
    "where", "who", "why", "compare", "comparison", "vs",
}

# Fields to index (field -> weight) for the auto inverted index.
_INDEX_FIELDS = {
    "career_opportunities": 1.3,
    "curriculum_highlights": 1.0,
    "labs": 1.0,
    "research_areas": 1.0,
    "projects": 0.8,
    "overview": 0.6,
    "facilities": 0.5,
}

_inverted: dict[str, dict[str, float]] | None = None  # token -> {short_name: weight}


def _records() -> list[dict]:
    recs = kb._load_records()  # cached loader in knowledge_base_service
    return recs or []


def _find_record(short_name: str) -> dict | None:
    """First dataset record whose short_name (or department name) matches."""
    sn = short_name.lower()
    for r in _records():
        if (r.get("short_name") or "").lower() == sn:
            return r
    for r in _records():
        if sn in (r.get("department") or "").lower():
            return r
    return None


def _tokenize(text: str) -> list[str]:
    return [t for t in re.sub(r"[^\w\s]", " ", text.lower()).split() if t]


def _singular(token: str) -> str:
    """Cheap plural → singular so 'robots' matches the curated 'robot' key."""
    if len(token) > 4 and token.endswith("ies"):
        return token[:-3] + "y"
    if len(token) > 3 and token.endswith("s") and not token.endswith("ss"):
        return token[:-1]
    return token


_dept_code_cache: set[str] | None = None


def _dept_codes() -> set[str]:
    """Lowercase set of department short-name codes (first token), e.g. 'cse'."""
    global _dept_code_cache
    if _dept_code_cache is None:
        codes = set()
        for r in _records():
            sn = r.get("short_name") or ""
            if sn:
                codes.add(sn.lower())
                codes.add(sn.lower().split()[0].strip("."))
        _dept_code_cache = {c for c in codes if c}
    return _dept_code_cache


def _build_inverted() -> dict[str, dict[str, float]]:
    """Build token -> {short_name: weight} from real department fields."""
    idx: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for r in _records():
        sn = r.get("short_name") or r.get("department")
        if not sn:
            continue
        for field, weight in _INDEX_FIELDS.items():
            val = r.get(field)
            if not val:
                continue
            text = " ".join(map(str, val)) if isinstance(val, list) else str(val)
            for tok in set(_tokenize(text)):
                if len(tok) < 4 or tok in _STOP:
                    continue
                idx[tok][sn] += weight
    return {k: dict(v) for k, v in idx.items()}


def _inverted_index() -> dict[str, dict[str, float]]:
    global _inverted
    if _inverted is None:
        _inverted = _build_inverted()
        logger.info("Keyword inverted index built: %d tokens", len(_inverted))
    return _inverted


def refresh():
    """Drop caches so the next query rebuilds the index (call after ingestion)."""
    global _inverted, _dept_code_cache
    _inverted = None
    _dept_code_cache = None


def is_short_query(query: str) -> bool:
    """A brief / keyword-style message (few words)."""
    words = _tokenize(query)
    return 0 < len(words) <= 4 and len(query.strip()) <= 25


def is_interest_query(query: str) -> bool:
    """
    True only for a short, INTEREST-style message ("Ai", "game", "web") that
    deserves a proactive department recommendation.

    Returns False for:
      • short but SPECIFIC factual questions ("cse fee", "law eligibility") —
        the user wants a direct answer, not a recommendation.
      • bare department codes ("cse", "mct") — the user wants that department's
        details, so answer normally.
    """
    if not is_short_query(query):
        return False
    tokens = set(_tokenize(query))
    if not tokens:
        return False
    if tokens & _INTENT_KEYWORDS:
        return False
    meaningful = tokens - _STOP
    if meaningful and meaningful <= _dept_codes():
        return False
    return True


def match(query: str, limit: int = 4) -> list[dict]:
    """
    Return ranked department matches for a query:
      [{short_name, department, score, reasons: [...]}]
    Empty list when nothing meaningful matches.
    """
    q = query.lower().strip()
    if not q:
        return []
    tokens = set(_tokenize(q))
    meaningful = tokens - _STOP
    if not meaningful:
        return []
    # Include singular forms so plurals ("robots", "games") match curated keys.
    meaningful_norm = meaningful | {_singular(t) for t in meaningful}

    scores: dict[str, float] = defaultdict(float)
    reasons: dict[str, set] = defaultdict(set)

    # 1) Direct department-code match (e.g. "cse", "swe", "law").
    #    Codes match as WHOLE WORDS only — a naive substring check makes 2-letter
    #    codes like "TE"/"CE" match inside unrelated words ("sysTEms", "sCiEnce").
    #    Multi-word short names ("BBA in Marketing") may still match as a phrase.
    for r in _records():
        sn = r.get("short_name") or ""
        if not sn:
            continue
        sn_l = sn.lower()
        code = sn_l.split()[0].strip(".")
        code_hit = code in meaningful
        phrase_hit = " " in sn_l and sn_l in q
        if code and (code_hit or phrase_hit):
            scores[sn] += 10.0
            reasons[sn].add(f"you asked about {sn}")

    # 2) Curated topic map — phrases first (substring), then single tokens.
    #    Curated matches carry a strong, hand-tuned signal.
    for key, entries in _TOPIC_MAP.items():
        hit = (key in q) if " " in key else (key in meaningful_norm)
        if not hit:
            continue
        for sn, reason, prio in entries:
            scores[sn] += prio
            reasons[sn].add(reason)

    # 3) Auto inverted index — grounded fallback for uncovered tokens. Kept at a
    #    low weight so it enriches (never overrides) curated priorities.
    idx = _inverted_index()
    for tok in meaningful:
        for sn, w in idx.get(tok, {}).items():
            scores[sn] += 0.5 * w
            reasons[sn].add(f"'{tok}' appears in {sn} curriculum/careers")

    if not scores:
        return []

    # Drop weak tail matches so index noise (e.g. BBA for "network security")
    # doesn't surface next to strong curated/direct matches.
    top_score = max(scores.values())
    cutoff = 0.3 * top_score
    filtered = {sn: sc for sn, sc in scores.items() if sc >= cutoff}
    ranked = sorted(filtered.items(), key=lambda kv: kv[1], reverse=True)[:limit]
    out = []
    for sn, sc in ranked:
        rec = _find_record(sn)
        out.append({
            "short_name": sn,
            "department": (rec.get("department") if rec else sn),
            "score": round(sc, 2),
            "reasons": sorted(reasons[sn], key=len, reverse=True)[:2],
        })
    return out


def _facts(rec: dict) -> str:
    """Compact grounded fact line for a matched department."""
    parts = []
    if rec.get("degree"):
        parts.append(f"Degree: {rec['degree']}")
    if rec.get("semester_fee"):
        parts.append(f"Semester fee: BDT {rec['semester_fee']}")
    if rec.get("eligibility"):
        parts.append(f"Eligibility: {str(rec['eligibility'])[:110]}")
    careers = rec.get("career_opportunities")
    if careers:
        c = ", ".join(map(str, careers)) if isinstance(careers, list) else str(careers)
        parts.append(f"Careers: {c[:160]}")
    return " | ".join(parts)


def build_context(query: str) -> tuple[str, bool, list[str]]:
    """
    Grounded context block for the matched departments, fused into RAG context.
    Returns (context_text, matched_bool, [short_names]). ("", False, []) if none.
    """
    matches = match(query)
    if not matches:
        return "", False, []

    lines = [
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "KEYWORD-MATCHED DEPARTMENTS (ranked recommendations for this query)",
        "These departments relate to the user's message. Recommend them in this "
        "order, explaining WHY each fits, using only the facts below.",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    ]
    for i, m in enumerate(matches, 1):
        rec = _find_record(m["short_name"])
        why = "; ".join(m["reasons"]) if m["reasons"] else ""
        lines.append(f"\n{i}. {m['department']} ({m['short_name']})")
        if why:
            lines.append(f"   Why: {why}")
        if rec:
            facts = _facts(rec)
            if facts:
                lines.append(f"   {facts}")
    names = [m["short_name"] for m in matches]
    logger.info("Keyword match for %r -> %s", query[:40], names)
    return "\n".join(lines), True, names
