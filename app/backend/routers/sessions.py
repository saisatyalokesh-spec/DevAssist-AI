from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DbSession
from sqlalchemy import desc

from app.backend.database import get_db
from app.backend import db_models, schemas

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("", response_model=list[schemas.SessionSummary])
def list_sessions(
    limit: int = Query(20, le=100),
    status: str | None = None,
    db: DbSession = Depends(get_db),
):
    q = db.query(db_models.SupportSession)
    if status:
        q = q.filter(db_models.SupportSession.status == status)
    return q.order_by(desc(db_models.SupportSession.updated_at)).limit(limit).all()


@router.get("/{session_id}", response_model=schemas.SessionDetail)
def get_session(session_id: str, db: DbSession = Depends(get_db)):
    session = db.get(db_models.SupportSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return session
