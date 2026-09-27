from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession
from sqlalchemy import desc

from app.backend.database import get_db
from app.backend import db_models, schemas

router = APIRouter(prefix="/api/saved-solutions", tags=["saved-solutions"])


@router.get("", response_model=list[schemas.SavedSolutionOut])
def list_saved_solutions(db: DbSession = Depends(get_db)):
    """
    Every analyzed ticket (text or screenshot) is saved here automatically —
    the moment DevAssist AI retrieves guidance for it, not only once it's
    solved — so a junior developer has a running record of every problem's
    causes, recommended steps, and current status to work from.
    """
    return db.query(db_models.SavedSolution).order_by(desc(db_models.SavedSolution.created_at)).all()


@router.get("/{saved_id}", response_model=schemas.SavedSolutionOut)
def get_saved_solution(saved_id: str, db: DbSession = Depends(get_db)):
    saved = db.get(db_models.SavedSolution, saved_id)
    if not saved:
        raise HTTPException(status_code=404, detail="Saved solution not found.")
    return saved


@router.delete("/{saved_id}")
def remove_saved_solution(saved_id: str, db: DbSession = Depends(get_db)):
    saved = db.get(db_models.SavedSolution, saved_id)
    if not saved:
        raise HTTPException(status_code=404, detail="Saved solution not found.")
    db.delete(saved)
    db.commit()
    return {"deleted": saved_id}
