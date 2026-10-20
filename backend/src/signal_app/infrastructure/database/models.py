from datetime import date, datetime
from uuid import UUID

from sqlalchemy import JSON, CheckConstraint, Date, DateTime, Enum, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from signal_app.domain.enums import ActionStatus, Category, IssueStatus, Priority, Role, Severity


class Base(DeclarativeBase):
    pass


def enum(kind):
    return Enum(kind, native_enum=False, create_constraint=True, validate_strings=True)


class UserModel(Base):
    __tablename__ = "users"
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254), unique=True)
    role: Mapped[Role] = mapped_column(enum(Role))
    avatar_color: Mapped[str] = mapped_column(String(7))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ProjectModel(Base):
    __tablename__ = "projects"
    __table_args__ = (CheckConstraint("status IN ('ACTIVE','ARCHIVED')", name="project_status"),)
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    code: Mapped[str] = mapped_column(String(12), unique=True)
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(12))
    owner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class IssueModel(Base):
    __tablename__ = "issues"
    __table_args__ = (CheckConstraint("version > 0", name="positive_version"),)
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)
    reference_code: Mapped[str] = mapped_column(String(20), unique=True)
    project_id: Mapped[UUID] = mapped_column(ForeignKey("projects.id"), index=True)
    title: Mapped[str] = mapped_column(String(180))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[Category] = mapped_column(enum(Category))
    priority: Mapped[Priority] = mapped_column(enum(Priority))
    status: Mapped[IssueStatus] = mapped_column(enum(IssueStatus), index=True)
    reporter_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    assignee_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    due_date: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    version: Mapped[int]
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class RiskModel(Base):
    __tablename__ = "risk_assessments"
    __table_args__ = (
        CheckConstraint("likelihood BETWEEN 1 AND 5", name="valid_likelihood"),
        CheckConstraint("impact BETWEEN 1 AND 5", name="valid_impact"),
        CheckConstraint("score = likelihood * impact", name="calculated_score"),
        CheckConstraint(
            "(score <= 4 AND severity = 'LOW') OR (score BETWEEN 5 AND 9 AND severity = 'MODERATE') "
            "OR (score BETWEEN 10 AND 16 AND severity = 'HIGH') OR (score >= 17 AND severity = 'CRITICAL')",
            name="calculated_severity",
        ),
        Index("ix_risk_issue_time", "issue_id", "assessed_at"),
    )
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)
    issue_id: Mapped[UUID] = mapped_column(ForeignKey("issues.id"))
    likelihood: Mapped[int]
    impact: Mapped[int]
    score: Mapped[int]
    severity: Mapped[Severity] = mapped_column(enum(Severity))
    rationale: Mapped[str] = mapped_column(Text)
    assessed_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    assessed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ActionModel(Base):
    __tablename__ = "mitigation_actions"
    __table_args__ = (
        CheckConstraint("(status = 'DONE') = (completed_at IS NOT NULL)", name="done_timestamp"),
    )
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)
    issue_id: Mapped[UUID] = mapped_column(ForeignKey("issues.id"), index=True)
    title: Mapped[str] = mapped_column(String(180))
    description: Mapped[str] = mapped_column(Text)
    owner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[ActionStatus] = mapped_column(enum(ActionStatus), index=True)
    due_date: Mapped[date] = mapped_column(Date, index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class CommentModel(Base):
    __tablename__ = "comments"
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)
    issue_id: Mapped[UUID] = mapped_column(ForeignKey("issues.id"), index=True)
    author_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class AuditModel(Base):
    __tablename__ = "audit_events"
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)
    issue_id: Mapped[UUID] = mapped_column(ForeignKey("issues.id"), index=True)
    actor_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    event_type: Mapped[str] = mapped_column(String(50))
    previous_value: Mapped[dict | None] = mapped_column(JSON)
    new_value: Mapped[dict] = mapped_column(JSON)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
