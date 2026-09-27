"""
Central configuration for the FastAPI backend.

DATABASE_URL defaults to a local SQLite file so the project runs with zero
external setup. The spec (section 28) calls for PostgreSQL/Supabase — because
everything here goes through SQLAlchemy, switching is a one-line change:

    DATABASE_URL=postgresql+psycopg2://user:password@host:5432/devassist

set as an environment variable (or in a .env file) before starting the server.
"""

import os
from pathlib import Path

# app/backend/config.py -> app/backend -> app -> AI-Project (repo root)
BACKEND_DIR = Path(__file__).resolve().parents[0]
BASE_DIR = Path(__file__).resolve().parents[2]

# The knowledge-base data lives inside app/backend/data — not at the repo
# root — since app/backend is the only thing that reads or writes it (the
# API serves it, and the manual-upload endpoint overwrites it). Keeping it
# in one folder makes the backend a single self-contained deployable unit:
# a Render Persistent Disk (or any volume mount) only needs to cover
# app/backend/data, nothing else.
DATA_DIR = BACKEND_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"

COMMON_DOC_PATH = RAW_DIR / "Common_Problems_RAG_Knowledge_Base.docx"
COMPLEX_DOC_PATH = RAW_DIR / "Complex_Problems_RAG_Knowledge_Base.docx"
GUIDES_CACHE_PATH = PROCESSED_DIR / "guides.json"

DATABASE_URL = os.environ.get(
    "DATABASE_URL", f"sqlite:///{(BASE_DIR / 'devassist.db').as_posix()}"
)

# Below this confidence score (0-100), a match is not trusted (kept in sync
# with app/rag/engine.py's CONFIDENCE_THRESHOLD for reference/display use).
CONFIDENCE_THRESHOLD = 12.0

CORS_ORIGINS = os.environ.get(
    "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
).split(",")
