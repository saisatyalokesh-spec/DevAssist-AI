"""
Parse both knowledge-base .docx files once and write the result to
app/backend/data/processed/guides.json.

Run this whenever the .docx knowledge base files change:

    python -m app.rag.build_cache

The backend loads from this cache on startup (fast) instead of re-parsing
the Word documents (slow-ish, and python-docx + Word files as a runtime
dependency of every request would be fragile). This matches the
app/backend/data/raw -> app/backend/data/processed convention in the project's folder structure.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.backend.config import COMMON_DOC_PATH, COMPLEX_DOC_PATH, GUIDES_CACHE_PATH  # noqa: E402
from app.rag.parser import load_knowledge_base  # noqa: E402


def main():
    guides = load_knowledge_base(COMMON_DOC_PATH, COMPLEX_DOC_PATH)
    GUIDES_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(GUIDES_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump([g.to_dict() for g in guides], f, indent=2, ensure_ascii=False)
    print(f"Parsed {len(guides)} guides -> {GUIDES_CACHE_PATH}")
    common = sum(1 for g in guides if g.collection == "common")
    complex_ = sum(1 for g in guides if g.collection == "complex")
    print(f"  common: {common}   complex: {complex_}")


if __name__ == "__main__":
    main()
