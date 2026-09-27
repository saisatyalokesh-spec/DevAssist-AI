from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session as DbSession
from sqlalchemy import func

from app.backend.database import get_db
from app.backend.services.rag_loader import get_engine
from app.backend import db_models, schemas

router = APIRouter(prefix="/api", tags=["insights"])


@router.get("/insights", response_model=schemas.InsightsOut)
def get_insights(db: DbSession = Depends(get_db)):
    total_sessions = db.query(func.count(db_models.SupportSession.id)).scalar() or 0
    guides_retrieved = (
        db.query(func.count(db_models.SupportSession.id))
        .filter(db_models.SupportSession.guide_id != "")
        .scalar() or 0
    )
    active = (
        db.query(func.count(db_models.SupportSession.id))
        .filter(db_models.SupportSession.status == "in_progress")
        .scalar() or 0
    )
    escalated = (
        db.query(func.count(db_models.SupportSession.id))
        .filter(db_models.SupportSession.status == "escalated")
        .scalar() or 0
    )
    solved = (
        db.query(func.count(db_models.SupportSession.id))
        .filter(db_models.SupportSession.status == "solved")
        .scalar() or 0
    )
    return schemas.InsightsOut(
        problems_analyzed=total_sessions, guides_retrieved=guides_retrieved,
        active_sessions=active, escalated=escalated, solved=solved,
    )


@router.get("/search", response_model=list[schemas.SearchResult])
def search(q: str = Query(..., min_length=1), db: DbSession = Depends(get_db)):
    engine = get_engine()
    lower_q = q.lower()
    results: list[schemas.SearchResult] = []

    for g in engine.guides:
        if lower_q in g.title.lower() or lower_q in g.guide_id.lower() or lower_q in g.problem.lower():
            results.append(schemas.SearchResult(
                type="guide", id=g.guide_id, title=g.title,
                subtitle=f"{g.category} · {g.collection.title()} guide",
            ))
        if len(results) >= 10:
            break

    sessions = (
        db.query(db_models.SupportSession)
        .filter(db_models.SupportSession.problem.ilike(f"%{q}%"))
        .limit(5)
        .all()
    )
    for s in sessions:
        results.append(schemas.SearchResult(
            type="session", id=s.id, title=s.problem, subtitle=f"Session · {s.status}",
        ))

    return results[:15]


@router.get("/health")
def health():
    engine = get_engine()
    return {"status": "ok", "guides_loaded": len(engine.guides)}
