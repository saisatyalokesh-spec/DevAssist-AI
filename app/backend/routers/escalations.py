from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession
from sqlalchemy import desc

from app.backend.database import get_db
from app.backend import db_models, schemas

router = APIRouter(prefix="/api/escalations", tags=["escalations"])


@router.get("", response_model=list[schemas.EscalationOut])
def list_escalations(db: DbSession = Depends(get_db)):
    return db.query(db_models.Escalation).order_by(desc(db_models.Escalation.created_at)).all()


@router.get("/{session_id}", response_model=schemas.EscalationOut)
def get_escalation_for_session(session_id: str, db: DbSession = Depends(get_db)):
    escalation = (
        db.query(db_models.Escalation)
        .filter(db_models.Escalation.session_id == session_id)
        .order_by(desc(db_models.Escalation.created_at))
        .first()
    )
    if not escalation:
        raise HTTPException(status_code=404, detail="No escalation found for this session.")
    return escalation


@router.post("/{escalation_id}/acknowledge", response_model=schemas.EscalationOut)
def acknowledge_escalation(escalation_id: str, db: DbSession = Depends(get_db)):
    escalation = db.get(db_models.Escalation, escalation_id)
    if not escalation:
        raise HTTPException(status_code=404, detail="Escalation not found.")
    escalation.status = "acknowledged"
    db.commit()
    db.refresh(escalation)
    return escalation
