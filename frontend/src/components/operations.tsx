import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useData } from "../api";
import type { HealthBucket, Operations } from "../types";
import { Hint } from "./controls";
import { State } from "./ui";
import {
  chartColors,
  chartTick,
  chartTooltip,
  chartTooltipText,
} from "./chart-theme";

function Breakdown({
  rows,
  links,
}: {
  rows: HealthBucket[];
  links?: string[];
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return (
    <div className="health-breakdown">
      {rows.map((row, index) => {
        const content = (
          <>
            <div>
              <span>{row.label}</span>
              <strong>{row.count.toLocaleString()}</strong>
            </div>
            <div
              className="health-track"
              role="meter"
              aria-label={row.label}
              aria-valuenow={row.count}
              aria-valuemin={0}
              aria-valuemax={Math.max(1, total)}
            >
              <span
                style={{ width: `${total ? (row.count / total) * 100 : 0}%` }}
              />
            </div>
          </>
        );
        return links ? (
          <Link className="health-row" to={links[index]} key={row.label}>
            {content}
          </Link>
        ) : (
          <div className="health-row" key={row.label}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

export function OperationalOverview() {
  const query = useData<Operations>("/analytics/operations", 30000);
  const d = query.data;
  return (
    <State loading={query.isPending} error={query.error}>
      {d && (
        <section
          className="operational-overview"
          aria-label="Operational health"
        >
          <div className="period-metrics operational-metrics">
            {[
              [
                "Without a plan",
                d.metrics.unplanned_issues,
                "Active issues with no non-cancelled mitigation actions",
              ],
              [
                "Reviews overdue",
                d.metrics.stale_reviews,
                "Active issues with no assessment or a latest assessment older than 30 days",
              ],
              [
                "Awaiting review",
                d.metrics.awaiting_review,
                "Completed work has not yet had a later risk assessment",
              ],
              [
                "Completed on time",
                d.metrics.on_time_completion === null
                  ? "—"
                  : `${d.metrics.on_time_completion}%`,
                "Completed actions finished on or before their due date, across all recorded history",
              ],
            ].map(([name, value, help]) => (
              <Hint label={String(help)} key={name}>
                <div tabIndex={0}>
                  <span>{name}</span>
                  <strong>{value}</strong>
                </div>
              </Hint>
            ))}
          </div>
          <div className="operations-grid">
            <section className="panel">
              <div className="panel-header">
                <h2>Action outlook</h2>
                <span className="chart-unit">Open work</span>
              </div>
              <Breakdown
                rows={d.action_outlook}
                links={[
                  "/actions?overdue=true",
                  "/actions?due=today",
                  "/actions?due=week",
                  "/actions?due=later",
                ]}
              />
            </section>
            <section className="panel">
              <div className="panel-header">
                <h2>Risk review coverage</h2>
                <span className="chart-unit">Active issues</span>
              </div>
              <Breakdown rows={d.review_freshness} />
            </section>
          </div>
          <section className="panel project-health">
            <div className="panel-header">
              <h2>Project health</h2>
              <Link
                className="icon-button"
                aria-label="View projects"
                to="/projects"
              >
                <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Active</th>
                    <th>Critical</th>
                    <th>Avg. risk</th>
                    <th>Overdue actions</th>
                  </tr>
                </thead>
                <tbody>
                  {d.projects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <Link to={`/issues?project_id=${project.id}`}>
                          <strong>{project.name}</strong>
                          <code>{project.code}</code>
                        </Link>
                      </td>
                      <td>{project.active}</td>
                      <td>
                        <Link
                          to={`/issues?project_id=${project.id}&severity=CRITICAL&active_only=true`}
                        >
                          {project.critical}
                        </Link>
                      </td>
                      <td>
                        <span className="average-risk">
                          {project.average_risk ?? "—"}
                          <small>/25</small>
                        </span>
                      </td>
                      <td>{project.overdue_actions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="panel overdue-work">
            <div className="panel-header">
              <h2>Overdue work</h2>
              <Link
                className="icon-button"
                aria-label="All overdue actions"
                to="/actions?overdue=true"
              >
                <ArrowUpRight size={17} />
              </Link>
            </div>
            {d.overdue_actions.length ? (
              d.overdue_actions.slice(0, 5).map((action) => (
                <Link
                  className="overdue-work-row"
                  to={`/issues/${action.issue_id}`}
                  key={action.id}
                >
                  <div>
                    <strong>{action.title}</strong>
                    <span>
                      <code>{action.reference}</code> · {action.owner}
                    </span>
                  </div>
                  <span className="badge high">
                    {action.days_overdue}d overdue
                  </span>
                </Link>
              ))
            ) : (
              <p className="quiet-empty">All caught up</p>
            )}
          </section>
        </section>
      )}
    </State>
  );
}

function BucketChart({
  title,
  rows,
  color = chartColors.neutral,
}: {
  title: string;
  rows: HealthBucket[];
  color?: string;
}) {
  return (
    <section className="panel chart-panel" aria-label={`${title} chart`}>
      <div className="panel-header">
        <h2>{title}</h2>
        <span className="chart-unit">Current active issues</span>
      </div>
      <div className="chart-canvas">
        <ResponsiveContainer width="100%" height={230}>
          <BarChart
            data={rows}
            margin={{ top: 20, right: 18, left: -18, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke={chartColors.grid} />
            <XAxis
              dataKey="label"
              tick={{ ...chartTick, fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={chartTick}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={chartTooltip}
              itemStyle={chartTooltipText}
              labelStyle={chartTooltipText}
              cursor={{ fill: "var(--surface-2)" }}
            />
            <Bar
              isAnimationActive={false}
              dataKey="count"
              name="Issues"
              fill={color}
              maxBarSize={40}
              radius={[5, 5, 0, 0]}
            >
              {rows.map((row) => (
                <Cell
                  key={row.label}
                  fill={
                    row.label === "Increased"
                      ? chartColors.amber
                      : row.label === "Reduced"
                        ? "var(--accent)"
                        : color
                  }
                />
              ))}
              <LabelList
                dataKey="count"
                position="top"
                fill="var(--muted)"
                fontSize={10}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function OperationsCharts() {
  const query = useData<Operations>("/analytics/operations", 30000);
  const d = query.data;
  return (
    <State loading={query.isPending} error={query.error}>
      {d && (
        <section
          aria-label="Portfolio breakdowns"
          className="portfolio-breakdowns"
        >
          <div className="section-heading">
            <h2>Current portfolio</h2>
          </div>
          <div className="operations-chart-grid">
            <BucketChart title="Issue age" rows={d.aging} />
            <BucketChart title="Risk movement" rows={d.risk_movement} />
            <section
              className="panel chart-panel owner-workload"
              aria-label="Owner workload chart"
            >
              <div className="panel-header">
                <h2>Owner workload</h2>
                <span className="chart-unit">
                  Active issues · critical highlighted
                </span>
              </div>
              <div className="chart-canvas">
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(220, d.owners.length * 35)}
                >
                  <BarChart
                    layout="vertical"
                    data={d.owners.map((owner) => ({
                      ...owner,
                      other: owner.active - owner.critical,
                    }))}
                    margin={{ top: 8, right: 25, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke={chartColors.grid}
                    />
                    <XAxis
                      type="number"
                      tick={chartTick}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={105}
                      tick={chartTick}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={chartTooltip}
                      itemStyle={chartTooltipText}
                      labelStyle={chartTooltipText}
                      cursor={{ fill: "var(--surface-2)" }}
                    />
                    <Bar
                      isAnimationActive={false}
                      dataKey="other"
                      name="Other active"
                      stackId="work"
                      fill={chartColors.neutral}
                      barSize={13}
                    />
                    <Bar
                      isAnimationActive={false}
                      dataKey="critical"
                      name="Critical"
                      stackId="work"
                      fill={chartColors.amber}
                      barSize={13}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </section>
      )}
    </State>
  );
}
