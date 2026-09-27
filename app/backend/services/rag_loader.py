"""
Loads a single, shared DevAssistEngine instance for the whole API process.

Prefers app/backend/data/processed/guides.json (built via `python -m app.rag.build_cache`)
and falls back to parsing the .docx files directly if the cache doesn't
exist yet, so the server also works correctly on a completely fresh clone.
"""

import json
from functools import lru_cache

from app.backend.config import COMMON_DOC_PATH, COMPLEX_DOC_PATH, GUIDES_CACHE_PATH
from app.rag.engine import DevAssistEngine
from app.rag.models import Guide


@lru_cache(maxsize=1)
def get_engine() -> DevAssistEngine:
    if GUIDES_CACHE_PATH.exists():
        with open(GUIDES_CACHE_PATH, "r", encoding="utf-8") as f:
            raw = json.load(f)
        guides = [Guide.from_dict(g) for g in raw]
        return DevAssistEngine.from_guides(guides)

    return DevAssistEngine(COMMON_DOC_PATH, COMPLEX_DOC_PATH)


def reload_engine() -> DevAssistEngine:
    """
    Force a full re-parse of data/raw/*.docx, rewrite app/backend/data/processed/guides.json,
    and swap in a fresh engine. Called after a new knowledge-base document is
    uploaded through the UI (see routers/knowledge.py POST /api/knowledge/upload)
    so the change is live immediately, with no server restart needed.
    """
    from app.rag.parser import load_knowledge_base

    guides = load_knowledge_base(COMMON_DOC_PATH, COMPLEX_DOC_PATH)

    GUIDES_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(GUIDES_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump([g.to_dict() for g in guides], f, indent=2, ensure_ascii=False)

    get_engine.cache_clear()
    return get_engine()
