"""
CLI: Ingest all department images → extract data → update AI knowledge base.

Usage:
    python scripts/ingest_departments.py           # skip already processed
    python scripts/ingest_departments.py --force   # reprocess all images
    python scripts/ingest_departments.py --status  # show pipeline status only
"""

import sys
import os
import argparse
import json

# Make sure the backend-python package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(override=True)

from app.services.ingestion_service import ingest_all, get_ingestion_status


def main():
    parser = argparse.ArgumentParser(description='DIU Department Image Ingestion')
    parser.add_argument('--force', action='store_true', help='Reprocess all images (ignore cache)')
    parser.add_argument('--status', action='store_true', help='Show pipeline status and exit')
    args = parser.parse_args()

    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    if args.status:
        status = get_ingestion_status()
        print("\n=== Ingestion Pipeline Status ===")
        print(f"  Images folder  : {status['images_path']}")
        print(f"  Data folder    : {status['data_path']}")
        print(f"  Total images   : {status['total_images']}")
        print(f"  Processed      : {status['processed_departments']}")
        print(f"  Pending        : {status['pending']}")
        print(f"  Dataset updated: {status['dataset_last_updated'] or 'Never'}")
        print("==================================\n")
        return

    print(f"\n=== DIU Department Ingestion ({'FORCE' if args.force else 'incremental'}) ===")
    print("Processing images... this may take a few minutes.\n")

    try:
        result = ingest_all(force=args.force)

        print(f"\nDone.")
        print(f"   Processed : {result['processed']}")
        print(f"   Skipped   : {result['skipped']}")
        print(f"   Total     : {result['total']}")
        print(f"   Dataset   : {result['dataset_file']}")

        if result['errors']:
            print(f"\nErrors ({len(result['errors'])}):")
            for e in result['errors']:
                print(f"   - {e['file']}: {e['error']}")

        print(f"\n   {result['message']}\n")

    except FileNotFoundError as e:
        print(f"\nError: {e}")
        print("   Make sure the 'department details' folder exists in the project root.\n")
        sys.exit(1)
    except Exception as e:
        print(f"\nIngestion failed: {e}\n")
        sys.exit(1)


if __name__ == '__main__':
    main()
