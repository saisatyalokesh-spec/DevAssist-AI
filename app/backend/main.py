from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.backend.config import CORS_ORIGINS
from app.backend.database import Base, engine
from app.backend.routers import analyze, sessions, knowledge, saved, escalations, insights

# The Next.js static export (`npm run build` with `output: "export"` in
# next.config.mjs). When this exists, FastAPI serves the whole app — API and
# frontend — from one process on one port, which is what a single Render web
# service (or any single-container host) expects. When it doesn't exist
# (plain local backend dev without building the frontend first), the app
# behaves exactly as it always did: an API-only service.
FRONTEND_BUILD_DIR = Path(__file__).resolve().parents[2] / "app" / "frontend" / "out"

# Create tables on startup if they don't exist yet (fine for SQLite / dev;
# for Postgres in production, swap this for an Alembic migration).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DevAssist AI API",
    description="RAG-based technical troubleshooting backend for DevAssist AI.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router)
app.include_router(sessions.router)
app.include_router(knowledge.router)
app.include_router(saved.router)
app.include_router(escalations.router)
app.include_router(insights.router)


if FRONTEND_BUILD_DIR.is_dir():
    # `/_next/static/...` (JS/CSS chunks, fingerprinted, safe to cache hard).
    app.mount(
        "/_next",
        StaticFiles(directory=FRONTEND_BUILD_DIR / "_next"),
        name="next-static",
    )

    # Catch-all: any request that isn't one of the API routes above is a
    # frontend route. Registered last, so it never shadows `/api/...`,
    # `/docs`, etc. — FastAPI/Starlette match routes in registration order.
    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        candidate = FRONTEND_BUILD_DIR / full_path
        if candidate.is_file():
            return FileResponse(candidate)

        index_candidate = FRONTEND_BUILD_DIR / full_path / "index.html"
        if index_candidate.is_file():
            return FileResponse(index_candidate)

        # Unknown path — hand back the app shell so client-side routing can
        # show its own not-found state, same as any SPA fallback.
        return FileResponse(FRONTEND_BUILD_DIR / "index.html")

else:

    @app.get("/")
    def root():
        return {"service": "DevAssist AI API", "docs": "/docs"}
