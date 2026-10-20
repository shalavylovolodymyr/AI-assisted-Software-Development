import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  ArrowUp,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { useChange, useData } from "../api";
import { useWorkspace } from "../Workspace";
import type {
  Action,
  ActionStatus,
  Detail,
  Issue,
  IssueStatus,
  Page,
} from "../types";
import {
  Avatar,
  Badge,
  date,
  ErrorMessage,
  label,
  Modal,
  Person,
  Progress,
  RiskScore,
  State,
} from "../components/ui";
import { ActionForm, EditForm, RiskForm } from "../components/forms";
import { Checkbox, Hint, Select } from "../components/controls";
import { ActivityFeed, PageHeader } from "./portfolio";
import { IssueRiskChart } from "../components/issue-risk-chart";

export function IssueTable({
  issues,
  compact = false,
}: {
  issues: Issue[];
  compact?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <State empty={!issues.length}>
      <div className="table-scroll">
        <table className={`issue-table ${compact ? "compact-table" : ""}`}>
          <thead>
            <tr>
              <th>Issue</th>
              {!compact && <th>Project</th>}
              <th>Status</th>
              <th>Risk</th>
              {!compact && (
                <>
                  <th>Priority</th>
                  <th>Owner</th>
                  <th>Due date</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {issues.map((i) => (
              <tr
                key={i.id}
                onClick={(event) => {
                  if (
                    !(event.target as Element).closest(
                      "a, button, select, input",
                    )
                  )
                    navigate(`/issues/${i.id}`);
                }}
              >
                <td>
                  <Link className="issue-title-link" to={`/issues/${i.id}`}>
                    <code>{i.reference_code}</code>
                    <strong>{i.title}</strong>
                    {compact && <small>{i.project.name}</small>}
                  </Link>
                </td>
                {!compact && (
                  <td>
                    <span className="project-code">{i.project.code}</span>
                  </td>
                )}
                <td>
                  <Badge value={i.status} />
                </td>
                <td>
                  {i.risk ? (
                    <RiskScore
                      score={i.risk.score}
                      severity={i.risk.severity}
                    />
                  ) : (
                    "Unassessed"
                  )}
                </td>
                {!compact && (
                  <>
                    <td>
                      <span
                        className={`priority priority-${i.priority.toLowerCase()}`}
                      >
                        <span />
                        {label(i.priority)}
                      </span>
                    </td>
                    <td>
                      <Person user={i.assignee} />
                    </td>
                    <td className="nowrap muted">{date(i.due_date)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </State>
  );
}

export function Issues({ onCreate }: { onCreate: () => void }) {
  const { projects, users, demo } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "",
    status = params.get("status") || "",
    severity = params.get("severity") || "",
    project = params.get("project_id") || "";
  const page = Number(params.get("page") || 1);
  const query = useData<Page<Issue>>(`/issues?${params.toString()}`, 30000);
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  }
  return (
    <>
      <PageHeader title="Issues">
        {demo && (
          <button className="button primary" onClick={onCreate}>
            <Plus size={16} />
            Create issue
          </button>
        )}
      </PageHeader>
      <section className="panel issues-panel">
        <div className="issues-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="Search issues"
              placeholder="Search by title or reference…"
              value={search}
              onChange={(e) => update("search", e.target.value)}
            />
          </div>
          <div className="filter-group">
            <Checkbox
              label="Active only"
              checked={params.get("active_only") === "true"}
              onCheckedChange={(checked) =>
                update("active_only", checked ? "true" : "")
              }
            />
            <Select
              label="Filter status"
              value={status}
              onValueChange={(value) => update("status", value)}
              options={[
                { value: "", label: "All statuses" },
                ...["OPEN", "IN_PROGRESS", "MITIGATED", "RESOLVED"].map(
                  (value) => ({ value, label: label(value) }),
                ),
              ]}
            />
            <Select
              label="Filter severity"
              value={severity}
              onValueChange={(value) => update("severity", value)}
              options={[
                { value: "", label: "All risk levels" },
                ...["CRITICAL", "HIGH", "MODERATE", "LOW"].map((value) => ({
                  value,
                  label: label(value),
                })),
              ]}
            />
            <Select
              label="Filter project"
              value={project}
              onValueChange={(value) => update("project_id", value)}
              options={[
                { value: "", label: "All projects" },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            {params.get("assignee_id") && (
              <Select
                label="Filter issue owner"
                value={params.get("assignee_id") || ""}
                onValueChange={(value) => update("assignee_id", value)}
                options={[
                  { value: "", label: "All owners" },
                  ...users.map((person) => ({
                    value: person.id,
                    label: person.full_name,
                  })),
                ]}
              />
            )}
          </div>
        </div>
        <div className="table-context">
          <span>
            <span className="connected-dot" />
            {query.data?.total ?? "…"} issues in view
          </span>
          <div>
            <label className="sort-control">
              Sort by
              <Select
                className="sort-select"
                label="Sort issues"
                value={params.get("sort") || "updated_at"}
                onValueChange={(value) => update("sort", value)}
                options={[
                  { value: "updated_at", label: "Last updated" },
                  { value: "risk_score", label: "Risk score" },
                  { value: "due_date", label: "Due date" },
                  { value: "title", label: "Title" },
                  { value: "created_at", label: "Created date" },
                ]}
              />
            </label>
            <button
              className="icon-button"
              aria-label="Toggle sort direction"
              onClick={() =>
                update(
                  "direction",
                  params.get("direction") === "asc" ? "desc" : "asc",
                )
              }
            >
              <ArrowDown
                size={14}
                style={{
                  transform:
                    params.get("direction") === "asc"
                      ? "rotate(180deg)"
                      : undefined,
                }}
              />
            </button>
          </div>
        </div>
        <State loading={query.isPending} error={query.error}>
          {query.data && (
            <>
              <IssueTable issues={query.data.items} />
              <div className="pagination">
                <span>
                  Showing {query.data.total ? (page - 1) * 10 + 1 : 0}–
                  {Math.min(page * 10, query.data.total)} of {query.data.total}
                </span>
                <div>
                  <button
                    className="button secondary"
                    disabled={page <= 1}
                    onClick={() => update("page", String(page - 1))}
                  >
                    Previous
                  </button>
                  <span>Page {page}</span>
                  <button
                    className="button secondary"
                    disabled={page * 10 >= query.data.total}
                    onClick={() => update("page", String(page + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </State>
      </section>
    </>
  );
}

function ActionChange({
  action,
  target,
  onClose,
}: {
  action: Action;
  target: ActionStatus;
  onClose: () => void;
}) {
  const change = useChange(() => {
    onClose();
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={
        target === "DONE"
          ? "Complete this action?"
          : `Change action to ${label(target).toLowerCase()}?`
      }
      description={action.title}
    >
      <div className="form">
        <p className="muted">
          {target === "DONE"
            ? "Confirm the corrective work is finished. Completion time and the acting user will be recorded."
            : target === "CANCELLED"
              ? "Cancelled actions remain in the history and cannot be restarted."
              : "The change will be recorded in this issue’s activity history."}
        </p>
        <ErrorMessage error={change.error} />
        <div className="form-footer">
          <button className="button secondary" onClick={onClose}>
            Keep current status
          </button>
          <button
            className="button primary"
            disabled={change.isPending}
            onClick={() =>
              change.mutate({
                path: `/actions/${action.id}`,
                method: "PATCH",
                data: {
                  status: target,
                  expected_version: action.issue_version,
                },
              })
            }
          >
            {change.isPending ? "Saving…" : "Confirm change"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
export function ActionList({ actions }: { actions: Action[] }) {
  const { user, demo } = useWorkspace();
  const [changing, setChanging] = useState<{
    action: Action;
    target: ActionStatus;
  } | null>(null);
  return (
    <>
      <State empty={!actions.length}>
        <div className="table-scroll">
          <table className="action-table">
            <thead>
              <tr>
                <th>Corrective action</th>
                <th>Owner</th>
                <th>Due date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => {
                const editable =
                  demo &&
                  (a.owner_id === user?.id || user?.role !== "MEMBER") &&
                  !["DONE", "CANCELLED"].includes(a.status) &&
                  ["OPEN", "IN_PROGRESS"].includes(a.issue_status);
                return (
                  <tr key={a.id}>
                    <td>
                      <Link
                        className="action-title"
                        to={`/issues/${a.issue_id}`}
                      >
                        <span
                          className={`action-check ${a.status === "DONE" ? "complete" : ""}`}
                        >
                          {a.status === "DONE" && <Check size={12} />}
                        </span>
                        <span>
                          <strong>{a.title}</strong>
                          <code>{a.issue_reference}</code>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <Person user={a.owner} />
                    </td>
                    <td>
                      <span className={a.overdue ? "overdue" : "muted"}>
                        {a.overdue && <Clock3 size={13} />}
                        {date(a.due_date)}
                        {a.overdue && <small>Overdue</small>}
                      </span>
                    </td>
                    <td>
                      {editable ? (
                        <Select
                          className="action-status"
                          label={`Update ${a.title}`}
                          value={a.status}
                          onValueChange={(value) =>
                            setChanging({
                              action: a,
                              target: value as ActionStatus,
                            })
                          }
                          options={[
                            "TODO",
                            "IN_PROGRESS",
                            "DONE",
                            "CANCELLED",
                          ].map((value) => ({ value, label: label(value) }))}
                        />
                      ) : (
                        <Badge value={a.status} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </State>
      {changing && (
        <ActionChange
          key={changing.action.id}
          {...changing}
          onClose={() => setChanging(null)}
        />
      )}
    </>
  );
}
export function Actions() {
  const { users } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "",
    owner = params.get("owner_id") || "",
    overdue = params.get("overdue") === "true";
  const query = useData<Action[]>(
    `/actions?${new URLSearchParams({ ...(status ? { status } : {}), ...(owner ? { owner_id: owner } : {}) })}`,
    30000,
  );
  const items = query.data?.filter((a) => !overdue || a.overdue);
  const page = Number(params.get("page") || 1);
  const pageSize = 20;
  function update(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== "page") next.delete("page");
    setParams(next);
  }
  return (
    <>
      <PageHeader title="Actions" />
      <section className="panel">
        <div className="issues-toolbar">
          <div>
            <h2>Action register</h2>
            <p className="muted small-text">{items?.length ?? "…"} actions</p>
          </div>
          <div className="filter-group">
            <Checkbox
              label="Overdue only"
              checked={overdue}
              onCheckedChange={(checked) =>
                update("overdue", checked ? "true" : "")
              }
            />
            <Select
              label="Filter action status"
              value={status}
              onValueChange={(value) => update("status", value)}
              options={[
                { value: "", label: "All statuses" },
                ...["TODO", "IN_PROGRESS", "DONE", "CANCELLED"].map(
                  (value) => ({ value, label: label(value) }),
                ),
              ]}
            />
            <Select
              label="Filter action owner"
              value={owner}
              onValueChange={(value) => update("owner_id", value)}
              options={[
                { value: "", label: "All owners" },
                ...users.map((u) => ({ value: u.id, label: u.full_name })),
              ]}
            />
          </div>
        </div>
        <State loading={query.isPending} error={query.error}>
          {items && (
            <>
              <ActionList
                actions={items.slice((page - 1) * pageSize, page * pageSize)}
              />
              <div className="pagination">
                <span>
                  {items.length ? (page - 1) * pageSize + 1 : 0}–
                  {Math.min(page * pageSize, items.length)} of {items.length}
                </span>
                <div>
                  <button
                    className="button secondary"
                    disabled={page <= 1}
                    onClick={() => update("page", String(page - 1))}
                  >
                    Previous
                  </button>
                  <span>Page {page}</span>
                  <button
                    className="button secondary"
                    disabled={page * pageSize >= items.length}
                    onClick={() => update("page", String(page + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </State>
      </section>
    </>
  );
}

const targets: Record<IssueStatus, { status: IssueStatus; text: string }[]> = {
  OPEN: [{ status: "IN_PROGRESS", text: "Start work" }],
  IN_PROGRESS: [
    { status: "MITIGATED", text: "Mark mitigated" },
    { status: "OPEN", text: "Return to open" },
  ],
  MITIGATED: [
    { status: "RESOLVED", text: "Resolve issue" },
    { status: "IN_PROGRESS", text: "Resume work" },
  ],
  RESOLVED: [{ status: "IN_PROGRESS", text: "Reopen issue" }],
};

export function IssueDetailPage() {
  const { id } = useParams();
  const query = useData<Detail>(`/issues/${id}`, 30000);
  return (
    <State loading={query.isPending} error={query.error}>
      {query.data && <IssueWorkspace issue={query.data} />}
    </State>
  );
}
function IssueWorkspace({ issue }: { issue: Detail }) {
  const { demo } = useWorkspace();
  const [modal, setModal] = useState<"edit" | "risk" | "action" | null>(null);
  const [target, setTarget] = useState<IssueStatus | null>(null);
  const [comment, setComment] = useState("");
  const [tab, setTab] = useState<"history" | "activity">("history");
  const transition = useChange(() => {
    setTarget(null);
  });
  const addComment = useChange(() => {
    setComment("");
  });
  const done = issue.actions.filter((a) => a.status === "DONE").length;
  const required = issue.actions.filter((a) => a.status !== "CANCELLED").length;
  const risk = issue.risk;
  return (
    <>
      <Link to="/issues" className="back-link">
        <ArrowLeft size={15} />
        All issues
      </Link>
      <div className="detail-heading">
        <div>
          <div className="detail-eyebrow">
            <code>{issue.reference_code}</code>
            <ChevronRight size={13} />
            <span>{issue.project.name}</span>
          </div>
          <h1>{issue.title}</h1>
          <div className="detail-subline">
            <Badge value={issue.status} />
            <span>Reported by {issue.reporter.full_name}</span>
            <span>·</span>
            <span>{date(issue.created_at)}</span>
          </div>
        </div>
        {demo && (
          <Hint label="Edit issue">
            <button
              className="icon-button outlined"
              aria-label="Edit issue"
              onClick={() => setModal("edit")}
            >
              <Pencil size={17} />
            </button>
          </Hint>
        )}
      </div>
      <div className="detail-layout">
        <div className="detail-main">
          <section className="panel risk-detail">
            <div className="panel-header">
              <div>
                <h2>Risk</h2>
              </div>
              {demo && issue.status !== "RESOLVED" && (
                <Hint label="Assess risk">
                  <button
                    className="icon-button outlined"
                    aria-label="Assess risk"
                    onClick={() => setModal("risk")}
                  >
                    <Plus size={17} />
                  </button>
                </Hint>
              )}
            </div>
            {risk && (
              <>
                <div className="risk-detail-body">
                  <div className={`big-risk ${risk.severity.toLowerCase()}`}>
                    <strong>
                      {risk.score}
                      <small>/25</small>
                    </strong>
                    <Badge value={risk.severity} />
                  </div>
                  <div className="risk-factors">
                    <div>
                      <span>Likelihood</span>
                      <strong>
                        {risk.likelihood}
                        <small>/5</small>
                      </strong>
                    </div>
                    <span className="multiply">×</span>
                    <div>
                      <span>Impact</span>
                      <strong>
                        {risk.impact}
                        <small>/5</small>
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="risk-rationale">
                  <p>{risk.rationale}</p>
                  <span>
                    <ShieldCheck size={13} />
                    Assessed {date(risk.assessed_at, true)}
                  </span>
                </div>
                <IssueRiskChart assessments={issue.assessments} />
              </>
            )}
          </section>
          <section className="panel issue-description">
            <div className="panel-header">
              <h2>Context</h2>
              <span className="outline-chip">{label(issue.category)}</span>
            </div>
            <p>{issue.description}</p>
          </section>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>
                  Mitigation plan{" "}
                  <span className="count-chip">{issue.actions.length}</span>
                </h2>
                <p>
                  {done} of {required} required actions complete
                </p>
              </div>
              {demo && ["OPEN", "IN_PROGRESS"].includes(issue.status) && (
                <Hint label="Add action">
                  <button
                    className="icon-button outlined"
                    aria-label="Add action"
                    onClick={() => setModal("action")}
                  >
                    <Plus size={17} />
                  </button>
                </Hint>
              )}
            </div>
            <div className="action-progress">
              <Progress
                value={required ? Math.round((100 * done) / required) : 0}
              />
            </div>
            <ActionList actions={issue.actions} />
          </section>
          <section className="panel">
            <div className="tabs" role="tablist" aria-label="Issue history">
              <button
                role="tab"
                aria-selected={tab === "history"}
                onClick={() => setTab("history")}
              >
                Risk history<span>{issue.assessments.length}</span>
              </button>
              <button
                role="tab"
                aria-selected={tab === "activity"}
                onClick={() => setTab("activity")}
              >
                Activity<span>{issue.activity.length}</span>
              </button>
            </div>
            {tab === "history" ? (
              <div role="tabpanel" aria-label="Risk history">
                {[...issue.assessments].reverse().map((r, i) => (
                  <div className="history-item" key={r.id}>
                    <span className="history-node" />
                    <div>
                      <div className="history-title">
                        <strong>
                          {i === 0
                            ? "Current assessment"
                            : "Previous assessment"}
                        </strong>
                        <time>{date(r.assessed_at, true)}</time>
                        <RiskScore score={r.score} severity={r.severity} />
                      </div>
                      <p>{r.rationale}</p>
                      <span className="muted small-text">
                        {r.assessor?.full_name} · Likelihood {r.likelihood} ×
                        Impact {r.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div role="tabpanel" aria-label="Activity">
                <ActivityFeed events={issue.activity} />
              </div>
            )}
          </section>
          <section className="panel discussion-panel" aria-label="Discussion">
            <div className="panel-header">
              <h2>
                Discussion{" "}
                <span className="discussion-count">
                  {issue.comments.length}
                </span>
              </h2>
            </div>
            <div className="comments">
              {!issue.comments.length && (
                <p className="discussion-empty">No comments yet</p>
              )}
              {issue.comments.map((c) => (
                <article className="comment" key={c.id}>
                  <Avatar user={c.author} small />
                  <div>
                    <p className="comment-meta">
                      <strong>{c.author.full_name}</strong>
                      <time>{date(c.created_at, true)}</time>
                    </p>
                    <p className="comment-body">{c.body}</p>
                  </div>
                </article>
              ))}
              {demo && (
                <form
                  className="comment-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addComment.mutate({
                      path: `/issues/${issue.id}/comments`,
                      data: { body: comment, expected_version: issue.version },
                    });
                  }}
                >
                  <div>
                    <textarea
                      aria-label="Add a comment"
                      placeholder="Add a comment…"
                      value={comment}
                      maxLength={5000}
                      onChange={(e) => setComment(e.target.value)}
                      required
                    />
                    <div className="comment-form-bottom">
                      <Hint label="Add comment">
                        <button
                          className="comment-send"
                          aria-label="Add comment"
                          disabled={!comment.trim() || addComment.isPending}
                        >
                          <ArrowUp size={17} />
                        </button>
                      </Hint>
                    </div>
                    <ErrorMessage error={addComment.error} />
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
        <aside className="detail-aside">
          <section className="panel workflow-card">
            <h2>
              {issue.status === "RESOLVED"
                ? "Resolution verified."
                : issue.status === "MITIGATED"
                  ? "Ready to resolve"
                  : issue.status === "OPEN"
                    ? "Ready to start"
                    : "Work in progress"}
            </h2>
            {demo &&
              targets[issue.status].map((t) => (
                <button
                  key={t.status}
                  className="button secondary"
                  onClick={() => {
                    transition.reset();
                    setTarget(t.status);
                  }}
                >
                  {t.text}
                  <ArrowRight size={14} />
                </button>
              ))}
          </section>
          <section className="panel properties">
            <div className="panel-header">
              <h2>Details</h2>
            </div>
            <dl>
              <div>
                <dt>Project</dt>
                <dd>
                  <Link to={`/issues?project_id=${issue.project_id}`}>
                    {issue.project.name}
                    <ArrowUpRight size={12} />
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>
                  <Badge value={issue.priority} />
                </dd>
              </div>
              <div>
                <dt>Owner</dt>
                <dd>
                  <Person user={issue.assignee} />
                  {demo && (
                    <Hint label="Change owner">
                      <button
                        className="icon-button"
                        aria-label="Change owner"
                        onClick={() => setModal("edit")}
                      >
                        <Pencil size={14} />
                      </button>
                    </Hint>
                  )}
                </dd>
              </div>
              <div>
                <dt>Reporter</dt>
                <dd>
                  <Person user={issue.reporter} />
                </dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>
                  <CalendarDays size={14} />
                  {date(issue.due_date)}
                </dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{date(issue.created_at)}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{date(issue.updated_at, true)}</dd>
              </div>
              {issue.resolved_at && (
                <div>
                  <dt>Resolved</dt>
                  <dd>{date(issue.resolved_at, true)}</dd>
                </div>
              )}
            </dl>
          </section>
        </aside>
      </div>
      <Modal
        open={modal === "edit"}
        onClose={() => setModal(null)}
        title="Edit issue"
        description=""
        wide
      >
        <EditForm issue={issue} onClose={() => setModal(null)} />
      </Modal>
      <Modal
        open={modal === "risk"}
        onClose={() => setModal(null)}
        title="Reassess risk"
        description=""
      >
        <RiskForm issue={issue} onClose={() => setModal(null)} />
      </Modal>
      <Modal
        open={modal === "action"}
        onClose={() => setModal(null)}
        title="Plan a mitigation action"
        description=""
      >
        <ActionForm issue={issue} onClose={() => setModal(null)} />
      </Modal>
      {target && (
        <Modal
          open
          onClose={() => setTarget(null)}
          title={`${targets[issue.status].find((t) => t.status === target)?.text || "Change status"}?`}
          description={`${issue.reference_code} · ${issue.title}`}
        >
          <div className="form">
            <div className="transition-preview">
              <Badge value={issue.status} />
              <ArrowRight size={18} />
              <Badge value={target} />
            </div>
            <p className="muted">
              {target === "RESOLVED"
                ? "The server will verify all mitigation and reassessment evidence before closing this issue."
                : target === "MITIGATED"
                  ? "All non-cancelled mitigation actions must be complete."
                  : "This transition will be recorded in the audit history."}
            </p>
            <ErrorMessage error={transition.error} />
            <div className="form-footer">
              <button
                className="button secondary"
                onClick={() => setTarget(null)}
              >
                Cancel
              </button>
              <button
                className="button primary"
                disabled={transition.isPending}
                onClick={() =>
                  transition.mutate({
                    path: `/issues/${issue.id}/transitions`,
                    data: { status: target, expected_version: issue.version },
                  })
                }
              >
                {transition.isPending ? "Checking…" : "Confirm transition"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
