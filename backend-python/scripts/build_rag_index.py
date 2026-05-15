"""
CLI: Build the RAG index in Qdrant from curated seed + department dataset + PDFs.

Usage:
    python scripts/build_rag_index.py            # (re)build the full index
    python scripts/build_rag_index.py --status   # show RAG status only

Requires GEMINI_API_KEY, QDRANT_URL and QDRANT_API_KEY in .env.
"""

import argparse
import io
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(override=True)

from app.services import rag_service


def main():
    parser = argparse.ArgumentParser(description="DIU RAG Index Builder")
    parser.add_argument("--status", action="store_true", help="Show RAG status and exit")
    args = parser.parse_args()

    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

    if args.status:
        s = rag_service.status()
        print("\n=== RAG Status ===")
        for k, v in s.items():
            print(f"  {k:18}: {v}")
        print("==================\n")
        return

    print("\n=== Building DIU RAG index ===")
    print("Embedding sources via Gemini and upserting into Qdrant…\n")
    try:
        result = rag_service.build_index()
        print("Done.")
        print(f"   Chunks indexed : {result['indexed']}")
        print(f"   By source      : {result['by_source']}\n")
    except Exception as e:  # noqa: BLE001
        print(f"\nIndex build failed: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
