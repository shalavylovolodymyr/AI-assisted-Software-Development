from dataclasses import dataclass
from datetime import date, datetime
from uuid import UUID

from .enums import ActionStatus, Category, IssueStatus, Priority, Role, Severity


@dataclass
class User:
    id: UUID
    full_name: str
    email: str
    role: Role
    avatar_color: str
    created_at: datetime


@dataclass
class Project:
    id: UUID
    name: str
    code: str
    description: str
    status: str
    owner_id: UUID
    created_at: datetime


@dataclass
class Issue:
    id: UUID
    reference_code: str
    project_id: UUID
    title: str
    description: str
    category: Category
    priority: Priority
    status: IssueStatus
    reporter_id: UUID
    assignee_id: UUID
    due_date: date | None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None
    version: int = 1


@dataclass(frozen=True)
class RiskAssessment:
    id: UUID
    issue_id: UUID
    likelihood: int
    impact: int
    score: int
    severity: Severity
    rationale: str
    assessed_by: UUID
    assessed_at: datetime


@dataclass
class MitigationAction:
    id: UUID
    issue_id: UUID
    title: str
    description: str
    owner_id: UUID
    status: ActionStatus
    due_date: date
    completed_at: datetime | None
    created_at: datetime


@dataclass(frozen=True)
class Comment:
    id: UUID
    issue_id: UUID
    author_id: UUID
    body: str
    created_at: datetime


@dataclass(frozen=True)
class AuditEvent:
    id: UUID
    issue_id: UUID
    actor_id: UUID
    event_type: str
    previous_value: dict | None
    new_value: dict
    occurred_at: datetime
