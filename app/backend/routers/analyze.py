from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session as DbSession

from app.backend.database import get_db
from app.backend.services.rag_loader import get_engine
from app.backend.services import session_engine
from app.backend import db_models, schemas
from app.backend.ocr.extractor import extract_text_from_bytes, extract_error_fields, OcrUnavailableError

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze-text", response_model=schemas.AnalysisResponse)
def analyze_text(payload: schemas.AnalyzeTextRequest, db: DbSession = Depends(get_db)):
    engine = get_engine()
    if not payload.problem or not payload.problem.strip():
        raise HTTPException(status_code=400, detail="`problem` must not be empty.")
    return session_engine.start_session_from_text(db, engine, payload.problem, payload.context, source="text")


@router.post("/analyze-image", response_model=schemas.AnalysisResponse)
async def analyze_image(
    image: UploadFile = File(...),
    product_area: str = Form(""),
    environment: str = Form(""),
    priority: str = Form("Medium"),
    customer_impact: str = Form(""),
    steps_already_tried: str = Form(""),
    db: DbSession = Depends(get_db),
):
    engine = get_engine()
    image_bytes = await image.read()

    try:
        ocr_result = extract_text_from_bytes(image_bytes)
    except OcrUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    extracted_text = ocr_result["text"]
    if not extracted_text:
        raise HTTPException(
            status_code=422,
            detail="No readable text was found in the screenshot. Try a clearer image or paste the error as text.",
        )

    context = schemas.TicketContext(
        product_area=product_area, environment=environment, priority=priority,
        customer_impact=customer_impact, steps_already_tried=steps_already_tried,
    )
    result = session_engine.start_session_from_text(db, engine, extracted_text, context, source="image")
    result.message = (result.message + " " if result.message else "") + \
        f"(extracted from screenshot in {ocr_result['elapsed_seconds']}s)"
    return result


@router.get("/analyze-image/fields")
def analyze_image_fields(text: str):
    """Best-effort structured fields (endpoint / status / error code) from OCR text,
    used by the 'Extracted Context' panel in the upload flow."""
    return extract_error_fields(text)


@router.post("/troubleshooting/{session_id}/result", response_model=schemas.AnalysisResponse)
def submit_step_result(session_id: str, payload: schemas.StepResultRequest, db: DbSession = Depends(get_db)):
    engine = get_engine()
    session = db.get(db_models.SupportSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session.status in ("solved", "escalated"):
        raise HTTPException(status_code=409, detail=f"Session is already {session.status}.")
    if payload.result not in ("resolved", "still_failing", "different_error", "need_info"):
        raise HTTPException(status_code=400, detail="Invalid `result` value.")

    return session_engine.process_step_result(db, engine, session, payload)
