from dataclasses import asdict
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Request

from signal_app.application.queries import Queries
from signal_app.application.services import (
    AddComment,
    CreateIssue,
    Deletion,
    EditIssue,
    Mitigation,
    ReassessRisk,
    TransitionIssue,
)
from signal_app.domain.exceptions import Forbidden, NotFound

from . import schemas as s

router = APIRouter(prefix="/api/v1")


def uow(request: Request):
    return request.app.state.uow


def actor(request: Request, x_demo_user: Annotated[UUID | None, Header()] = None):
    if not request.app.state.demo_mode:
        raise Forbidden("Writes are disabled. Production authentication is not implemented.")
    if x_demo_user is None:
        raise Forbidden("Choose a fictional demo user before making changes.")
    return x_demo_user


Uow = Annotated[object, Depends(uow)]
Actor = Annotated[UUID, Depends(actor)]


@router.get("/config")
def configuration(request: Request):
    return {"demo_mode": request.app.state.demo_mode, "version": "1.0.0", "deletion": True}


@router.get("/users", response_model=list[s.UserOut])
def users(factory: Uow):
    return Queries(factory).catalog()["users"]


@router.get("/projects", response_model=list[s.ProjectStats])
def projects(factory: Uow):
    return Queries(factory).summary()["projects"]


@router.get("/projects/{project_id}", response_model=s.ProjectStats)
def project(project_id: UUID, factory: Uow):
    for item in Queries(factory).summary()["projects"]:
        if item["id"] == project_id:
            return item
    raise NotFound("Project was not found.")


