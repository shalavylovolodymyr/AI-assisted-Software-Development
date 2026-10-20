import ExcelJS from "exceljs";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Analytics, Operations } from "../types";
import {
  analyticsSheets,
  buildExcel,
  ExcelExport,
  operationsSheets,
  type ExportSheet,
} from "./excel-export";

describe("Excel exports", () => {
  it("round-trips typed data and keeps user text literal", async () => {
    const assessedAt = new Date("2026-10-20T02:15:30.000Z");
    const sheets: ExportSheet[] = [
      {
        name: "Risk / assessment",
        columns: ["Title", "Score", "Active", "Assessed at", "Average risk"],
        rows: [["=SUM(A1:A5)", 20, true, assessedAt, null]],
      },
    ];
    const bytes = await buildExcel("Risk assessment", sheets);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes.buffer as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    expect(sheet.name).toBe("Risk assessment");
    expect(sheet.getCell("A2").value).toBe("=SUM(A1:A5)");
    expect(sheet.getCell("A2").type).toBe(ExcelJS.ValueType.String);
    expect(sheet.getCell("B2").value).toBe(20);
    expect(sheet.getCell("C2").value).toBe(true);
    expect(sheet.getCell("D2").value).toEqual(assessedAt);
    expect(sheet.getCell("E2").value).toBeNull();
    expect(sheet.views[0]).toMatchObject({ state: "frozen", ySplit: 1 });
    expect(sheet.autoFilter).toBe("A1:E2");
    expect(sheet.getCell("A1").font.name).toBe("Inter");
  });

  it("exports empty results with headers and no invented statistics", async () => {
    const bytes = await buildExcel("No matching issues", [
      { name: "Issues", columns: ["Reference", "Risk"], rows: [] },
    ]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes.buffer as ArrayBuffer);
    expect(workbook.worksheets[0].rowCount).toBe(1);
    expect(workbook.worksheets[0].getCell("B1").value).toBe("Risk");
    const empty = new ExcelJS.Workbook();
    await empty.xlsx.load(
      (await buildExcel("Stats", [])).buffer as ArrayBuffer,
    );
    expect(empty.worksheets).toHaveLength(1);
    expect(empty.worksheets[0].rowCount).toBe(1);
  });

  it("makes long and repeated sheet names valid and distinct", async () => {
    const name = "Risk: overview [a very long name] / repeated";
    const bytes = await buildExcel("Stats", [
      { name, columns: ["Count"], rows: [[4]] },
      { name, columns: ["Count"], rows: [[5]] },
    ]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes.buffer as ArrayBuffer);
    const names = workbook.worksheets.map((sheet) => sheet.name);
    expect(new Set(names).size).toBe(2);
    expect(names.every((sheet) => sheet.length <= 31)).toBe(true);
    expect(names.every((sheet) => !/[\\/*?:[\]]/.test(sheet))).toBe(true);
  });

  it("shows a recoverable inline error without a success confirmation", async () => {
    render(
      <ExcelExport
        title="Statistics"
        getSheets={() =>
          Promise.reject(new Error("Statistics are unavailable"))
        }
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Export to Excel" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Statistics are unavailable",
      ),
    );
    expect(
      screen.getByRole("button", { name: "Export to Excel" }),
    ).toBeEnabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("retains the selected analytics range, zero counts and unavailable averages", async () => {
    const data: Analytics = {
      days: 90,
      generated_at: "2026-10-20T02:00:00Z",
      timeline: [
        {
          date: "2026-10-20",
          created: 0,
          resolved: 2,
          active: 8,
          average_risk: null,
          completed_actions: 3,
          events: 7,
        },
      ],
      metrics: {
        created: 0,
        resolved: 2,
        completed_actions: 3,
        assessments: 0,
        events: 7,
        resolution_days: null,
      },
      categories: [{ category: "OPERATIONS", count: 8 }],
      action_statuses: [{ status: "DONE", count: 3 }],
      total_events: 50,
    };
    const sheets = analyticsSheets(data);
    expect(sheets[0].rows).toContainEqual(["Days", 90]);
    expect(sheets[0].rows).toContainEqual(["Issues created", 0]);
    expect(sheets[0].rows).toContainEqual(["Average resolution (days)", null]);
    expect(sheets[1].rows[0]).toEqual([
      new Date("2026-10-20T00:00:00Z"),
      0,
      2,
      8,
      null,
      3,
      7,
    ]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      (await buildExcel("90 day analytics", sheets)).buffer as ArrayBuffer,
    );
    const history = workbook.getWorksheet("Daily history")!;
    expect(history.getCell("A2").value).toEqual(
      new Date("2026-10-20T00:00:00Z"),
    );
    expect(history.getCell("B2").value).toBe(0);
    expect(history.getCell("E2").value).toBeNull();
    expect(workbook.getWorksheet("Period totals")!.getCell("B2").value).toBe(
      90,
    );
  });

  it("exports operations with nullable timing and complete workload counts", async () => {
    const data: Operations = {
      generated_at: "2026-10-20T02:00:00Z",
      metrics: {
        unplanned_issues: 0,
        stale_reviews: 2,
        awaiting_review: 1,
        on_time_completion: null,
      },
      aging: [{ label: "0–7 days", count: 4 }],
      review_freshness: [],
      risk_movement: [],
      action_outlook: [],
      owners: [
        {
          id: "owner",
          name: "Sam",
          active: 4,
          critical: 1,
          average_risk: 12.5,
          overdue_actions: 2,
        },
      ],
      projects: [],
      overdue_actions: [],
    };
    const sheets = operationsSheets(data);
    expect(sheets[0].rows).toContainEqual(["On-time completion (%)", null]);
    expect(
      sheets.find((sheet) => sheet.name === "Owner workload")?.rows,
    ).toEqual([["Sam", 4, 1, 12.5, 2]]);
    expect(
      sheets.find((sheet) => sheet.name === "Overdue actions")?.rows,
    ).toEqual([]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      (await buildExcel("Operations", sheets)).buffer as ArrayBuffer,
    );
    const owners = workbook.getWorksheet("Owner workload")!;
    expect(owners.getCell("B2").value).toBe(4);
    expect(owners.getCell("D2").value).toBe(12.5);
    expect(workbook.getWorksheet("Overdue actions")!.rowCount).toBe(1);
    expect(
      workbook.getWorksheet("Operational totals")!.getCell("B5").value,
    ).toBeNull();
  });
});
