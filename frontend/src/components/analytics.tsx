import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useData } from "../api";
import type { Analytics, ProjectStats, TrendDay } from "../types";
import { Hint, Select } from "./controls";
import { usePreferences } from "./preferences";
import { label, State } from "./ui";
import {
  chartColors,
  chartTick as tick,
  chartTooltip as tooltip,
  chartTooltipText,
} from "./chart-theme";

const shortDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
    new Date(value + "T12:00:00"),
  );

// Each bar is a real seven-day total. The final partial week is kept.
export function weekly(rows: TrendDay[]) {
  return Array.from({ length: Math.ceil(rows.length / 7) }, (_, index) => {
    const slice = rows.slice(index * 7, index * 7 + 7);
    return {
      date: slice[0].date,
      created: slice.reduce((n, d) => n + d.created, 0),
      resolved: slice.reduce((n, d) => n + d.resolved, 0),
      events: slice.reduce((n, d) => n + d.events, 0),
      completed_actions: slice.reduce((n, d) => n + d.completed_actions, 0),
    };
  });
}

function useChartMotion() {
  const { preferences } = usePreferences();
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return !reduced && preferences.motion !== "reduced";
}

export function DashboardTrends() {
  const animate = useChartMotion();
  const { preferences } = usePreferences();
  const [rangeOverride, setDays] = useState<string | null>(null);
  const days = rangeOverride ?? preferences.chartRange;
  const query = useData<Analytics>(`/analytics/trends?days=${days}`, 30000);
  const data = query.data;
  return (
    <section className="analytics-section" aria-label="Portfolio analytics">
      <div className="analytics-toolbar">
        <div className="analytics-heading">
          <h2>Trends</h2>
          {data && (
            <Hint
              label={`Last fetched ${new Date(query.dataUpdatedAt).toLocaleTimeString()}. ${preferences.liveUpdates ? "Refreshes every 30 seconds." : "Background refresh is off."}`}
            >
              <span className="sync-status" tabIndex={0}>
                <span
                  className={`connected-dot ${query.error ? "offline" : ""}`}
                />
                {query.error
                  ? "Offline"
                  : `Updated ${new Date(query.dataUpdatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`}
              </span>
            </Hint>
          )}
        </div>
        <div className="analytics-tools">
          <Select
            label="Analytics time range"
            value={days}
            onValueChange={setDays}
            options={[30, 90, 180, 365].map((n) => ({
              value: String(n),
              label: `Last ${n} days`,
            }))}
          />
          <Hint label="Refresh analytics">
            <button
              className="icon-button outlined"
              aria-label="Refresh analytics"
              disabled={query.isFetching}
              onClick={() => query.refetch()}
            >
              <RefreshCw size={14} className={query.isFetching ? "spin" : ""} />
            </button>
          </Hint>
        </div>
      </div>
      <State loading={query.isPending} error={!data ? query.error : null}>
        {data && (
          <>
            <div className="period-metrics">
              {[
                ["Created", data.metrics.created],
                ["Resolutions", data.metrics.resolved],
                ["Actions completed", data.metrics.completed_actions],
                [
                  "Avg. resolution",
                  data.metrics.resolution_days === null
                    ? "—"
                    : `${data.metrics.resolution_days}d`,
                ],
              ].map(([name, value]) => (
                <div key={name}>
                  <span>{name}</span>
                  <strong>
                    {typeof value === "number" ? value.toLocaleString() : value}
                  </strong>
                </div>
              ))}
            </div>
            <div className="analytics-grid" key={days}>
              <section
                className="panel chart-panel"
                aria-label="Issue flow chart"
              >
                <div className="panel-header">
                  <h2>Issue flow</h2>
                  <span className="chart-unit">Weekly totals</span>
                </div>
                <div
                  className={`chart-canvas${animate ? " chart-reveal" : ""}`}
                >
                  <ResponsiveContainer width="100%" height={215}>
                    <BarChart
                      data={weekly(data.timeline)}
                      barGap={3}
                      margin={{ left: -24, right: 5, top: 8, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke={chartColors.grid}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={shortDate}
                        tick={tick}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={35}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={tick}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={tooltip}
                        itemStyle={chartTooltipText}
                        labelStyle={chartTooltipText}
                        labelFormatter={(label) =>
                          `Week of ${shortDate(String(label))}`
                        }
                        cursor={{ fill: "var(--surface-2)" }}
                      />
                      <Legend
                        iconType="square"
                        iconSize={7}
                        wrapperStyle={{ fontSize: 10, paddingTop: 12 }}
                      />
                      <Bar
                        isAnimationActive={false}
                        dataKey="created"
                        name="Created"
                        fill={chartColors.gray}
                        maxBarSize={18}
                      />
                      <Bar
                        isAnimationActive={false}
                        dataKey="resolved"
                        name="Resolved"
                        fill={chartColors.ink}
                        maxBarSize={18}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section
                className="panel chart-panel"
                aria-label="Risk trend chart"
              >
                <div className="panel-header">
                  <h2>Risk trend</h2>
                  <Hint label="Average latest risk score across active issues, replayed at the end of each UTC day.">
                    <span className="chart-unit" tabIndex={0}>
                      Avg. / 25
                    </span>
                  </Hint>
                </div>
                <div
                  className={`chart-canvas${animate ? " chart-reveal" : ""}`}
                >
                  <ResponsiveContainer width="100%" height={215}>
                    <AreaChart
                      data={data.timeline}
                      margin={{ left: -28, right: 8, top: 8, bottom: 26 }}
                    >
                      <defs>
                        <linearGradient
                          id="risk-shade"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={chartColors.amber}
                            stopOpacity={0.12}
                          />
                          <stop
                            offset="100%"
                            stopColor={chartColors.amber}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        stroke={chartColors.grid}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={shortDate}
                        tick={tick}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={40}
                      />
                      <YAxis
                        domain={[0, 25]}
                        ticks={[0, 5, 10, 15, 20, 25]}
                        tick={tick}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={tooltip}
                        itemStyle={chartTooltipText}
                        labelStyle={chartTooltipText}
                        labelFormatter={(label) => shortDate(String(label))}
                      />
                      <Area
                        isAnimationActive={false}
                        dataKey="average_risk"
                        name="Average risk"
                        type="monotone"
                        stroke={chartColors.amber}
                        fill="url(#risk-shade)"
                        strokeWidth={1.8}
                        connectNulls={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section
                className="panel chart-panel"
                aria-label="Open workload chart"
              >
                <div className="panel-header">
                  <h2>Open workload</h2>
                  <span className="chart-unit">Active issues · daily</span>
                </div>
                <div
                  className={`chart-canvas${animate ? " chart-reveal" : ""}`}
                >
                  <ResponsiveContainer width="100%" height={190}>
                    <AreaChart
                      data={data.timeline}
                      margin={{ left: -24, right: 8, top: 8, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="workload-shade"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={chartColors.ink}
                            stopOpacity={0.14}
                          />
                          <stop
                            offset="100%"
                            stopColor={chartColors.ink}
                            stopOpacity={0.01}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        stroke={chartColors.grid}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={shortDate}
                        tick={tick}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={40}
                      />
                      <YAxis
                        tick={tick}
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={tooltip}
                        itemStyle={chartTooltipText}
                        labelStyle={chartTooltipText}
                        labelFormatter={(value) => shortDate(String(value))}
                      />
                      <Area
                        isAnimationActive={false}
                        dataKey="active"
                        name="Active issues"
                        type="monotone"
                        stroke={chartColors.ink}
                        fill="url(#workload-shade)"
                        strokeWidth={1.8}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section
                className="panel chart-panel"
                aria-label="Mitigation pace chart"
              >
                <div className="panel-header">
                  <h2>Mitigation pace</h2>
                  <span className="chart-unit">Actions completed · weekly</span>
                </div>
                <div
                  className={`chart-canvas${animate ? " chart-reveal" : ""}`}
                >
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart
                      data={weekly(data.timeline)}
                      margin={{ left: -24, right: 8, top: 8, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke={chartColors.grid}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={shortDate}
                        tick={tick}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={40}
                      />
                      <YAxis
                        tick={tick}
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={tooltip}
                        itemStyle={chartTooltipText}
                        labelStyle={chartTooltipText}
                        labelFormatter={(value) =>
                          `Week of ${shortDate(String(value))}`
                        }
                        cursor={{ fill: "var(--surface-2)" }}
                      />
                      <Bar
                        isAnimationActive={false}
                        dataKey="completed_actions"
                        name="Completed actions"
                        fill={chartColors.amber}
                        maxBarSize={15}
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
            <section
              className="panel category-panel"
              aria-label="Work by category chart"
            >
              <div className="panel-header">
                <h2>Work by category</h2>
                <span className="chart-unit">Current active issues</span>
              </div>
              <div className="category-grid">
                {data.categories.map((item) => {
                  const peak = Math.max(
                    1,
                    ...data.categories.map((row) => row.count),
                  );
                  return (
                    <div className="category-metric" key={item.category}>
                      <span>{label(item.category)}</span>
                      <strong>{item.count}</strong>
                      <div
                        className="category-track"
                        role="meter"
                        aria-label={`${label(item.category)} active issues`}
                        aria-valuenow={item.count}
                        aria-valuemin={0}
                        aria-valuemax={peak}
                      >
                        <span
                          style={{ width: `${(item.count / peak) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </State>
    </section>
  );
}

export function ProjectChart({ projects }: { projects: ProjectStats[] }) {
  const animate = useChartMotion();
  return (
    <section
      className="panel project-chart"
      aria-label="Project workload chart"
    >
      <div className="panel-header">
        <h2>Active issues by project</h2>
      </div>
      <div className={`chart-canvas${animate ? " chart-reveal" : ""}`}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={projects}
            layout="vertical"
            margin={{ left: 0, right: 30, top: 0, bottom: 5 }}
          >
            <CartesianGrid horizontal={false} stroke={chartColors.grid} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={tick}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="code"
              type="category"
              tick={tick}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={tooltip}
              itemStyle={chartTooltipText}
              labelStyle={chartTooltipText}
              labelFormatter={(_, payload) => payload[0]?.payload.name || ""}
              cursor={{ fill: "var(--surface-2)" }}
            />
            <Bar
              isAnimationActive={false}
              dataKey="active_issues"
              name="Active issues"
              fill={chartColors.neutral}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function HistoryVolume() {
  const animate = useChartMotion();
  const query = useData<Analytics>("/analytics/trends?days=365", 30000);
  const data = query.data;
  return (
    <State loading={query.isPending} error={query.error}>
      {data && (
        <section className="activity-analytics" aria-label="Activity analytics">
          <div className="kpi-grid history-kpis">
            <div className="kpi-card">
              <span className="kpi-title">Total changes</span>
              <strong className="kpi-number">
                {data.total_events.toLocaleString()}
              </strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-title">Risk reviews</span>
              <strong className="kpi-number">
                {data.metrics.assessments.toLocaleString()}
              </strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-title">Actions completed</span>
              <strong className="kpi-number">
                {data.metrics.completed_actions.toLocaleString()}
              </strong>
            </div>
          </div>
          <section className="panel history-volume">
            <div className="panel-header">
              <h2>Change volume</h2>
              <span className="chart-unit">Last 365 days</span>
            </div>
            <div className={animate ? "chart-reveal" : ""}>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart
                  data={weekly(data.timeline)}
                  margin={{ left: 0, right: 22, top: 10, bottom: 0 }}
                >
                  <XAxis
                    dataKey="date"
                    tick={tick}
                    tickFormatter={shortDate}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={30}
                  />
                  <Tooltip
                    contentStyle={tooltip}
                    itemStyle={chartTooltipText}
                    labelStyle={chartTooltipText}
                    labelFormatter={(label) =>
                      `Week of ${shortDate(String(label))}`
                    }
                  />
                  <Line
                    isAnimationActive={false}
                    dataKey="events"
                    name="Changes"
                    type="monotone"
                    stroke={chartColors.ink}
                    strokeWidth={1.6}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </section>
      )}
    </State>
  );
}