@router.get("/issues", response_model=s.IssuePage)
def issues(
    factory: Uow,
    search: str = Query("", max_length=180),
    status: s.IssueStatus | None = None,
    severity: s.Severity | None = None,
    project_id: UUID | None = None,
    assignee_id: UUID | None = None,
    active_only: bool = False,
    deleted: bool = False,
    sort: Literal[
        "updated_at", "created_at", "title", "risk_score", "due_date", "reference_code"
    ] = "updated_at",
    direction: Literal["asc", "desc"] = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    return Queries(factory).issues(
        search=search,
        status=status,
        severity=severity,
        project_id=project_id,
        assignee_id=assignee_id,
        active_only=active_only,
        deleted=deleted,
        sort=sort,
        direction=direction,
        page=page,
        page_size=page_size,
    )


@router.post("/issues", response_model=s.IssueOut, status_code=201)
def create_issue(body: s.CreateInput, actor_id: Actor, factory: Uow):
    issue = CreateIssue(factory).execute(actor_id, **body.model_dump())
    return Queries(factory).detail(issue.id)


@router.get("/issues/{issue_id}", response_model=s.IssueDetail)
def detail(issue_id: UUID, factory: Uow):
    return Queries(factory).detail(issue_id)


@router.delete("/issues/{issue_id}", response_model=s.IssueOut)
def delete_issue(issue_id: UUID, body: s.Versioned, actor_id: Actor, factory: Uow):
    Deletion(factory).issue(issue_id, actor_id, body.expected_version)
    return Queries(factory).detail(issue_id)


@router.post("/issues/{issue_id}/restore", response_model=s.IssueOut)
def restore_issue(issue_id: UUID, body: s.Versioned, actor_id: Actor, factory: Uow):
    Deletion(factory).issue(issue_id, actor_id, body.expected_version, restore=True)
    return Queries(factory).detail(issue_id)


@router.patch("/issues/{issue_id}", response_model=s.IssueOut)
def edit(issue_id: UUID, body: s.EditInput, actor_id: Actor, factory: Uow):
    EditIssue(factory).execute(issue_id, actor_id, **body.model_dump(exclude_unset=True))
    return Queries(factory).detail(issue_id)


@router.post("/issues/{issue_id}/transitions", response_model=s.IssueOut)
def transition(issue_id: UUID, body: s.TransitionInput, actor_id: Actor, factory: Uow):
    TransitionIssue(factory).execute(issue_id, actor_id, body.expected_version, body.status)
    return Queries(factory).detail(issue_id)


@router.get("/issues/{issue_id}/risk-assessments", response_model=list[s.RiskHistory])
def risk_history(issue_id: UUID, factory: Uow):
    return Queries(factory).detail(issue_id)["assessments"]


@router.post("/issues/{issue_id}/risk-assessments", response_model=s.RiskOut, status_code=201)
def reassess(issue_id: UUID, body: s.ReassessInput, actor_id: Actor, factory: Uow):
    return asdict(ReassessRisk(factory).execute(issue_id, actor_id, **body.model_dump()))


@router.get("/issues/{issue_id}/actions", response_model=list[s.ActionDetail])
def issue_actions(issue_id: UUID, factory: Uow):
    return Queries(factory).detail(issue_id)["actions"]


@router.post("/issues/{issue_id}/actions", response_model=s.ActionOut, status_code=201)
def plan(issue_id: UUID, body: s.ActionInput, actor_id: Actor, factory: Uow):
    return asdict(Mitigation(factory).plan(issue_id, actor_id, **body.model_dump()))


@router.patch("/actions/{action_id}", response_model=s.ActionOut)
def complete(action_id: UUID, body: s.ActionUpdate, actor_id: Actor, factory: Uow):
    return asdict(Mitigation(factory).complete(action_id, actor_id, body.expected_version, body.status))


@router.get("/actions", response_model=list[s.ActionDetail])
def actions(
    factory: Uow, status: s.ActionStatus | None = None, owner_id: UUID | None = None, deleted: bool = False
):
    return Queries(factory).actions(status, owner_id, deleted=deleted)


@router.delete("/actions/{action_id}", response_model=s.ActionOut)
def delete_action(action_id: UUID, body: s.Versioned, actor_id: Actor, factory: Uow):
    return asdict(Deletion(factory).action(action_id, actor_id, body.expected_version))


@router.post("/actions/{action_id}/restore", response_model=s.ActionOut)
def restore_action(action_id: UUID, body: s.Versioned, actor_id: Actor, factory: Uow):
    return asdict(Deletion(factory).action(action_id, actor_id, body.expected_version, restore=True))


@router.get("/issues/{issue_id}/comments", response_model=list[s.CommentDetail])
def comments(issue_id: UUID, factory: Uow):
    return Queries(factory).detail(issue_id)["comments"]


@router.post("/issues/{issue_id}/comments", response_model=s.CommentOut, status_code=201)
def comment(issue_id: UUID, body: s.CommentInput, actor_id: Actor, factory: Uow):
    return asdict(AddComment(factory).execute(issue_id, actor_id, **body.model_dump()))


@router.get("/issues/{issue_id}/activity", response_model=list[s.AuditOut])
def issue_activity(issue_id: UUID, factory: Uow):
    return Queries(factory).detail(issue_id)["activity"]


@router.get("/activity", response_model=s.ActivityPage)
def activity(
    factory: Uow,
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    search: str = Query("", max_length=180),
    event_type: str | None = Query(None, max_length=40),
    project_id: UUID | None = None,
):
    return Queries(factory).activity(page, page_size, search, event_type, project_id)


@router.get("/dashboard/summary", response_model=s.Summary)
def summary(factory: Uow):
    return Queries(factory).summary()


@router.get("/analytics/risk-matrix", response_model=list[s.MatrixCell])
def matrix(factory: Uow):
    return Queries(factory).summary()["matrix"]


@router.get("/analytics/risk-distribution", response_model=list[s.Distribution])
def distribution(factory: Uow):
    return Queries(factory).summary()["distribution"]


@router.get("/analytics/trends", response_model=s.Analytics)
def trends(factory: Uow, days: int = Query(90, ge=7, le=365)):
    return Queries(factory).trends(days)


@router.get("/analytics/operations", response_model=s.Operations)
def operations(factory: Uow):
    return Queries(factory).operations()
