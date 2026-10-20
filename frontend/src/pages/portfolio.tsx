import { Fragment, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  Clock3,
  FolderKanban,
  Search,
  Layers3,
  Plus,
  ShieldAlert,
  Target,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Cell as ChartCell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { api, useData } from "../api";
import { useWorkspace } from "../Workspace";
import type {
  Analytics,
  Audit,
  Cell,
  Operations,
  Page,
  ProjectStats,
  Summary,
} from "../types";
import {
  ExcelExport,
  activitySheets,
  analyticsSheets,
  issueSheets,
  operationsSheets,
  projectSheets,
  summarySheets,
} from "../components/excel-export";
import { allPages } from "../components/export-fetch";
import {
  Avatar,
  Badge,
  date,
  label,
  Person,
  Progress,
  State,
} from "../components/ui";
import { IssueTable } from "./issues";
import {
  chartColors,
  chartTooltip,
  chartTooltipText,
} from "../components/chart-theme";
import { Hint, Select } from "../components/controls";
import {
  DashboardTrends,
  HistoryVolume,
  ProjectChart,
} from "../components/analytics";
import {
  OperationalOverview,
  OperationsCharts,
} from "../components/operations";

const colors = {
  LOW: chartColors.gray,
  MODERATE: chartColors.sand,
  HIGH: chartColors.amber,
  CRITICAL: chartColors.ink,
};
export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  const [toolbar, setToolbar] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    setToolbar(document.getElementById("page-toolbar"));
  }, []);
  const content = (
    <>
      <h1>{title}</h1>
      <div className="heading-actions">{children}</div>
    </>
  );
  return toolbar ? (
    createPortal(content, toolbar)
  ) : (
    <div className="page-heading">{content}</div>
  );
}
function PanelHeader({
  title,
  link,
  href,
}: {
  title: string;
  link?: string;
  href?: string;
}) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
      </div>
      {link && href && (
        <Hint label={link}>
          <Link className="icon-button" to={href} aria-label={link}>
            <ArrowUpRight size={17} />
          </Link>
        </Hint>
      )}
    </div>
  );
}

