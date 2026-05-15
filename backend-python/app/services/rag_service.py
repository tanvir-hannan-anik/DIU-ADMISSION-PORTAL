"""
RAG Service
-----------
Builds and queries the DIU knowledge index.

Sources indexed into Qdrant:
  1. Curated seed docs   — leadership, verified faculty, eligibility, fees
  2. departments_dataset — OCR-extracted department flyers
  3. PDFs                — waiver-policy2025.pdf, application_instruction.pdf

Embeddings come from Gemini; vectors live in Qdrant. Every external call is
wrapped so the chat layer can fall back to the legacy static prompt if RAG is
unavailable — production never hard-breaks.
"""

import json
import logging
import os

from app.config.settings import Config
from app.services import embedding_service, vector_store_service
from app.services.rag_knowledge_seed import SEED_DOCS

logger = logging.getLogger(__name__)


# ── Chunking ──────────────────────────────────────────────────────────────────

def _chunk_text(text: str, size: int = 1100, overlap: int = 150) -> list[str]:
    """Split long text on paragraph boundaries, then hard-wrap at `size`."""
    text = text.strip()
    if len(text) <= size:
        return [text] if text else []

    chunks: list[str] = []
    buf = ""
    for para in text.split("\n\n"):
        para = para.strip()
        if not para:
            continue
        if len(buf) + len(para) + 2 <= size:
            buf = f"{buf}\n\n{para}" if buf else para
            continue
        if buf:
            chunks.append(buf)
        if len(para) <= size:
            buf = para
        else:
            for i in range(0, len(para), size - overlap):
                chunks.append(para[i:i + size])
            buf = ""
    if buf:
        chunks.append(buf)
    return chunks


def _department_to_text(dept: dict) -> str:
    """Render one department record as a readable passage."""
    name = dept.get("department") or dept.get("short_name") or "Unknown"
    short = dept.get("short_name", "")
    lines = [f"{name}" + (f" ({short})" if short and short != name else "")]

    def add(label, key):
        v = dept.get(key)
        if not v:
            return
        if isinstance(v, list):
            v = ", ".join(str(x) for x in v if str(x).strip())
        elif isinstance(v, dict):
            v = "; ".join(f"{k}: {val}" for k, val in v.items())
        if str(v).strip():
            lines.append(f"{label}: {v}")

    add("Faculty", "faculty")
    add("Degree", "degree")
    add("Duration", "duration")
    add("Total credits", "total_credit")
    add("Overview", "overview")
    add("Semester fee", "semester_fee")
    add("Total fee", "total_fee")
    add("Admission fee", "admission_fee")
    add("Waiver info", "waiver_info")
    add("Eligibility", "eligibility")
    add("Labs", "labs")
    add("Curriculum highlights", "curriculum_highlights")
    add("Career opportunities", "career_opportunities")
    add("Research areas", "research_areas")
    add("Facilities", "facilities")
    add("Intake", "intake")
    return "\n".join(lines)


def _pdf_to_chunks(path: str) -> list[str]:
    """Extract text from a PDF and chunk it. Returns [] if unreadable."""
    try:
        from pypdf import PdfReader
    except ImportError:
        logger.warning("pypdf not installed — skipping PDF %s", path)
        return []
    if not os.path.exists(path):
        logger.warning("PDF not found: %s", path)
        return []
    try:
        reader = PdfReader(path)
        text = "\n\n".join((page.extract_text() or "") for page in reader.pages)
    except Exception as e:  # noqa: BLE001 - PDF parsing is best-effort
        logger.warning("Failed to read PDF %s: %s", path, e)
        return []
    return _chunk_text(text, size=1200, overlap=180)


# ── Document collection ───────────────────────────────────────────────────────

