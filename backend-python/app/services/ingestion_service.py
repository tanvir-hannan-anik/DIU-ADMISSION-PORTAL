"""
Department Image Ingestion Service
-----------------------------------
Reads department flyer images → extracts structured data via Groq vision
→ saves individual JSONs + merged dataset → refreshes AI knowledge base.
"""

import os
import json
import base64
import logging
from pathlib import Path
from datetime import datetime

from groq import Groq
from app.config.settings import Config

logger = logging.getLogger(__name__)

# ── JSON schema template sent to the vision model ────────────────────────────
_EXTRACTION_PROMPT = """
You are a university data extraction assistant.
Analyze this department brochure/flyer image from Daffodil International University (DIU).
Extract ALL visible text and information, then return a structured JSON object.

Return ONLY valid JSON — no extra text, no markdown, no explanation.
Use exactly this structure:

{
  "department": "<full department name>",
  "short_name": "<abbreviation e.g. CSE, BBA>",
  "faculty": "<faculty name>",
  "degree": "<degree title e.g. B.Sc., BBA, LL.B.>",
  "duration": "<e.g. 4 years / 12 semesters>",
  "total_credit": "<credit hours e.g. 154.5>",
  "overview": "<2-3 sentence summary of the program>",
  "semester_fee": "<fee in BDT if shown>",
  "total_fee": "<total program fee if shown>",
  "admission_fee": "<one-time admission fee if shown>",
  "waiver_info": "<any scholarship or waiver info mentioned>",
  "eligibility": "<admission requirements: group, GPA>",
  "labs": ["<lab name>", "..."],
  "curriculum_highlights": ["<subject/course>", "..."],
  "career_opportunities": ["<career>", "..."],
  "research_areas": ["<research topic>", "..."],
  "projects": ["<project name>", "..."],
  "facilities": ["<facility>", "..."],
  "events": ["<event>", "..."],
  "notable_alumni_companies": ["<company>", "..."],
  "contact": "<contact info if shown>",
  "intake": "<intake season e.g. Spring 2025, Fall 2024>"
}

If a field is not found in the image, use "" for strings or [] for arrays.
Do NOT fabricate data — only extract what is visible in the image.
""".strip()


def _encode_image(image_path: str) -> str:
    """Base64 encode an image for the Groq vision API."""
    with open(image_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')


def _get_image_mime(image_path: str) -> str:
    ext = Path(image_path).suffix.lower()
    return {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.png': 'image/png', '.webp': 'image/webp'}.get(ext, 'image/jpeg')


def _extract_from_image(client: Groq, image_path: str) -> dict:
    """Call Groq vision model to extract department data from one image."""
    logger.info(f"Extracting: {os.path.basename(image_path)}")

    b64 = _encode_image(image_path)
    mime = _get_image_mime(image_path)

    response = client.chat.completions.create(
        model=Config.GROQ_VISION_MODEL,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime};base64,{b64}"}
                },
                {
                    "type": "text",
                    "text": _EXTRACTION_PROMPT
                }
            ]
        }],
        max_tokens=2048,
        temperature=0.1
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown code fences if present
    if raw.startswith('```'):
        raw = raw.split('\n', 1)[1] if '\n' in raw else raw
        raw = raw.rsplit('```', 1)[0].strip()

    # Extract JSON object if there's surrounding text
    brace_start = raw.find('{')
    brace_end = raw.rfind('}')
    if brace_start != -1 and brace_end != -1:
        raw = raw[brace_start:brace_end + 1]

    # Attempt direct parse, then repair common model output issues
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        import re
        repaired = raw
        # Fix numbers with comma-thousands separators inside JSON values: 98,250 → 98250
        # Only when the number is a JSON value (preceded by : or another digit-comma sequence)
        repaired = re.sub(r'(?<=\d),(?=\d{3}\b)', '', repaired)
        # Remove trailing commas before } or ]
        repaired = re.sub(r',\s*([}\]])', r'\1', repaired)
        # Replace single quotes used as JSON strings (only outside of already-quoted strings)
        repaired = re.sub(r"(?<![\\])'", '"', repaired)
        try:
            return json.loads(repaired)
        except json.JSONDecodeError:
            # Last resort: extract key fields manually via regex and build a minimal record
            logger.warning("JSON repair failed — building minimal record from raw text")
            dept_match = re.search(r'"department"\s*:\s*"([^"]+)"', repaired)
            return {
                "department": dept_match.group(1) if dept_match else "Unknown",
                "overview": re.sub(r'[^\w\s,.]', '', raw[:300]),
                "_parse_error": True
            }


def _clean_record(record: dict) -> dict:
    """Normalise field types and remove empty noise."""
    cleaned = {}
    for k, v in record.items():
        if isinstance(v, list):
            cleaned[k] = [str(i).strip() for i in v if str(i).strip()]
        elif isinstance(v, str):
            cleaned[k] = v.strip()
        else:
            cleaned[k] = v
    return cleaned


