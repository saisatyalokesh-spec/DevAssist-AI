import shutil

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form

from app.backend.config import COMMON_DOC_PATH, COMPLEX_DOC_PATH, RAW_DIR
from app.backend.services.rag_loader import get_engine, reload_engine
from app.backend import schemas
from app.rag.parser import parse_docx

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

ALLOWED_DOCX_TYPES = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
)


@router.get("/guides", response_model=list[schemas.GuideSummary])
def list_guides(
    collection: str | None = Query(None, description="common | complex"),
    category: str | None = None,
    team: str | None = None,
    q: str | None = None,
):
    engine = get_engine()
    guides = engine.guides

    if collection in ("common", "complex"):
        guides = [g for g in guides if g.collection == collection]
    if category:
        guides = [g for g in guides if g.category.lower() == category.lower()]
    if team:
        guides = [g for g in guides if g.team.lower() == team.lower()]
    if q:
        lower_q = q.lower()
        guides = [
            g for g in guides
            if lower_q in g.title.lower()
            or lower_q in g.problem.lower()
            or lower_q in g.guide_id.lower()
            or lower_q in g.identifier.lower()
        ]

    return [
        schemas.GuideSummary(
            guide_id=g.guide_id, title=g.title, collection=g.collection,
            category=g.category, team=g.team,
        )
        for g in guides
    ]


@router.get("/guides/{guide_id}", response_model=schemas.GuideOut)
def get_guide(guide_id: str):
    engine = get_engine()
    guide = engine.guide_by_id(guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found.")
    return schemas.GuideOut(
        guide_id=guide.guide_id, title=guide.title, collection=guide.collection,
        category=guide.category, problem=guide.problem, symptoms=guide.symptoms,
        causes=guide.causes, steps=guide.steps, solution=guide.solution,
        escalation=guide.escalation, team=guide.team, related=guide.related,
    )


@router.get("/categories")
def list_categories():
    engine = get_engine()
    return sorted({g.category for g in engine.guides if g.category})


@router.get("/teams")
def list_teams():
    engine = get_engine()
    return sorted({g.team for g in engine.guides if g.team})


@router.post("/upload", response_model=schemas.UploadGuideResponse)
async def upload_guide_document(
    collection: str = Form(..., description="common | complex"),
    file: UploadFile = File(...),
):
    """
    Manually replace one of the two RAG knowledge-base .docx files from the
    web app, instead of only being able to drop a file into app/backend/data/raw/ on
    disk. The uploaded document must follow the same guide format your
    existing knowledge base uses (GUIDE-ID | Title headings, numbered
    section bars, etc.) — see documents/ for the reference format.

    Uploading REPLACES every guide currently in that collection (this
    mirrors how the two source .docx files already work: one document =
    the full contents of that collection).
    """
    if collection not in ("common", "complex"):
        raise HTTPException(status_code=400, detail="`collection` must be 'common' or 'complex'.")

    if not file.filename or not file.filename.lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx files are supported.")

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = RAW_DIR / f"_upload_tmp_{collection}.docx"
    target_path = COMMON_DOC_PATH if collection == "common" else COMPLEX_DOC_PATH

    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        parsed = parse_docx(tmp_path, collection=collection)
    except Exception as exc:
        tmp_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=f"Could not read this .docx file: {exc}")

    if len(parsed) == 0:
        tmp_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=422,
            detail=(
                "No guides could be parsed from this document. It must follow the same "
                "format as your existing knowledge base (e.g. 'API-001 | Guide Title' "
                "headings, numbered section bars like '1. Problem Statement')."
            ),
        )

    shutil.move(str(tmp_path), str(target_path))
    engine = reload_engine()
    total_in_collection = sum(1 for g in engine.guides if g.collection == collection)

    return schemas.UploadGuideResponse(
        collection=collection,
        filename=file.filename,
        guides_parsed=len(parsed),
        total_guides=total_in_collection,
    )
