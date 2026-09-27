from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel


class TicketContext(BaseModel):
    product_area: Optional[str] = ""
    environment: Optional[str] = ""
    priority: Optional[str] = "Medium"
    customer_impact: Optional[str] = ""
    steps_already_tried: Optional[str] = ""


class AnalyzeTextRequest(BaseModel):
    problem: str
    context: Optional[TicketContext] = None


class StepOut(BaseModel):
    id: str
    step_number: int
    instruction: str
    result: str
    status: str

    class Config:
        from_attributes = True


class MatchAlternative(BaseModel):
    guide_id: str
    title: str
    confidence: float


class AnalysisResponse(BaseModel):
    # spec section 27 core fields
    problem: str
    category: str = ""
    problem_type: str = ""
    possible_causes: list[str] = []
    troubleshooting_steps: list[str] = []
    current_step: str = ""
    verification: str = ""
    escalation_required: bool = False
    responsible_team: str = ""
    source: str = "text"

    # extra fields the UI needs beyond the minimal spec shape
    session_id: str
    status: str                      # in_progress | needs_clarification | escalated
    guide_id: str = ""
    guide_title: str = ""
    collection: str = ""
    confidence: float = 0.0
    symptoms: list[str] = []
    visual_indicators: list[str] = []
    solution: str = ""
    escalation_reason: str = ""
    message: str = ""                # populated when clarification/escalation is needed
    other_matches: list[MatchAlternative] = []


class StepResultRequest(BaseModel):
    # "resolved" | "still_failing" | "different_error" | "need_info"
    result: str
    note: Optional[str] = ""


class SessionSummary(BaseModel):
    id: str
    problem: str
    category: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionDetail(SessionSummary):
    collection: str
    guide_id: str
    confidence: float
    responsible_team: str
    source: str
    steps: list[StepOut] = []

    class Config:
        from_attributes = True


class GuideOut(BaseModel):
    guide_id: str
    title: str
    collection: str
    category: str
    problem: str
    symptoms: list[str]
    causes: list[str]
    steps: list[str]
    solution: str
    escalation: str
    team: str
    related: list[str]

    class Config:
        from_attributes = True


class GuideSummary(BaseModel):
    guide_id: str
    title: str
    collection: str
    category: str
    team: str


class UploadGuideResponse(BaseModel):
    collection: str
    filename: str
    guides_parsed: int
    total_guides: int


class SavedSolutionOut(BaseModel):
    id: str
    session_id: str
    problem: str
    category: str = ""
    guide_title: str
    guide_id: str
    possible_causes: list[str] = []
    steps: list[str]
    solution: str
    team: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class EscalationRequest(BaseModel):
    session_id: str
    reason: Optional[str] = ""
    team: Optional[str] = ""


class EscalationOut(BaseModel):
    id: str
    session_id: str
    reason: str
    team: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class InsightsOut(BaseModel):
    problems_analyzed: int
    guides_retrieved: int
    active_sessions: int
    escalated: int
    solved: int


class SearchResult(BaseModel):
    type: str          # "guide" | "session"
    id: str
    title: str
    subtitle: str = ""