export function Overview({ onCreate }: { onCreate: () => void }) {
  const query = useData<Summary>("/dashboard/summary", 30000);
  const { demo } = useWorkspace();
  const d = query.data;
  return (
    <>
      <PageHeader title="Overview">
        <ExcelExport
          title="Signal overview"
          disabled={!d}
          getSheets={async () => [
            ...summarySheets(d!),
            ...operationsSheets(await api<Operations>("/analytics/operations")),
          ]}
        />
        {demo && (
          <button className="button primary" onClick={onCreate}>
            <Plus size={16} />
            Create issue
          </button>
        )}
      </PageHeader>
      <State loading={query.isPending} error={query.error}>
        {d && (
          <>
            <div className="kpi-grid">
              {[
                {
                  name: "Active issues",
                  value: d.active_issues,
                  icon: Layers3,
                  color: "purple",
                  to: "/issues?active_only=true",
                },
                {
                  name: "Critical risks",
                  value: d.critical_risks,
                  icon: ShieldAlert,
                  color: "rose",
                  to: "/issues?severity=CRITICAL&active_only=true",
                },
                {
                  name: "Overdue actions",
                  value: d.overdue_actions,
                  icon: Clock3,
                  color: "amber",
                  to: "/actions?overdue=true",
                },
                {
                  name: "Resolved issues",
                  value: d.resolved_issues,
                  icon: CheckCheck,
                  color: "green",
                  to: "/issues?status=RESOLVED",
                },
              ].map((k) => (
                <Link key={k.name} className={`kpi-card ${k.color}`} to={k.to}>
                  <div className="kpi-title">
                    {k.name}
                    <span className="kpi-icon">
                      <k.icon size={17} />
                    </span>
                  </div>
                  <div className="kpi-number">
                    {k.value.toString().padStart(2, "0")}
                  </div>
                </Link>
              ))}
            </div>
            <OperationalOverview />
            <div className="dashboard-charts">
              <section className="panel distribution-panel">
                <PanelHeader title="Risk exposure" />
                <div className="distribution-content">
                  <div className="donut-wrap">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={d.distribution}
                          dataKey="count"
                          nameKey="severity"
                          innerRadius="64%"
                          outerRadius="82%"
                          stroke="var(--surface)"
                          strokeWidth={5}
                          paddingAngle={2}
                          isAnimationActive={false}
                        >
                          {d.distribution.map((s) => (
                            <ChartCell
                              key={s.severity}
                              fill={colors[s.severity]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={chartTooltip}
                          itemStyle={chartTooltipText}
                          labelStyle={chartTooltipText}
                          formatter={(value, name) => [
                            value,
                            label(String(name)),
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-label">
                      <strong>{d.active_issues}</strong>
                      <span>active issues</span>
                    </div>
                  </div>
                  <div className="risk-legend">
                    {[...d.distribution].reverse().map((s) => (
                      <Link
                        to={`/issues?severity=${s.severity}&active_only=true`}
                        key={s.severity}
                      >
                        <span
                          className="legend-dot"
                          style={{ background: colors[s.severity] }}
                        />
                        <span>{label(s.severity)}</span>
                        <strong>{s.count.toString().padStart(2, "0")}</strong>
                        <small>
                          {d.active_issues
                            ? Math.round((100 * s.count) / d.active_issues)
                            : 0}
                          %
                        </small>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
              <section className="panel matrix-preview-panel">
                <PanelHeader
                  title="Risk landscape"
                  link="Explore matrix"
                  href="/risk-matrix"
                />
                <RiskMatrix cells={d.matrix} compact />
                <div className="matrix-legend">
                  {Object.entries(colors).map(([s, c]) => (
                    <span key={s}>
                      <i style={{ background: c }} />
                      {label(s)}
                    </span>
                  ))}
                </div>
              </section>
            </div>
            <div className="mitigation-strip">
              <span className="mitigation-symbol">
                <Target size={21} />
              </span>
              <div>
                <h3>Mitigation progress</h3>
                <p>
                  {d.mitigation.done} of {d.mitigation.total} actions complete
                </p>
              </div>
              <div className="mitigation-strip-progress">
                <strong>
                  {d.mitigation.progress}%<small>complete</small>
                </strong>
                <Progress value={d.mitigation.progress} />
              </div>
              <Hint label="View actions">
                <Link
                  className="icon-button outlined"
                  to="/actions"
                  aria-label="View actions"
                >
                  <ArrowRight size={18} />
                </Link>
              </Hint>
            </div>
            <div className="dashboard-bottom">
              <section className="panel critical-panel">
                <PanelHeader
                  title="Priority attention"
                  link="All issues"
                  href="/issues"
                />
                <IssueTable issues={d.critical_issues.slice(0, 4)} compact />
              </section>
              <section className="panel activity-panel">
                <PanelHeader
                  title="Recent activity"
                  link="View all"
                  href="/activity"
                />
                <ActivityFeed events={d.activity.slice(0, 4)} compact />
              </section>
            </div>
            <section
              className="panel category-panel lifecycle-panel"
              aria-label="Issue lifecycle"
            >
              <PanelHeader title="Issue lifecycle" />
              <div className="category-grid lifecycle-grid">
                {d.statuses.map((s) => {
                  const total = Math.max(
                    1,
                    d.statuses.reduce((sum, row) => sum + row.count, 0),
                  );
                  return (
                    <Link
                      className="category-metric"
                      key={s.status}
                      to={`/issues?status=${s.status}`}
                    >
                      <span>{label(s.status)}</span>
                      <strong>{s.count}</strong>
                      <div
                        className="category-track"
                        role="meter"
                        aria-label={`${label(s.status)} issues`}
                        aria-valuenow={s.count}
                        aria-valuemin={0}
                        aria-valuemax={total}
                      >
                        <span
                          style={{ width: `${(s.count / total) * 100}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </State>
    </>
  );
}

export function ChartsPage() {
  const { projects } = useWorkspace();
  return (
    <>
      <PageHeader title="Charts" />
      <DashboardTrends />
      <OperationsCharts />
      <ProjectChart projects={projects} />
    </>
  );
}

export function RiskMatrix({
  cells,
  compact = false,
  selected,
  onSelect,
}: {
  cells: Cell[];
  compact?: boolean;
  selected?: string;
  onSelect?: (cell: Cell) => void;
}) {
  return (
    <div className={`matrix-container ${compact ? "compact" : ""}`}>
      <span className="matrix-y-title">Impact</span>
      <div className="matrix-grid">
        {[5, 4, 3, 2, 1].map((impact) => (
          <div className="matrix-row" key={impact}>
            <span className="matrix-axis">{impact}</span>
            {[1, 2, 3, 4, 5].map((likelihood) => {
              const cell = cells.find(
                (c) => c.impact === impact && c.likelihood === likelihood,
              );
              if (!cell) return null;
              const key = `${likelihood}-${impact}`;
              const content = (
                <>
                  <strong>
                    {cell.count || <span className="empty-cell-dot">·</span>}
                  </strong>
                </>
              );
              const props = {
                className: `matrix-cell ${cell.severity.toLowerCase()} ${selected === key ? "selected" : ""}`,
                "aria-label": `Likelihood ${likelihood}, impact ${impact}: ${cell.count} issues, ${label(cell.severity)}`,
              };
              return (
                <Hint
                  key={key}
                  label={`Likelihood ${likelihood} × impact ${impact} · Score ${cell.score} · ${cell.count} issues`}
                >
                  {onSelect ? (
                    <button
                      {...props}
                      onClick={() => onSelect(cell)}
                      aria-pressed={selected === key}
                    >
                      {content}
                    </button>
                  ) : (
                    <Link
                      {...props}
                      to={`/risk-matrix?likelihood=${likelihood}&impact=${impact}`}
                    >
                      {content}
                    </Link>
                  )}
                </Hint>
              );
            })}
          </div>
        ))}
        <div className="matrix-row matrix-axis-row">
          <span />
          {[1, 2, 3, 4, 5].map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>
      </div>
      <span className="matrix-x-title">Likelihood</span>
    </div>
  );
}

export function RiskMatrixPage() {
  const query = useData<Summary>("/dashboard/summary", 30000);
  const [params, setParams] = useSearchParams();
  const l = Number(params.get("likelihood") || 5),
    i = Number(params.get("impact") || 4);
  const selected = query.data?.matrix.find(
    (c) => c.likelihood === l && c.impact === i,
  );
  return (
    <>
      <PageHeader title="Risk matrix">
        <ExcelExport
          title="Signal risk matrix"
          disabled={!query.data}
          getSheets={() => [
            ...summarySheets(query.data!),
            ...issueSheets(query.data!.matrix.flatMap((cell) => cell.issues)),
          ]}
        />
      </PageHeader>
      <State loading={query.isPending} error={query.error}>
        {query.data && (
          <>
            <div className="risk-page-layout">
              <section className="panel full-matrix">
                <RiskMatrix
                  cells={query.data.matrix}
                  selected={`${l}-${i}`}
                  onSelect={(cell) =>
                    setParams({
                      likelihood: String(cell.likelihood),
                      impact: String(cell.impact),
                    })
                  }
                />
                <div className="matrix-scale">
                  {Object.entries(colors).map(([s, color], index) => (
                    <Hint
                      key={s}
                      label={`${label(s)} · score ${["1–4", "5–9", "10–16", "17–25"][index]}`}
                    >
                      <div tabIndex={0}>
                        <i style={{ background: color }} />
                        <strong>{label(s)}</strong>
                      </div>
                    </Hint>
                  ))}
                </div>
              </section>
              <section className="panel selected-risks">
                <div className="panel-header">
                  <div>
                    <h2>
                      Likelihood {l} × Impact {i}
                    </h2>
                  </div>
                  {selected && <Badge value={selected.severity} />}
                </div>
                <div className="selected-risk-stat">
                  <strong>{selected?.count || 0}</strong>
                  <span>
                    active {selected?.count === 1 ? "issue" : "issues"}
                    <small>Risk score {selected?.score || 0} / 25</small>
                  </span>
                </div>
                <State empty={!selected?.issues.length}>
                  {selected?.issues.map((issue) => (
                    <Link
                      className="matrix-issue"
                      key={issue.id}
                      to={`/issues/${issue.id}`}
                    >
                      <div>
                        <code>{issue.reference_code}</code>
                      </div>
                      <h3>{issue.title}</h3>
                      <div>
                        <Person user={issue.assignee} />
                        <Badge value={issue.status} />
                      </div>
                    </Link>
                  ))}
                </State>
              </section>
            </div>
          </>
        )}
      </State>
    </>
  );
}

const eventLabel: Record<string, string> = {
  ISSUE_CREATED: "registered an issue",
  RISK_ASSESSED: "assessed risk",
  ACTION_PLANNED: "planned an action",
  ACTION_COMPLETED: "completed an action",
  ACTION_STATUS_CHANGED: "updated an action",
  STATUS_CHANGED: "changed issue status",
  ISSUE_REOPENED: "reopened an issue",
  ASSIGNMENT_CHANGED: "changed ownership",
  ISSUE_UPDATED: "updated an issue",
  COMMENT_ADDED: "added a comment",
  ISSUE_DELETED: "deleted an issue",
  ISSUE_RESTORED: "restored an issue",
  ACTION_DELETED: "deleted an action",
  ACTION_RESTORED: "restored an action",
};
export function ActivityFeed({
  events,
  compact = false,
}: {
  events: Audit[];
  compact?: boolean;
}) {
  return (
    <div className={`activity-feed ${compact ? "compact" : ""}`}>
      <State empty={!events.length}>
        {events.map((e, index) => (
          <Fragment key={e.id}>
            {!compact &&
              (index === 0 ||
                new Date(events[index - 1].occurred_at).toLocaleDateString() !==
                  new Date(e.occurred_at).toLocaleDateString()) && (
                <h3 className="activity-date">
                  {new Intl.DateTimeFormat(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(e.occurred_at))}
                </h3>
              )}
            <div className="activity-item">
              <Avatar user={e.actor} small />
              <div className="activity-item-body">
                <p>
                  <strong>{e.actor.full_name}</strong>{" "}
                  {eventLabel[e.event_type] || label(e.event_type)}
                </p>
                <Link to={`/issues/${e.issue_id}`}>
                  <code>{e.issue_reference}</code>
                  {!compact && <span>{e.issue_title}</span>}
                </Link>
                {e.event_type === "RISK_ASSESSED" && (
                  <span className="event-change">
                    {e.previous_value?.score !== undefined && (
                      <>
                        {String(e.previous_value.score)}{" "}
                        <ArrowRight size={12} />{" "}
                      </>
                    )}
                    <strong>{String(e.new_value.score)}</strong>
                    <span>/25</span>
                  </span>
                )}
                {e.event_type === "STATUS_CHANGED" && (
                  <span className="event-change">
                    {e.previous_value?.status !== undefined &&
                      label(String(e.previous_value.status))}{" "}
                    <ArrowRight size={12} />
                    {label(String(e.new_value.status))}
                  </span>
                )}
                <time dateTime={e.occurred_at}>
                  {date(e.occurred_at, true)}
                </time>
              </div>
            </div>
          </Fragment>
        ))}
      </State>
    </div>
  );
}
export function ActivityPage() {
  const { projects } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || 1);
  const query = useData<Page<Audit>>(
    `/activity?${params.toString()}&page_size=50`,
    30000,
  );
  function update(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== "page") next.delete("page");
    setParams(next, { replace: true });
  }
  return (
    <>
      <PageHeader title="Activity">
        <ExcelExport
          title="Signal activity"
          disabled={query.isPending}
          getSheets={async () => {
            const [events, trends] = await Promise.all([
              allPages<Audit>("/activity", params),
              api<Analytics>("/analytics/trends?days=365"),
            ]);
            return [
              ...analyticsSheets(trends),
              ...activitySheets(events),
              {
                name: "Filters",
                columns: ["Filter", "Value"],
                rows: Array.from(params.entries()).filter(
                  ([key]) => key !== "page",
                ),
              },
            ];
          }}
        />
      </PageHeader>
      <HistoryVolume />
      <section className="panel activity-full">
        <div className="issues-toolbar">
          <div className="search-field">
            <Search size={16} />
            <input
              aria-label="Search history"
              placeholder="Search history…"
              value={params.get("search") || ""}
              onChange={(event) => update("search", event.target.value)}
            />
          </div>
          <div className="filter-group">
            <Select
              label="History event type"
              value={params.get("event_type") || ""}
              onValueChange={(value) => update("event_type", value)}
              options={[
                { value: "", label: "All changes" },
                ...Object.entries(eventLabel).map(([value]) => ({
                  value,
                  label: label(value),
                })),
              ]}
            />
            <Select
              label="History project"
              value={params.get("project_id") || ""}
              onValueChange={(value) => update("project_id", value)}
              options={[
                { value: "", label: "All projects" },
                ...projects.map((project) => ({
                  value: project.id,
                  label: project.name,
                })),
              ]}
            />
          </div>
        </div>
        <div className="panel-header">
          <h2>Workspace timeline</h2>
          <span className="chart-unit">
            {query.data?.total.toLocaleString() || "…"} changes
          </span>
        </div>
        <State loading={query.isPending} error={query.error}>
          {query.data && (
            <>
              <ActivityFeed events={query.data.items} />
              <div className="pagination">
                <span>
                  {query.data.total ? (page - 1) * 50 + 1 : 0}–
                  {Math.min(page * 50, query.data.total)} of{" "}
                  {query.data.total.toLocaleString()}
                </span>
                <div>
                  <button
                    className="button secondary"
                    disabled={page === 1}
                    onClick={() => update("page", String(page - 1))}
                  >
                    Previous
                  </button>
                  <span>Page {page}</span>
                  <button
                    className="button secondary"
                    disabled={page * 50 >= query.data.total}
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
export function Projects() {
  const query = useData<ProjectStats[]>("/projects", 30000);
  return (
    <>
      <PageHeader title="Projects">
        <ExcelExport
          title="Signal projects"
          disabled={!query.data}
          getSheets={async () => [
            ...projectSheets(query.data!),
            ...operationsSheets(await api<Operations>("/analytics/operations")),
          ]}
        />
      </PageHeader>
      <State
        loading={query.isPending}
        error={query.error}
        empty={query.data?.length === 0}
      >
        {query.data && <ProjectChart projects={query.data} />}
        <div className="projects-grid">
          {query.data?.map((p, i) => (
            <Link
              className="panel project-card"
              key={p.id}
              to={`/issues?project_id=${p.id}`}
            >
              <div className="project-top">
                <span className={`project-icon project-color-${i}`}>
                  <FolderKanban size={22} />
                </span>
                <code>{p.code}</code>
              </div>
              <h2>{p.name}</h2>
              <div className="project-metrics">
                <div>
                  <strong>{p.active_issues}</strong>
                  <span>Active issues</span>
                </div>
                <div>
                  <strong className={p.critical_risks ? "text-rose" : ""}>
                    {p.critical_risks}
                  </strong>
                  <span>Critical risks</span>
                </div>
              </div>
              <div className="project-progress">
                <span>
                  Mitigation progress<strong>{p.progress}%</strong>
                </span>
                <Progress value={p.progress} />
              </div>
              <div className="project-owner">
                <Person user={p.owner} />
              </div>
            </Link>
          ))}
        </div>
      </State>
    </>
  );
}
export function About() {
  const { users, demo } = useWorkspace();
  return (
    <>
      <PageHeader title="About Signal" />
      <section className="panel about-minimal">
        <div>
          <h2>
            Signal <span className="muted">/ 1.0</span>
          </h2>
          <span className="demo-chip">
            {demo ? "Demo workspace" : "Read-only"}
          </span>
        </div>
        <p>
          Fictional people and records. Demo identity is for attribution, not
          production authentication.
        </p>
      </section>
      <section className="panel">
        <PanelHeader title="Team" />
        <div className="team-grid">
          {users.map((user) => (
            <div className="team-person" key={user.id}>
              <Avatar user={user} />
              <div>
                <strong>{user.full_name}</strong>
                <span>{label(user.role)}</span>
                <small>{user.email}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
