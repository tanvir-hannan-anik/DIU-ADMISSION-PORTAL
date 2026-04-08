"""
Knowledge Base Service
-----------------------
Builds a dynamic AI system prompt from the departments_dataset.json.
Supports smart query-based filtering to minimise token usage per request.
"""

import os
import json
import logging
from app.config.settings import Config

logger = logging.getLogger(__name__)

# Cache: formatted full-KB string + raw department records
_kb_cache: str = ""
_dept_records: list = []   # raw dicts for smart filtering

# General-topic keywords → include top popular departments
_GENERAL_KEYWORDS = {
    'all', 'list', 'every', 'which', 'what', 'available', 'programs',
    'courses', 'departments', 'compare', 'best', 'recommend', 'suggest',
    'admission', 'eligibility', 'fee', 'fees', 'waiver', 'scholarship',
    'apply', 'application', 'join', 'enroll', 'intake', 'seat',
}

# Top departments to include for general queries (by short_name)
_TOP_DEPTS = {'CSE', 'SWE', 'CIS', 'EEE', 'BBA', 'CE', 'MCT', 'Pharmacy'}


def _format_department(dept: dict) -> str:
    """Format one department as a compact single-line record for the AI prompt."""
    name = dept.get('department') or dept.get('short_name') or 'Unknown'
    short = dept.get('short_name', '')
    label = f"{name}" + (f" ({short})" if short and short != name else "")

    parts = []
    if dept.get('degree'):        parts.append(f"Degree:{dept['degree']}")
    if dept.get('duration'):      parts.append(f"Duration:{dept['duration']}")
    if dept.get('total_credit'):  parts.append(f"Credits:{dept['total_credit']}")
    if dept.get('semester_fee'):  parts.append(f"SemFee:BDT {dept['semester_fee']}")
    if dept.get('total_fee'):     parts.append(f"TotalFee:BDT {dept['total_fee']}")
    if dept.get('admission_fee'): parts.append(f"AdmFee:BDT {dept['admission_fee']}")
    if dept.get('eligibility'):   parts.append(f"Eligibility:{dept['eligibility'][:120]}")
    if dept.get('intake'):        parts.append(f"Intake:{dept['intake']}")

    if dept.get('labs'):
        parts.append(f"Labs:{', '.join(dept['labs'][:5])}")
    if dept.get('career_opportunities'):
        parts.append(f"Careers:{', '.join(dept['career_opportunities'][:8])}")
    if dept.get('facilities'):
        parts.append(f"Facilities:{', '.join(dept['facilities'][:4])}")
    if dept.get('waiver_info'):
        parts.append(f"Waivers:{dept['waiver_info'][:100]}")

    return f"• {label} | " + " | ".join(parts)


def _build_section(depts: list, label: str = "") -> str:
    if not depts:
        return ""
    lines = [
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        f"DEPARTMENT DATA{' (' + label + ')' if label else ''} — Auto-extracted from official flyers",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
    ]
    for dept in depts:
        lines.append(_format_department(dept))
        lines.append("")
    return '\n'.join(lines)


def _load_records() -> list:
    """Load raw dept records from dataset file."""
    dataset_file = Config.KB_DATASET_FILE
    if not os.path.exists(dataset_file):
        return []
    try:
        with open(dataset_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('departments', [])
    except Exception as e:
        logger.error(f"Failed to load dataset: {e}")
        return []


def build_kb_section() -> str:
    """Build full formatted KB string from all departments."""
    records = _load_records()
    if not records:
        logger.info("No dataset found — KB empty until ingestion runs.")
        return ""
    generated_at = ""
    try:
        dataset_file = Config.KB_DATASET_FILE
        with open(dataset_file, 'r', encoding='utf-8') as f:
            meta = json.load(f)
        generated_at = meta.get('generated_at', '')[:10]
    except Exception:
        pass

    lines = [
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        f"DEPARTMENT DATA (Auto-extracted from official flyers{' — ' + generated_at if generated_at else ''})",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
    ]
    for dept in records:
        lines.append(_format_department(dept))
        lines.append("")
    return '\n'.join(lines)


def get_kb() -> str:
    """Return cached full KB string. Builds it if cache is empty."""
    global _kb_cache, _dept_records
    if not _dept_records:
        _dept_records = _load_records()
    if not _kb_cache:
        _kb_cache = build_kb_section()
    return _kb_cache


def get_kb_for_query(query: str) -> str:
    """
    Return a KB section filtered to departments relevant to the query.
    Falls back to top popular departments for general queries.
    Strips punctuation before matching so "CIS," and "CIS" both match.
    """
    import re as _re
    global _dept_records
    if not _dept_records:
        _dept_records = _load_records()
    if not _dept_records:
        return ""

    # Strip punctuation so "CIS," → "CIS", "comparison:" → "comparison"
    q_clean = _re.sub(r'[^\w\s]', ' ', query.lower())
    words = set(q_clean.split())

    # Check if this is a general query
    is_general = bool(words & _GENERAL_KEYWORDS)

    matched = []
    for dept in _dept_records:
        name = (dept.get('department') or '').lower()
        short = (dept.get('short_name') or '').lower()

        # Match by short name as a whole word, or by significant name words
        name_words = {w for w in name.split() if len(w) > 3}
        short_match = short and (short in words)           # exact word match (punctuation stripped)
        name_match = bool(name_words & words)
        if short_match or name_match:
            matched.append(dept)

    if matched:
        # Deduplicate while preserving order
        seen = set()
        unique = []
        for d in matched:
            key = d.get('short_name') or d.get('department')
            if key not in seen:
                seen.add(key)
                unique.append(d)
        return _build_section(unique, "relevant departments")

    if is_general:
        # Include top popular departments for general queries
        top = [d for d in _dept_records if d.get('short_name') in _TOP_DEPTS]
        if not top:
            top = _dept_records[:8]
        return _build_section(top, "popular departments")

    # Fallback: return all
    return _build_section(_dept_records)


def refresh_knowledge_base():
    """Force-rebuild the KB cache from disk. Called after ingestion."""
    global _kb_cache, _dept_records
    _dept_records = _load_records()
    _kb_cache = build_kb_section()
    count = len(_dept_records)
    logger.info(f"Knowledge base refreshed — {count} departments loaded")
    return count