def _save_json(data: dict, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ── Public API ────────────────────────────────────────────────────────────────

def ingest_all(force: bool = False) -> dict:
    """
    Main entry point. Processes all images in DEPT_IMAGES_PATH.
    Returns a summary dict.
    """
    if not Config.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not configured")

    images_dir = Config.DEPT_IMAGES_PATH
    data_dir = Config.KB_DATA_PATH
    dataset_file = Config.KB_DATASET_FILE

    if not os.path.isdir(images_dir):
        raise FileNotFoundError(f"Department images folder not found: {images_dir}")

    client = Groq(api_key=Config.GROQ_API_KEY)

    supported = {'.jpg', '.jpeg', '.png', '.webp'}
    image_files = [
        f for f in Path(images_dir).iterdir()
        if f.is_file() and f.suffix.lower() in supported
    ]

    if not image_files:
        return {"processed": 0, "skipped": 0, "errors": [], "message": "No images found"}

    results = []
    errors = []
    skipped = 0

    for img_path in sorted(image_files):
        stem = img_path.stem  # e.g. BSc-in-CSE
        out_file = os.path.join(data_dir, f"{stem}.json")

        # Skip if already processed and force=False
        if not force and os.path.exists(out_file):
            logger.info(f"Skipping (already processed): {img_path.name}")
            skipped += 1
            try:
                with open(out_file, 'r', encoding='utf-8') as f:
                    results.append(json.load(f))
            except Exception:
                pass
            continue

        try:
            record = _extract_from_image(client, str(img_path))
            record = _clean_record(record)
            record['_source_file'] = img_path.name
            record['_processed_at'] = datetime.utcnow().isoformat()

            _save_json(record, out_file)
            results.append(record)
            logger.info(f"Saved: {out_file}")

        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error for {img_path.name}: {e}")
            errors.append({"file": img_path.name, "error": f"JSON parse error: {e}"})
        except Exception as e:
            logger.error(f"Failed to process {img_path.name}: {e}")
            errors.append({"file": img_path.name, "error": str(e)})

    # ── Merge into dataset ────────────────────────────────────────────────────
    dataset = {
        "generated_at": datetime.utcnow().isoformat(),
        "total_departments": len(results),
        "departments": results
    }
    _save_json(dataset, dataset_file)
    logger.info(f"Dataset saved: {dataset_file} ({len(results)} departments)")

    # ── Refresh knowledge base in memory ─────────────────────────────────────
    try:
        from app.services.knowledge_base_service import refresh_knowledge_base
        refresh_knowledge_base()
        logger.info("Knowledge base refreshed")
    except Exception as e:
        logger.warning(f"KB refresh failed: {e}")

    return {
        "processed": len(results) - skipped,
        "skipped": skipped,
        "total": len(results),
        "errors": errors,
        "dataset_file": dataset_file,
        "message": f"Ingestion complete. {len(results)} departments in knowledge base."
    }


def ingest_single(image_path: str) -> dict:
    """Process a single image and update the dataset + KB."""
    if not Config.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not configured")

    client = Groq(api_key=Config.GROQ_API_KEY)
    data_dir = Config.KB_DATA_PATH

    img = Path(image_path)
    out_file = os.path.join(data_dir, f"{img.stem}.json")

    record = _extract_from_image(client, image_path)
    record = _clean_record(record)
    record['_source_file'] = img.name
    record['_processed_at'] = datetime.utcnow().isoformat()

    _save_json(record, out_file)

    # Rebuild full dataset from all saved JSONs
    _rebuild_dataset()

    # Refresh KB
    try:
        from app.services.knowledge_base_service import refresh_knowledge_base
        refresh_knowledge_base()
    except Exception as e:
        logger.warning(f"KB refresh failed: {e}")

    return record


def _rebuild_dataset():
    """Rebuild departments_dataset.json from all individual JSON files."""
    data_dir = Config.KB_DATA_PATH
    dataset_file = Config.KB_DATASET_FILE

    records = []
    for jf in sorted(Path(data_dir).glob('*.json')):
        try:
            with open(jf, 'r', encoding='utf-8') as f:
                records.append(json.load(f))
        except Exception:
            pass

    dataset = {
        "generated_at": datetime.utcnow().isoformat(),
        "total_departments": len(records),
        "departments": records
    }
    _save_json(dataset, dataset_file)
    logger.info(f"Dataset rebuilt: {len(records)} departments")


def load_dataset() -> dict:
    """Load the current dataset from disk."""
    dataset_file = Config.KB_DATASET_FILE
    if not os.path.exists(dataset_file):
        return {"departments": []}
    with open(dataset_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_ingestion_status() -> dict:
    """Return status of the ingestion pipeline."""
    images_dir = Config.DEPT_IMAGES_PATH
    data_dir = Config.KB_DATA_PATH
    dataset_file = Config.KB_DATASET_FILE

    supported = {'.jpg', '.jpeg', '.png', '.webp'}

    total_images = len([
        f for f in Path(images_dir).iterdir()
        if f.is_file() and f.suffix.lower() in supported
    ]) if os.path.isdir(images_dir) else 0

    processed = len(list(Path(data_dir).glob('*.json'))) if os.path.isdir(data_dir) else 0

    dataset_updated = None
    if os.path.exists(dataset_file):
        try:
            with open(dataset_file, 'r', encoding='utf-8') as f:
                ds = json.load(f)
                dataset_updated = ds.get('generated_at')
        except Exception:
            pass

    return {
        "total_images": total_images,
        "processed_departments": processed,
        "pending": max(0, total_images - processed),
        "dataset_last_updated": dataset_updated,
        "images_path": images_dir,
        "data_path": data_dir,
    }
