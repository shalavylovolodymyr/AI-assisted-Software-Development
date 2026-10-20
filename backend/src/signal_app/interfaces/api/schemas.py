from datetime import date, datetime
from typing import Annotated, Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StrictInt, StringConstraints, model_validator

from signal_app.domain.enums import ActionStatus, Category, IssueStatus, Priority, Role, Severity

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=180)]
Body = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=10000)]
Rating = Annotated[StrictInt, Field(ge=1, le=5)]


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Versioned(Contract):
    expected_version: Annotated[StrictInt, Field(ge=1)]


class RiskInput(Contract):
    likelihood: Rating
    impact: Rating
    rationale: Body


class CreateInput(RiskInput):
    project_id: UUID
    title: Title
    description: Body
    category: Category
    priority: Priority
    assignee_id: UUID
    due_date: date | None = None


class ReassessInput(RiskInput, Versioned):
    pass


class ActionInput(Versioned):
    title: Title
    description: Body
    owner_id: UUID
    due_date: date


class ActionUpdate(Versioned):
    status: ActionStatus


class TransitionInput(Versioned):
    status: IssueStatus


class CommentInput(Versioned):
    body: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=5000)]


class EditInput(Versioned):
    title: Title | None = None
    description: Body | None = None
    assignee_id: UUID | None = None
    category: Category | None = None
    priority: Priority | None = None
    due_date: date | None = None

    @model_validator(mode="after")
    def valid_patch(self):
        changes = self.model_fields_set - {"expected_version"}
        if not changes:
            raise ValueError("Provide at least one field to edit.")
        if any(getattr(self, name) is None for name in changes - {"due_date"}):
            raise ValueError("Only due_date may be cleared.")
        return self


class UserOut(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: Role
    avatar_color: str
    created_at: datetime


class ProjectOut(BaseModel):
    id: UUID
    name: str
    code: str
    description: str
    status: str
    owner_id: UUID
    created_at: datetime


class ProjectStats(ProjectOut):
    owner: UserOut
    active_issues: int
    critical_risks: int
    progress: int


class RiskOut(BaseModel):
    id: UUID
    issue_id: UUID
    likelihood: int
    impact: int
    score: int
    severity: Severity
    rationale: str
    assessed_by: UUID
    assessed_at: datetime


class RiskHistory(RiskOut):
    assessor: UserOut


class IssueOut(BaseModel):
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
    resolved_at: datetime | None
    version: int
    risk: RiskOut | None
    project: ProjectOut
    assignee: UserOut
    reporter: UserOut


class ActionOut(BaseModel):
    id: UUID
    issue_id: UUID
    title: str
    description: str
    owner_id: UUID
    status: ActionStatus
    due_date: date
    completed_at: datetime | None
    created_at: datetime


class ActionDetail(ActionOut):
    owner: UserOut
    issue_reference: str
    issue_title: str
    issue_status: IssueStatus
    issue_version: int
    overdue: bool


class AuditOut(BaseModel):
    id: UUID
    issue_id: UUID
    actor_id: UUID
    event_type: str
    previous_value: dict[str, Any] | None
    new_value: dict[str, Any]
    occurred_at: datetime
    actor: UserOut
    issue_reference: str
    issue_title: str


class CommentOut(BaseModel):
    id: UUID
    issue_id: UUID
    author_id: UUID
    body: str
    created_at: datetime


class CommentDetail(CommentOut):
    author: UserOut


class IssueDetail(IssueOut):
    assessments: list[RiskHistory]
    actions: list[ActionDetail]
    comments: list[CommentDetail]
    activity: list[AuditOut]


class IssuePage(BaseModel):
    items: list[IssueOut]
    total: int
    page: int
    page_size: int


class ActivityPage(BaseModel):
    items: list[AuditOut]
    total: int
    page: int
    page_size: int


class Distribution(BaseModel):
    severity: Severity
    count: int


class StatusCount(BaseModel):
    status: IssueStatus
    count: int


class MatrixCell(BaseModel):
    impact: int
    likelihood: int
    score: int
    severity: Severity
    count: int
    issues: list[IssueOut]


class MitigationSummary(BaseModel):
    done: int
    total: int
    progress: int


class Summary(BaseModel):
    active_issues: int
    critical_risks: int
    overdue_actions: int
    resolved_issues: int
    total_issues: int
    distribution: list[Distribution]
    statuses: list[StatusCount]
    critical_issues: list[IssueOut]
    activity: list[AuditOut]
    matrix: list[MatrixCell]
    projects: list[ProjectStats]
    mitigation: MitigationSummary
    generated_at: datetime


class TrendDay(BaseModel):
    date: date
    created: int
    resolved: int
    active: int
    average_risk: float | None
    completed_actions: int
    events: int


class TrendMetrics(BaseModel):
    created: int
    resolved: int
    completed_actions: int
    assessments: int
    events: int
    resolution_days: float | None


class CategoryCount(BaseModel):
    category: Category
    count: int


class ActionCount(BaseModel):
    status: ActionStatus
    count: int


class Analytics(BaseModel):
    days: int
    generated_at: datetime
    timeline: list[TrendDay]
    metrics: TrendMetrics
    categories: list[CategoryCount]
    action_statuses: list[ActionCount]
    total_events: int


class HealthBucket(BaseModel):
    label: str
    count: int


class HealthMetrics(BaseModel):
    unplanned_issues: int
    stale_reviews: int
    awaiting_review: int
    on_time_completion: float | None


class OwnerHealth(BaseModel):
    id: UUID
    name: str
    active: int
    critical: int
    average_risk: float | None
    overdue_actions: int


class ProjectHealth(OwnerHealth):
    code: str


class OverdueWork(BaseModel):
    id: UUID
    issue_id: UUID
    title: str
    reference: str
    owner: str
    due_date: date
    days_overdue: int


class Operations(BaseModel):
    generated_at: datetime
    metrics: HealthMetrics
    aging: list[HealthBucket]
    review_freshness: list[HealthBucket]
    risk_movement: list[HealthBucket]
    action_outlook: list[HealthBucket]
    owners: list[OwnerHealth]
    projects: list[ProjectHealth]
    overdue_actions: list[OverdueWork]
