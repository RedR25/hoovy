from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: uuid4().hex)
    scenario_id: Mapped[str] = mapped_column(String(255))
    language: Mapped[str] = mapped_column(String(10), default="en")
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    trials: Mapped[list["Trial"]] = relationship(
        "Trial", back_populates="session", cascade="all, delete-orphan"
    )
    attention_logs: Mapped[list["AttentionLog"]] = relationship(
        "AttentionLog", back_populates="session", cascade="all, delete-orphan"
    )


class Trial(Base):
    __tablename__ = "trials"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("sessions.id", ondelete="CASCADE")
    )
    step_id: Mapped[str] = mapped_column(String(255))
    attempt_number: Mapped[int]
    response_value: Mapped[str] = mapped_column(String(2048))
    response_type: Mapped[str] = mapped_column(String(20))
    is_correct: Mapped[bool]
    was_prompted: Mapped[bool]
    latency_ms: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    session: Mapped["Session"] = relationship("Session", back_populates="trials")


class AttentionLog(Base):
    __tablename__ = "attention_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("sessions.id", ondelete="CASCADE")
    )
    step_id: Mapped[str] = mapped_column(String(255))
    on_screen_pct: Mapped[float] = mapped_column(Float)
    off_screen_seconds: Mapped[int] = mapped_column(Integer)
    redirects_triggered: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    session: Mapped["Session"] = relationship("Session", back_populates="attention_logs")