def _collect_documents() -> list[dict]:
    """Gather every source into {text, title, source, type, department} docs."""
    docs: list[dict] = []

    for d in SEED_DOCS:
        docs.append({
            "text": d["text"],
            "title": d["title"],
            "source": "curated",
            "type": d.get("type", ""),
            "department": d.get("department", ""),
        })

    if os.path.exists(Config.KB_DATASET_FILE):
        try:
            with open(Config.KB_DATASET_FILE, "r", encoding="utf-8") as f:
                dataset = json.load(f)
            for dept in dataset.get("departments", []):
                docs.append({
                    "text": _department_to_text(dept),
                    "title": dept.get("department") or dept.get("short_name") or "Department",
                    "source": "department_flyer",
                    "type": "department",
                    "department": dept.get("short_name", ""),
                })
        except Exception as e:  # noqa: BLE001
            logger.warning("Could not load departments dataset: %s", e)

    for pdf_path in Config.PDF_SOURCES:
        base = os.path.basename(pdf_path)
        for i, chunk in enumerate(_pdf_to_chunks(pdf_path)):
            docs.append({
                "text": chunk,
                "title": f"{base} (part {i + 1})",
                "source": "pdf",
                "type": "policy" if "waiver" in base.lower() else "admission",
                "department": "",
            })

    return docs


# ── Public API ────────────────────────────────────────────────────────────────

def is_available() -> bool:
    """RAG can run only if enabled and both Gemini + Qdrant are configured."""
    return (
        Config.RAG_ENABLED
        and embedding_service.is_configured()
        and vector_store_service.is_configured()
    )


def build_index() -> dict:
    """Recreate the Qdrant collection and index every source. Admin action."""
    if not embedding_service.is_configured():
        raise RuntimeError("GEMINI_API_KEY not configured")
    if not vector_store_service.is_configured():
        raise RuntimeError("QDRANT_URL / QDRANT_API_KEY not configured")

    docs = _collect_documents()
    if not docs:
        raise RuntimeError("No documents collected to index")

    logger.info("Embedding %d documents for RAG index…", len(docs))
    vectors = embedding_service.embed_batch(
        [d["text"] for d in docs], task_type="RETRIEVAL_DOCUMENT"
    )

    vector_store_service.recreate_collection(Config.EMBED_DIM)
    points = [
        {
            "id": i,
            "vector": vec,
            "payload": {
                "text": docs[i]["text"],
                "title": docs[i]["title"],
                "source": docs[i]["source"],
                "type": docs[i]["type"],
                "department": docs[i]["department"],
            },
        }
        for i, vec in enumerate(vectors)
    ]
    upserted = vector_store_service.upsert(points)

    by_source: dict[str, int] = {}
    for d in docs:
        by_source[d["source"]] = by_source.get(d["source"], 0) + 1

    logger.info("RAG index built: %d chunks (%s)", upserted, by_source)
    return {"indexed": upserted, "by_source": by_source}


def retrieve(query: str) -> dict:
    """
    Embed the query, search Qdrant, and return a formatted context block.
    Returns {context: str, hits: [...]}. `context` is "" when nothing matches.
    """
    query_vec = embedding_service.embed_text(query, task_type="RETRIEVAL_QUERY")
    hits = vector_store_service.search(
        query_vec, limit=Config.RAG_TOP_K, min_score=Config.RAG_MIN_SCORE
    )
    if not hits:
        return {"context": "", "hits": []}

    blocks = []
    for h in hits:
        p = h.get("payload", {})
        title = p.get("title", "Knowledge")
        blocks.append(f"[{title}]\n{p.get('text', '')}")
    return {"context": "\n\n".join(blocks), "hits": hits}


def status() -> dict:
    """Report RAG readiness for health/admin endpoints."""
    return {
        "rag_enabled": Config.RAG_ENABLED,
        "gemini_configured": embedding_service.is_configured(),
        "qdrant": vector_store_service.collection_info(),
        "available": is_available(),
        "top_k": Config.RAG_TOP_K,
        "min_score": Config.RAG_MIN_SCORE,
    }
