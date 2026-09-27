"""
This module is the bridge between app/rag (pure retrieval) and the database
(support_sessions / troubleshooting_steps / escalations). It implements the
workflow described in spec section 2 (CORE WORKFLOW) and section 18
(ITERATIVE TROUBLESHOOTING):

    ticket -> analyze() -> create session + step 1
    step result "still failing"    -> advance to step 2, 3, ...
    step result "different error"  -> re-run RAG with new context
    step result "resolved"         -> session solved
    steps exhausted / low confidence -> escalate
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session as DbSession

from app.backend import db_models, schemas
from app.rag.engine import DevAssistEngine, analyze as rag_analyze, CONFIDENCE_THRESHOLD
from app.rag.models import Guide

INSUFFICIENT_KNOWLEDGE_MESSAGE = (
    "Reliable troubleshooting information was not found. Further investigation "
    "or escalation is recommended."
)


def _now():
    return datetime.now(timezone.utc)


def _guide_response_fields(guide: Guide) -> dict:
    return {
        "guide_id": guide.guide_id,
        "guide_title": guide.title,
        "collection": guide.collection,
        "category": guide.category,
        "possible_causes": guide.causes,
        "troubleshooting_steps": guide.steps,
        "symptoms": guide.symptoms,
        "visual_indicators": guide.visual,
        "solution": guide.solution,
        "responsible_team": guide.team,
    }


def _upsert_saved_solution(db: DbSession, session: db_models.SupportSession, guide: Guide | None):
    """
    Every analyzed ticket (text or screenshot) is automatically kept in
    Saved Solutions the moment it's analyzed — not just once it's solved —
    so a junior developer always has the retrieved guidance (causes,
    recommended steps, solution, responsible team) to work from, and the
    record stays in sync as the session progresses (steps completed,
    solved, or escalated).
    """
    existing = (
        db.query(db_models.SavedSolution)
        .filter(db_models.SavedSolution.session_id == session.id)
        .first()
    )

    values = dict(
        problem=session.problem,
        category=session.category or (guide.category if guide else ""),
        guide_title=guide.title if guide else "",
        guide_id=session.guide_id or "",
        possible_causes=guide.causes if guide else [],
        steps=guide.steps if guide else [],
        solution=guide.solution if guide else "",
        team=session.responsible_team or (guide.team if guide else ""),
        status=session.status,
    )

    if existing:
        for key, value in values.items():
            setattr(existing, key, value)
    else:
        db.add(db_models.SavedSolution(session_id=session.id, **values))


def start_session_from_text(
    db: DbSession, engine: DevAssistEngine, problem_text: str,
    context: schemas.TicketContext | None, source: str = "text",
) -> schemas.AnalysisResponse:
    context = context or schemas.TicketContext()
    result = rag_analyze(engine, problem_text)

    session = db_models.SupportSession(
        problem=problem_text,
        source=source,
        priority=context.priority or "Medium",
        product_area=context.product_area or "",
        environment=context.environment or "",
        customer_impact=context.customer_impact or "",
        steps_already_tried=context.steps_already_tried or "",
    )

    if result["status"] == "NEEDS_CLARIFICATION":
        session.status = "escalated"
        session.category = "Uncategorized"
        session.problem_type = "Uncategorized"
        session.responsible_team = "Unassigned – Needs Triage"
        db.add(session)
        db.flush()

        escalation = db_models.Escalation(
            session_id=session.id,
            reason="Insufficient approved knowledge in the RAG knowledge base.",
            team="Unassigned – Needs Triage",
            context={"note": result["message"]},
        )
        db.add(escalation)
        _upsert_saved_solution(db, session, guide=None)
        db.commit()
        db.refresh(session)

        return schemas.AnalysisResponse(
            problem=problem_text,
            category="Uncategorized",
            problem_type="Uncategorized",
            escalation_required=True,
            responsible_team="Unassigned – Needs Triage",
            source=source,
            session_id=session.id,
            status="escalated",
            message=result["message"],
            escalation_reason="Insufficient approved knowledge.",
            other_matches=[
                schemas.MatchAlternative(guide_id=g.guide_id, title=g.title, confidence=s)
                for g, s in result.get("closest_guesses", [])
            ],
        )

    guide: Guide = result["guide"]
    confidence = result["confidence"]
    first_step = guide.steps[0] if guide.steps else ""

    session.category = guide.category
    session.problem_type = guide.category
    session.collection = guide.collection
    session.guide_id = guide.guide_id
    session.confidence = confidence
    session.responsible_team = guide.team
    session.status = "in_progress"
    session.current_step_index = 0
    db.add(session)
    db.flush()

    if first_step:
        db.add(db_models.TroubleshootingStep(
            session_id=session.id, step_number=1,
            instruction=first_step, status="pending",
        ))
    _upsert_saved_solution(db, session, guide=guide)
    db.commit()
    db.refresh(session)

    fields = _guide_response_fields(guide)
    fields["problem_type"] = fields["category"]

    return schemas.AnalysisResponse(
        problem=problem_text,
        current_step=first_step,
        escalation_required=False,
        source=source,
        session_id=session.id,
        status="in_progress",
        confidence=confidence,
        other_matches=[
            schemas.MatchAlternative(guide_id=g.guide_id, title=g.title, confidence=s)
            for g, s in result.get("other_matches", [])
        ],
        **fields,
    )


def _current_guide(engine: DevAssistEngine, session: db_models.SupportSession) -> Guide | None:
    if not session.guide_id:
        return None
    return engine.guide_by_id(session.guide_id)


def process_step_result(
    db: DbSession, engine: DevAssistEngine,
    session: db_models.SupportSession, payload: schemas.StepResultRequest,
) -> schemas.AnalysisResponse:
    guide = _current_guide(engine, session)

    # mark the currently-pending step with the junior developer's result
    pending_step = next((s for s in session.steps if s.status == "pending"), None)
    if pending_step:
        pending_step.result = payload.note or payload.result
        pending_step.status = "completed"

    prior_step_texts = [s.instruction for s in session.steps]

    # ---- RESOLVED --------------------------------------------------
    if payload.result == "resolved":
        session.status = "solved"
        session.updated_at = _now()
        _upsert_saved_solution(db, session, guide)
        db.commit()
        db.refresh(session)
        return schemas.AnalysisResponse(
            problem=session.problem, category=session.category,
            problem_type=session.problem_type, escalation_required=False,
            responsible_team=session.responsible_team, source=session.source,
            session_id=session.id, status="solved",
            guide_id=session.guide_id, collection=session.collection,
            confidence=session.confidence,
            solution=(guide.solution if guide else ""),
            message="Issue resolved.",
        )

    # ---- NEED MORE INFO ---------------------------------------------
    if payload.result == "need_info":
        db.commit()
        db.refresh(session)
        return schemas.AnalysisResponse(
            problem=session.problem, category=session.category,
            problem_type=session.problem_type, escalation_required=False,
            responsible_team=session.responsible_team, source=session.source,
            session_id=session.id, status="in_progress",
            guide_id=session.guide_id, collection=session.collection,
            confidence=session.confidence,
            current_step=pending_step.instruction if pending_step else "",
            message=(
                "Ask the customer for more detail (exact error text, the "
                "action that triggered it, and a screenshot if possible) "
                "before continuing to the next step."
            ),
        )

    # ---- DIFFERENT ERROR: re-run RAG with new context ---------------
    if payload.result == "different_error":
        matches = engine.re_query(session.problem, prior_step_texts, payload.note or "")
        best_guide, best_score = matches[0]

        if best_score < CONFIDENCE_THRESHOLD:
            session.status = "escalated"
            db.add(db_models.Escalation(
                session_id=session.id,
                reason="A different error appeared and no confident match was found.",
                team=session.responsible_team or "Unassigned – Needs Triage",
                context={"reported_result": payload.note},
            ))
            _upsert_saved_solution(db, session, guide=None)
            db.commit()
            db.refresh(session)
            return schemas.AnalysisResponse(
                problem=session.problem, category=session.category,
                problem_type=session.problem_type, escalation_required=True,
                responsible_team=session.responsible_team or "Unassigned – Needs Triage",
                source=session.source, session_id=session.id, status="escalated",
                message=INSUFFICIENT_KNOWLEDGE_MESSAGE,
                escalation_reason="A different error appeared and no confident match was found.",
            )

        session.guide_id = best_guide.guide_id
        session.category = best_guide.category
        session.problem_type = best_guide.category
        session.collection = best_guide.collection
        session.responsible_team = best_guide.team
        session.confidence = best_score
        session.current_step_index = 0
        next_instruction = best_guide.steps[0] if best_guide.steps else ""
        if next_instruction:
            db.add(db_models.TroubleshootingStep(
                session_id=session.id, step_number=len(session.steps) + 1,
                instruction=next_instruction, status="pending",
            ))
        _upsert_saved_solution(db, session, guide=best_guide)
        db.commit()
        db.refresh(session)
        fields = _guide_response_fields(best_guide)
        fields["problem_type"] = fields["category"]
        return schemas.AnalysisResponse(
            problem=session.problem, current_step=next_instruction,
            escalation_required=False, source=session.source,
            session_id=session.id, status="in_progress",
            confidence=best_score,
            message="A different error was reported — re-analyzed against the knowledge base.",
            **fields,
        )

    # ---- STILL FAILING: advance to the next step in the same guide --
    if guide is None:
        session.status = "escalated"
        _upsert_saved_solution(db, session, guide=None)
        db.commit()
        db.refresh(session)
        return schemas.AnalysisResponse(
            problem=session.problem, escalation_required=True,
            responsible_team=session.responsible_team or "Unassigned – Needs Triage",
            source=session.source, session_id=session.id, status="escalated",
            message=INSUFFICIENT_KNOWLEDGE_MESSAGE,
        )

    session.current_step_index += 1
    if session.current_step_index < len(guide.steps):
        next_instruction = guide.steps[session.current_step_index]
        db.add(db_models.TroubleshootingStep(
            session_id=session.id, step_number=len(session.steps) + 1,
            instruction=next_instruction, status="pending",
        ))
        _upsert_saved_solution(db, session, guide=guide)
        db.commit()
        db.refresh(session)
        return schemas.AnalysisResponse(
            problem=session.problem, current_step=next_instruction,
            escalation_required=False, responsible_team=session.responsible_team,
            source=session.source, session_id=session.id, status="in_progress",
            guide_id=session.guide_id, collection=session.collection,
            confidence=session.confidence,
            message="Continuing troubleshooting with the next step.",
        )

    # steps exhausted -> escalate, per spec section 2 / 19
    session.status = "escalated"
    db.add(db_models.Escalation(
        session_id=session.id,
        reason=guide.escalation or "All troubleshooting steps were completed without resolving the issue.",
        team=guide.team,
        context={"prior_steps": prior_step_texts},
    ))
    _upsert_saved_solution(db, session, guide=guide)
    db.commit()
    db.refresh(session)
    return schemas.AnalysisResponse(
        problem=session.problem, escalation_required=True,
        responsible_team=guide.team, source=session.source,
        session_id=session.id, status="escalated",
        guide_id=session.guide_id, collection=session.collection,
        confidence=session.confidence,
        escalation_reason=guide.escalation,
        message="All troubleshooting steps were completed without resolving the issue.",
    )
