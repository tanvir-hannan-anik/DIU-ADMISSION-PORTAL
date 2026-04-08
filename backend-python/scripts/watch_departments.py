"""
Auto-watcher: monitors the 'department details' folder for new/changed images
and automatically re-ingests them + refreshes the AI knowledge base.

Usage:
    python scripts/watch_departments.py
"""

import sys
import os
import time
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(override=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileCreatedEvent, FileModifiedEvent

from app.config.settings import Config
from app.services.ingestion_service import ingest_single
from app.services.knowledge_base_service import refresh_knowledge_base

SUPPORTED = {'.jpg', '.jpeg', '.png', '.webp'}


class DepartmentImageHandler(FileSystemEventHandler):
    """React to new or modified image files in the department details folder."""

    def _should_process(self, path: str) -> bool:
        return os.path.splitext(path)[1].lower() in SUPPORTED

    def on_created(self, event):
        if not event.is_directory and self._should_process(event.src_path):
            logger.info(f"New image detected: {os.path.basename(event.src_path)}")
            self._process(event.src_path)

    def on_modified(self, event):
        if not event.is_directory and self._should_process(event.src_path):
            logger.info(f"Image modified: {os.path.basename(event.src_path)}")
            self._process(event.src_path)

    def _process(self, path: str):
        try:
            # Brief delay to ensure file write is complete
            time.sleep(1.5)
            record = ingest_single(path)
            dept = record.get('department') or os.path.basename(path)
            logger.info(f"✅ Processed & KB updated: {dept}")
        except Exception as e:
            logger.error(f"❌ Failed to process {os.path.basename(path)}: {e}")


def main():
    watch_path = Config.DEPT_IMAGES_PATH

    if not os.path.isdir(watch_path):
        logger.error(f"Watch folder not found: {watch_path}")
        logger.error("Create the 'department details' folder in the project root and add images.")
        sys.exit(1)

    # Load existing data on startup
    try:
        count = refresh_knowledge_base()
        logger.info(f"Startup: {count} departments loaded into AI knowledge base")
    except Exception as e:
        logger.warning(f"Could not pre-load KB: {e}")

    handler = DepartmentImageHandler()
    observer = Observer()
    observer.schedule(handler, path=watch_path, recursive=False)
    observer.start()

    logger.info(f"👁  Watching: {watch_path}")
    logger.info("Drop new department images into the folder — they will be processed automatically.")
    logger.info("Press Ctrl+C to stop.\n")

    try:
        while True:
            time.sleep(2)
    except KeyboardInterrupt:
        logger.info("Stopping watcher...")
        observer.stop()

    observer.join()
    logger.info("Watcher stopped.")


if __name__ == '__main__':
    main()
