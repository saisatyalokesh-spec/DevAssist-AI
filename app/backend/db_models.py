"""
SQLAlchemy models.

Table names and columns follow spec section 28 (support_sessions,
troubleshooting_steps, escalations, saved_solutions) plus two small
additions needed to make the app actually work end-to-end:

  * `users` is included per the spec list but this build is single-tenant
    (no login screen was requested — the spec explicitly says no user
    profile section in the UI) so it is not wired into the API yet.
  * `support_messages` is folded into `troubleshooting_steps` (each step's
    instruction + the junior developer's reported result *is* the message
    history) rather than kept as a separate parallel table, since spec
    section 24's example timeline is exactly the step list rendered in
    order.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Integer, Boolean, Float, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship

from .database import Base


def _uuid() -> str:
    return uuid.uuid4().hex[:12]


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, default="Junior Developer")
    created_at = Column(DateTime, default=_now)


class SupportSession(Base):
    __tablename__ = "support_sessions"

    id = Column(String, primary_key=True, default=_uuid)          # e.g. "DA-2026-00125"
    problem = Column(Text, nullable=False)
    category = Column(String, default="")
    collection = Column(String, default="")                        # "common" | "complex"
    problem_type = Column(String, default="")                      # alias of category, spec section 27
    guide_id = Column(String, default="")
    confidence = Column(Float, default=0.0)
    status = Column(String, default="in_progress")                 # in_progress|solved|escalated|needs_clarification
    priority = Column(String, default="Medium")
    product_area = Column(String, default="")
    environment = Column(String, default="")
    customer_impact = Column(String, default="")
    steps_already_tried = Column(Text, default="")
    source = Column(String, default="text")                        # text | image
    responsible_team = Column(String, default="")
    current_step_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now)

    steps = relationship("TroubleshootingStep", back_populates="session",
                          cascade="all, delete-orphan", order_by="TroubleshootingStep.step_number")
    escalations = relationship("Escalation", back_populates="session", cascade="all, delete-orphan")


class TroubleshootingStep(Base):
    __tablename__ = "troubleshooting_steps"

    id = Column(String, primary_key=True, default=_uuid)
    session_id = Column(String, ForeignKey("support_sessions.id"))
    step_number = Column(Integer, default=1)
    instruction = Column(Text, default="")
    result = Column(Text, default="")
    status = Column(String, default="pending")   # pending | completed | resolved | still_failing | escalated
    created_at = Column(DateTime, default=_now)

    session = relationship("SupportSession", back_populates="steps")


class Escalation(Base):
    __tablename__ = "escalations"

    id = Column(String, primary_key=True, default=_uuid)
    session_id = Column(String, ForeignKey("support_sessions.id"))
    reason = Column(Text, default="")
    team = Column(String, default="")
    context = Column(JSON, default=dict)
    status = Column(String, default="open")   # open | acknowledged | resolved
    created_at = Column(DateTime, default=_now)

    session = relationship("SupportSession", back_populates="escalations")


class SavedSolution(Base):
    __tablename__ = "saved_solutions"

    id = Column(String, primary_key=True, default=_uuid)
    session_id = Column(String, ForeignKey("support_sessions.id"), unique=True)
    problem = Column(Text, default="")
    category = Column(String, default="")
    guide_title = Column(String, default="")
    guide_id = Column(String, default="")
    possible_causes = Column(JSON, default=list)
    steps = Column(JSON, default=list)
    solution = Column(Text, default="")
    team = Column(String, default="")
    status = Column(String, default="solved")
    created_at = Column(DateTime, default=_now)
