import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import type {
  Action,
  Analytics,
  Audit,
  Issue,
  Operations,
  ProjectStats,
  Summary,
} from "../types";

export interface ExportSheet {
  name: string;
  columns: string[];
  rows: (string | number | boolean | Date | null)[][];
}

const human = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());

function excelDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function sheetName(value: string, used: Set<string>): string {
  const base =
    value
      .replace(/[\\/*?:[\]]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^'+|'+$/g, "")
      .trim() || "Data";
  let name = base.slice(0, 31);
  let suffix = 1;
  while (used.has(name.toLowerCase())) {
    suffix += 1;
    const ending = ` (${suffix})`;
    name = `${base.slice(0, 31 - ending.length)}${ending}`;
  }
  used.add(name.toLowerCase());
  return name;
}

/** Excel strings stay strings, including values beginning with =, +, - or @. */
export async function buildExcel(
  title: string,
  sheets: ExportSheet[],
): Promise<Uint8Array> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Signal";
  workbook.title = title;
  workbook.subject = "Workspace statistics";
  workbook.created = new Date();
  const used = new Set<string>();
  const source = sheets.length
    ? sheets
    : [{ name: "Data", columns: ["No data"], rows: [] }];
  for (const data of source) {
    const sheet = workbook.addWorksheet(sheetName(data.name, used), {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    const headers = data.columns.length ? data.columns : ["Data"];
    sheet.addRow(headers);
    for (const values of data.rows) {
      const row = sheet.addRow(
        headers.map((_, index) => {
          const value = values[index] ?? null;
          return typeof value === "number" && !Number.isFinite(value)
            ? null
            : value;
        }),
      );
      row.eachCell((cell) => {
        cell.font = { name: "Inter", size: 10, color: { argb: "FF34373C" } };
        cell.alignment = { vertical: "top" };
        if (cell.value instanceof Date)
          cell.numFmt =
            cell.value.getUTCHours() === 0 &&
            cell.value.getUTCMinutes() === 0 &&
            cell.value.getUTCSeconds() === 0
              ? "yyyy-mm-dd"
              : "yyyy-mm-dd hh:mm:ss";
      });
    }
    const header = sheet.getRow(1);
    header.height = 26;
    header.eachCell((cell) => {
      cell.font = {
        name: "Inter",
        size: 10,
        bold: true,
        color: { argb: "FF34373C" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F3F5" },
      };
      cell.alignment = { vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFDDE1E6" } },
      };
    });
    sheet.columns.forEach((column, index) => {
      const width = data.rows.reduce(
        (maximum, row) => {
          const value = row[index];
          const length =
            value instanceof Date ? 21 : String(value ?? "").length;
          return Math.max(maximum, length + 2);
        },
        Math.max(14, headers[index].length + 3),
      );
      column.width = Math.min(54, width);
    });
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, sheet.rowCount), column: headers.length },
    };
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

export function ExcelExport({
  title,
  getSheets,
  disabled = false,
}: {
  title: string;
  getSheets: () => ExportSheet[] | Promise<ExportSheet[]>;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function download() {
    setBusy(true);
    setError(null);
    try {
      const bytes = await buildExcel(title, await getSheets());
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(bytes)], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      const name =
        title
          .trim()
          .toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, "-")
          .replace(/^-|-$/g, "") || "signal-stats";
      link.download = `${name}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to export statistics",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="export-control">
      <button
        className="button secondary export-button"
        aria-label="Export to Excel"
        aria-busy={busy}
        disabled={disabled || busy}
        onClick={download}
      >
        {busy ? (
          <LoaderCircle size={16} className="spin" aria-hidden="true" />
        ) : (
          <Download size={16} aria-hidden="true" />
        )}
        {busy ? "Exporting…" : "Export"}
      </button>
      {error && (
        <span className="inline-error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}

export function analyticsSheets(data: Analytics): ExportSheet[] {
  return [
    {
      name: "Period totals",
      columns: ["Metric", "Value"],
      rows: [
        ["Days", data.days],
        ["Issues created", data.metrics.created],
        ["Issues resolved", data.metrics.resolved],
        ["Actions completed", data.metrics.completed_actions],
        ["Risk assessments", data.metrics.assessments],
        ["Events in period", data.metrics.events],
        ["Average resolution (days)", data.metrics.resolution_days],
        ["All recorded events", data.total_events],
        ["Generated at", excelDate(data.generated_at)],
      ],
    },
    {
      name: "Daily history",
      columns: [
        "Date",
        "Created",
        "Resolved",
        "Active",
        "Average risk",
        "Actions completed",
        "Events",
      ],
      rows: data.timeline.map((day) => [
        excelDate(day.date),
        day.created,
        day.resolved,
        day.active,
        day.average_risk,
        day.completed_actions,
        day.events,
      ]),
    },
    {
      name: "Categories",
      columns: ["Category", "Issues"],
      rows: data.categories.map((row) => [human(row.category), row.count]),
    },
    {
      name: "Action statuses",
      columns: ["Status", "Actions"],
      rows: data.action_statuses.map((row) => [human(row.status), row.count]),
    },
  ];
}

export function operationsSheets(data: Operations): ExportSheet[] {
  const distribution = (
    name: string,
    rows: { label: string; count: number }[],
  ): ExportSheet => ({
    name,
    columns: ["Group", "Count"],
    rows: rows.map((row) => [row.label, row.count]),
  });
  return [
    {
      name: "Operational totals",
      columns: ["Metric", "Value"],
      rows: [
        ["Issues without a plan", data.metrics.unplanned_issues],
        ["Stale risk reviews", data.metrics.stale_reviews],
        ["Awaiting review", data.metrics.awaiting_review],
        ["On-time completion (%)", data.metrics.on_time_completion],
        ["Generated at", excelDate(data.generated_at)],
      ],
    },
    distribution("Issue age", data.aging),
    distribution("Review freshness", data.review_freshness),
    distribution("Risk movement", data.risk_movement),
    distribution("Action outlook", data.action_outlook),
    {
      name: "Owner workload",
      columns: [
        "Owner",
        "Active issues",
        "Critical",
        "Average risk",
        "Overdue actions",
      ],
      rows: data.owners.map((owner) => [
        owner.name,
        owner.active,
        owner.critical,
        owner.average_risk,
        owner.overdue_actions,
      ]),
    },
    {
      name: "Project health",
      columns: [
        "Code",
        "Project",
        "Active issues",
        "Critical",
        "Average risk",
        "Overdue actions",
      ],
      rows: data.projects.map((project) => [
        project.code,
        project.name,
        project.active,
        project.critical,
        project.average_risk,
        project.overdue_actions,
      ]),
    },
    {
      name: "Overdue actions",
      columns: ["Issue", "Action", "Owner", "Due date", "Days overdue"],
      rows: data.overdue_actions.map((action) => [
        action.reference,
        action.title,
        action.owner,
        excelDate(action.due_date),
        action.days_overdue,
      ]),
    },
  ];
}

export function summarySheets(data: Summary): ExportSheet[] {
  return [
    {
      name: "Overview",
      columns: ["Metric", "Value"],
      rows: [
        ["Total issues", data.total_issues],
        ["Active issues", data.active_issues],
        ["Critical risks", data.critical_risks],
        ["Overdue actions", data.overdue_actions],
        ["Resolved issues", data.resolved_issues],
        ["Actions completed", data.mitigation.done],
        ["Total actions", data.mitigation.total],
        ["Mitigation progress (%)", data.mitigation.progress],
        ["Generated at", excelDate(data.generated_at)],
      ],
    },
    {
      name: "Risk distribution",
      columns: ["Severity", "Issues"],
      rows: data.distribution.map((row) => [human(row.severity), row.count]),
    },
    {
      name: "Issue statuses",
      columns: ["Status", "Issues"],
      rows: data.statuses.map((row) => [human(row.status), row.count]),
    },
    {
      name: "Risk matrix",
      columns: ["Likelihood", "Impact", "Score", "Severity", "Issues"],
      rows: data.matrix.map((cell) => [
        cell.likelihood,
        cell.impact,
        cell.score,
        human(cell.severity),
        cell.count,
      ]),
    },
    ...projectSheets(data.projects),
  ];
}

export function issueSheets(data: Issue[]): ExportSheet[] {
  return [
    {
      name: "Issues",
      columns: [
        "Reference",
        "Title",
        "Description",
        "Project code",
        "Project",
        "Assignee",
        "Reporter",
        "Category",
        "Priority",
        "Status",
        "Likelihood",
        "Impact",
        "Risk score",
        "Severity",
        "Due date",
        "Created at",
        "Updated at",
        "Resolved at",
      ],
      rows: data.map((issue) => [
        issue.reference_code,
        issue.title,
        issue.description,
        issue.project.code,
        issue.project.name,
        issue.assignee.full_name,
        issue.reporter.full_name,
        human(issue.category),
        human(issue.priority),
        human(issue.status),
        issue.risk?.likelihood ?? null,
        issue.risk?.impact ?? null,
        issue.risk?.score ?? null,
        issue.risk ? human(issue.risk.severity) : null,
        excelDate(issue.due_date),
        excelDate(issue.created_at),
        excelDate(issue.updated_at),
        excelDate(issue.resolved_at),
      ]),
    },
  ];
}

export function actionSheets(data: Action[]): ExportSheet[] {
  return [
    {
      name: "Actions",
      columns: [
        "Issue",
        "Issue title",
        "Title",
        "Description",
        "Owner",
        "Status",
        "Due date",
        "Completed at",
        "Created at",
        "Overdue",
      ],
      rows: data.map((action) => [
        action.issue_reference,
        action.issue_title,
        action.title,
        action.description,
        action.owner.full_name,
        human(action.status),
        excelDate(action.due_date),
        excelDate(action.completed_at),
        excelDate(action.created_at),
        action.overdue,
      ]),
    },
  ];
}

export function activitySheets(data: Audit[]): ExportSheet[] {
  return [
    {
      name: "Activity",
      columns: [
        "Occurred at",
        "Actor",
        "Issue",
        "Issue title",
        "Event",
        "Previous value",
        "New value",
      ],
      rows: data.map((event) => [
        excelDate(event.occurred_at),
        event.actor.full_name,
        event.issue_reference,
        event.issue_title,
        human(event.event_type),
        event.previous_value === null
          ? null
          : JSON.stringify(event.previous_value),
        JSON.stringify(event.new_value),
      ]),
    },
  ];
}

export function projectSheets(data: ProjectStats[]): ExportSheet[] {
  return [
    {
      name: "Projects",
      columns: [
        "Code",
        "Project",
        "Description",
        "Owner",
        "Status",
        "Active issues",
        "Critical risks",
        "Mitigation progress (%)",
        "Created at",
      ],
      rows: data.map((project) => [
        project.code,
        project.name,
        project.description,
        project.owner.full_name,
        human(project.status),
        project.active_issues,
        project.critical_risks,
        project.progress,
        excelDate(project.created_at),
      ]),
    },
  ];
}
