import { expect, test, type Locator, type Page } from "@playwright/test";
import ExcelJS from "exceljs";
import type {
  Action,
  Analytics,
  Audit,
  Detail,
  Issue,
  Operations,
  Page as DataPage,
  ProjectStats,
  Summary,
  User,
} from "../src/types";

// Existing workflow cases start inside an explicit demo session. Entry/logout
// behavior is exercised through the real welcome UI in welcome.spec.ts.
test.beforeEach(async ({ page, request }) => {
  const users: User[] = await (await request.get("/api/v1/users")).json();
  const admin = users.find((user) => user.role === "ADMIN")!;
  await page.addInitScript((id) => {
    if (!localStorage.getItem("signal-session-user"))
      localStorage.setItem("signal-session-user", id);
  }, admin.id);
});

async function exportWorkbook(page: Page) {
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export to Excel", exact: true })
    .click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  expect(await download.failure()).toBeNull();
  const path = await download.path();
  expect(path).not.toBeNull();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path!);
  await expect(page.locator(".toast")).toHaveCount(0);
  return workbook;
}
function metricValue(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  name: string,
) {
  const sheet = workbook.getWorksheet(sheetName);
  expect(sheet, `Missing workbook sheet: ${sheetName}`).toBeDefined();
  let found: ExcelJS.CellValue | undefined;
  sheet!.eachRow((row) => {
    if (row.getCell(1).value === name) found = row.getCell(2).value;
  });
  expect(found, `Missing exported metric: ${name}`).not.toBeUndefined();
  return found;
}

async function choose(
  page: Page,
  label: string,
  option: string,
  scope: Page | Locator = page,
) {
  const returnUrl = page.url();
  const settings =
    label === "Appearance" && new URL(returnUrl).pathname !== "/settings";
  if (settings) {
    if ((page.viewportSize()?.width || 0) <= 760)
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
    await page
      .getByRole("navigation", { name: "Workspace", exact: true })
      .getByRole("link", { name: "Settings", exact: true })
      .click();
  }
  const mobileIdentity =
    label === "Demo user" && (page.viewportSize()?.width || 0) <= 760;
  if (mobileIdentity)
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
  const trigger = scope.getByRole("combobox", { name: label, exact: true });
  if ((await trigger.innerText()).trim() !== option) {
    await trigger.click();
    await page.getByRole("option", { name: option, exact: true }).click();
    if (label === "Appearance" || label === "Demo user")
      await expect(trigger).toBeFocused();
  }
  if (mobileIdentity)
    await page
      .locator(".sidebar-shortcuts")
      .getByRole("button", { name: "Close navigation", exact: true })
      .click();
  if (label === "Appearance")
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("signal-appearance")),
      )
      .toBe(option.toLowerCase());
  if (settings) {
    await page.goBack();
    await expect(page).toHaveURL(returnUrl);
  }
}

async function expectSidebarListSpacing(page: Page) {
  const rows = page.locator(
    ".sidebar-shortcuts button:visible, .sidebar nav a:visible",
  );
  await expect(rows).toHaveCount(11);
  await expect
    .poll(() =>
      rows.evaluateAll((elements) => {
        const boxes = elements.map((element) =>
          element.getBoundingClientRect(),
        );
        return boxes.every(
          (box, index) =>
            Math.abs(box.height - 40) < 1 &&
            (index === 0 || Math.abs(box.y - boxes[index - 1].bottom - 4) < 1),
        );
      }),
    )
    .toBe(true);
  const icons = await rows.locator("svg").evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return box.x + box.width / 2;
    }),
  );
  expect(Math.max(...icons) - Math.min(...icons)).toBeLessThan(1);
}

async function createIssue(page: Page, suffix: string) {
  await page.goto("/issues");
  await choose(page, "Demo user", "Emma Wilson");
  await page.getByRole("button", { name: "Create issue", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const title = `E2E ${suffix} ${Date.now()}`;
  await dialog.getByLabel("Issue title").fill(title);
  await dialog
    .getByLabel("Description", { exact: true })
    .fill("Access rights exceed the approved operational scope.");
  await choose(page, "Project", "Digital Operations", dialog);
  await choose(page, "Likelihood", "5 · Almost certain", dialog);
  await choose(page, "Impact", "4 · Major", dialog);
  await dialog
    .getByLabel("Risk rationale")
    .fill("High likelihood and major impact require corrective action.");
  await dialog
    .getByRole("button", { name: "Create issue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".toast")).toHaveCount(0);
  return title;
}

async function transition(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("button", { name: "Confirm transition" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

async function planAction(page: Page) {
  await page.getByRole("button", { name: "Add action", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Action title").fill("Restrict excess access");
  await dialog
    .getByLabel("Description", { exact: true })
    .fill("Review and revoke unnecessary permissions.");
  await choose(page, "Action owner", "Emma Wilson", dialog);
  await dialog.getByRole("button", { name: "Due date", exact: true }).click();
  await expect(page.locator('.calendar-day[tabindex="0"]')).toBeFocused();
  await page.locator('[data-date="2026-10-29"]').click();
  await dialog.getByRole("button", { name: "Add action", exact: true }).click();
  await expect(dialog).toBeHidden();
}

async function reassess(page: Page) {
  await page.getByRole("button", { name: "Assess risk", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await choose(page, "Likelihood", "2 · Unlikely", dialog);
  await choose(page, "Impact", "2 · Minor", dialog);
  await dialog
    .getByLabel("Rationale", { exact: true })
    .fill(
      "Permissions corrected; independent verification confirms reduced exposure.",
    );
  await dialog.getByRole("button", { name: "Record assessment" }).click();
  await expect(dialog).toBeHidden();
}

test("E2E-001: create, persist, edit and find an issue", async ({ page }) => {
  const title = await createIssue(page, "create");
  await expect(page.locator(".big-risk")).toContainText("20");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit issue", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Issue title")
    .fill(title + " reviewed");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: title + " reviewed", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Add a comment").fill("Evidence owner confirmed.");
  await page.getByRole("button", { name: "Add comment", exact: true }).click();
  await expect(
    page.getByText("Evidence owner confirmed.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".toast")).toHaveCount(0);
  await page.getByRole("link", { name: "All issues", exact: true }).click();
  await page.getByLabel("Search issues", { exact: true }).fill(title);
  await expect(
    page.getByRole("link", { name: new RegExp(title + " reviewed") }),
  ).toBeVisible();
});

test("E2E-002: reassess and update the actual risk matrix", async ({
  page,
}) => {
  const title = await createIssue(page, "risk");
  await reassess(page);
  await expect(page.locator(".big-risk")).toContainText("4");
  await expect(page.locator(".history-item")).toHaveCount(2);
  await page.goto("/risk-matrix?likelihood=2&impact=2");
  await expect(page.getByRole("link").filter({ hasText: title })).toBeVisible();
  await page.getByRole("button", { name: /Likelihood 5, impact 4:/ }).click();
  await expect(page.getByRole("link").filter({ hasText: title })).toHaveCount(
    0,
  );
});

test("E2E-003: complete mitigation, reassess, resolve and reopen", async ({
  page,
}) => {
  await createIssue(page, "resolution");
  await transition(page, "Start work");
  await planAction(page);
  await choose(page, "Update Restrict excess access", "Done");
  await page.getByRole("button", { name: "Confirm change" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await transition(page, "Mark mitigated");
  await reassess(page);
  await transition(page, "Resolve issue");
  await expect(
    page.getByRole("heading", { name: "Resolution verified." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Resolution verified." }),
  ).toBeVisible();
  await transition(page, "Reopen issue");
  await page.getByRole("tab", { name: /Activity/ }).click();
  await expect(page.getByText("reopened an issue")).toBeVisible();
});

test("E2E-004: block closure with incomplete work and stale assessment", async ({
  page,
}) => {
  await createIssue(page, "invalid-resolution");
  await transition(page, "Start work");
  await planAction(page);
  await page
    .getByRole("button", { name: "Mark mitigated", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm transition" }).click();
  await expect(page.getByRole("alert")).toContainText("incomplete");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await choose(page, "Update Restrict excess access", "Done");
  await page.getByRole("button", { name: "Confirm change" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await transition(page, "Mark mitigated");
  await page
    .getByRole("button", { name: "Resolve issue", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm transition" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "reassessment after the final action completion",
  );
});

test("Responsive navigation, matrix keyboard operation and page integrity", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Risk matrix", exact: true }).click();
  const cell = page.getByRole("button", { name: /Likelihood 5, impact 5:/ });
  await cell.focus();
  await page.keyboard.press("Enter");
  await expect(cell).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("heading", { name: "Likelihood 5 × Impact 5" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect
    .poll(() =>
      page
        .locator(".sidebar")
        .evaluate((el) => el.getBoundingClientRect().right),
    )
    .toBeLessThanOrEqual(0);
  await page.screenshot({
    path: "test-results/mobile-matrix.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Risk exposure" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Action outlook", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/overview.png", fullPage: true });
  await page.goto("/risk-matrix?likelihood=5&impact=4");
  await expect(
    page.getByRole("heading", { name: "Risk matrix", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/risk-matrix.png",
    fullPage: true,
  });
  await page.goto("/projects");
  await expect(
    page.getByRole("link").filter({ hasText: "Infrastructure Modernization" }),
  ).toBeVisible();
  await page.goto("/activity");
  await expect(
    page.getByRole("heading", { name: "Workspace timeline" }),
  ).toBeVisible();
  await page.goto("/actions");
  await expect(
    page.getByRole("heading", { name: "Action register" }),
  ).toBeVisible();
  for (const theme of ["Light", "Dark"]) {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/settings");
    await choose(page, "Appearance", theme);
    for (const route of ["issues", "actions", "activity"]) {
      await page.goto(`/${route}`);
      const pagination = page.locator(".pagination");
      const previous = pagination.getByRole("button", {
        name: "Previous",
        exact: true,
      });
      const next = pagination.getByRole("button", {
        name: "Next",
        exact: true,
      });
      await expect(previous).toBeDisabled();
      await expect(next).toBeEnabled();
      await pagination.scrollIntoViewIfNeeded();
      for (const width of route === "issues" ? [375, 320] : [375]) {
        await page.setViewportSize({ width, height: 812 });
        await expect(previous).toHaveCSS("height", "40px");
        await expect(next).toHaveCSS("height", "40px");
        await expect(previous).toHaveCSS("font-size", "12px");
        const first = await previous.boundingBox();
        const last = await next.boundingBox();
        expect(Math.abs(first!.width - last!.width)).toBeLessThan(1);
        expect(first!.width).toBeGreaterThanOrEqual(80);
        expect(first!.x).toBeGreaterThanOrEqual(18);
        expect(last!.x + last!.width).toBeLessThanOrEqual(width - 18);
        const summary = await pagination.locator(":scope > span").boundingBox();
        expect(first!.y - summary!.y - summary!.height).toBeGreaterThanOrEqual(
          11,
        );
        if (route === "issues")
          await pagination.screenshot({
            path: `../docs/screenshots/mobile-pagination-${theme.toLowerCase()}-${width}.png`,
          });
      }
      await next.click();
      await expect(
        pagination.getByText("Page 2", { exact: true }),
      ).toBeVisible();
      await expect(previous).toBeEnabled();
      await previous.click();
      await expect(
        pagination.getByText("Page 1", { exact: true }),
      ).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});

test("Custom controls support keyboard use and explicit light mode", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/issues");
  await expect(
    page.getByRole("heading", { name: "Issues", exact: true }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await choose(page, "Appearance", "Light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".panel").first()).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  const status = page.getByRole("combobox", {
    name: "Filter status",
    exact: true,
  });
  await status.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("i");
  await expect(
    page.getByRole("option", { name: "In progress", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(status).toContainText("In progress");
  await expect(page).toHaveURL(/status=IN_PROGRESS/);
  await page.getByRole("checkbox", { name: "Active only" }).click();
  await expect(
    page.getByRole("checkbox", { name: "Active only" }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Create issue", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Due date", exact: true }).click();
  await expect(page.locator('.calendar-day[tabindex="0"]')).toBeFocused();
  await expect(page.getByRole("grid", { name: "Calendar" })).toBeVisible();
  await page.getByRole("button", { name: "Next month", exact: true }).click();
  await page
    .getByRole("button", { name: "Previous month", exact: true })
    .click();
  const day = page.locator('[data-date="2026-10-29"]');
  await day.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator('[data-date="2026-10-28"]')).toBeFocused();
  await page.keyboard.press("PageDown");
  await expect(page.locator('[data-date="2026-11-28"]')).toBeFocused();
  await page.keyboard.press("PageUp");
  await expect(page.locator('[data-date="2026-10-28"]')).toBeFocused();
  await page.screenshot({
    path: "test-results/custom-calendar.png",
    fullPage: false,
  });
  await page.keyboard.press("Enter");
  await expect(
    dialog.getByRole("button", { name: "Due date", exact: true }),
  ).toContainText("28");
  await dialog.getByRole("button", { name: "Due date", exact: true }).click();
  await expect(page.locator('.calendar-day[tabindex="0"]')).toBeFocused();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Due date", exact: true }),
  ).toContainText("Select date");
  await expect(
    dialog.getByRole("button", { name: "Due date", exact: true }),
  ).toBeFocused();
  await dialog.getByRole("button", { name: "Due date", exact: true }).click();
  await expect(page.locator('.calendar-day[tabindex="0"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("grid", { name: "Calendar" })).toBeHidden();
  await expect(
    dialog.getByRole("button", { name: "Due date", exact: true }),
  ).toBeFocused();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("combobox", { name: "Priority", exact: true }).click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(
    page.getByRole("option", { name: "High", exact: true }),
  ).toBeFocused();
  await page.screenshot({
    path: "test-results/custom-dropdown.png",
    // Full-page capture resizes the viewport; selects close on resize by design.
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  expect(
    await page
      .locator(
        "select:visible, input[type=date]:visible, input[type=checkbox]:visible",
      )
      .count(),
  ).toBe(0);
  const fonts = await page
    .locator("body")
    .evaluate((el) =>
      [...el.querySelectorAll("button, input, code, kbd, h1, h2")].map(
        (node) => getComputedStyle(node).fontFamily,
      ),
    );
  expect(fonts.every((font) => font.includes("Inter"))).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/actions");
  await choose(page, "Filter action owner", "Emma Wilson");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "New issue", exact: true }).click();
  const mobileDialog = page.getByRole("dialog");
  await mobileDialog
    .getByRole("button", { name: "Due date", exact: true })
    .click();
  const calendar = page.locator(".calendar-popover");
  await expect(calendar).toBeVisible();
  expect(
    await calendar.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= window.innerWidth;
    }),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-calendar.png",
    fullPage: false,
  });
});

test("Rich matrix, recorded trends, searchable history and refined UI", async ({
  page,
}) => {
  await page.goto("/charts");
  await expect(
    page.getByRole("heading", { name: "Issue flow", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByRole("heading", { name: "Risk trend", exact: true }),
  ).toBeVisible();
  const response = page.waitForResponse(
    (response) =>
      response.url().includes("/analytics/trends?days=180") &&
      response.status() === 200,
  );
  await choose(page, "Analytics time range", "Last 180 days");
  const trend = await (await response).json();
  expect(trend.timeline).toHaveLength(180);
  expect(trend.total_events).toBeGreaterThan(2500);
  await expect(
    page.getByRole("button", { name: "Refresh analytics" }),
  ).toBeEnabled();
  const refreshed = page.waitForResponse(
    (response) =>
      response.url().includes("/analytics/trends?days=180") &&
      response.status() === 200,
  );
  await page.getByRole("button", { name: "Refresh analytics" }).click();
  await refreshed;
  const header = page.locator(".topbar");
  await expect(header).toHaveCSS("position", "fixed");
  await expect(header).toHaveCSS("border-radius", "0px");
  expect(
    await header.evaluate((el) => getComputedStyle(el).backdropFilter),
  ).toBe("none");
  await expect(page.locator(".period-metrics > div").first()).toHaveCSS(
    "border-radius",
    "16px",
  );
  await expect(
    page.locator('[aria-label="Risk trend chart"] .recharts-area-curve'),
  ).toHaveAttribute("stroke", "var(--chart-amber)");
  await page.mouse.wheel(0, 500);
  await expect
    .poll(() =>
      header.evaluate((el) => Math.round(el.getBoundingClientRect().top)),
    )
    .toBe(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(
    await page
      .locator("html")
      .evaluate((el) => getComputedStyle(el).scrollbarWidth),
  ).toBe("none");
  await page.screenshot({ path: "test-results/analytics.png", fullPage: true });
  await page.goto("/risk-matrix");
  const matrix = await page.request.get("/api/v1/analytics/risk-matrix");
  const cells = await matrix.json();
  expect(cells).toHaveLength(25);
  expect(cells.every((cell: { count: number }) => cell.count >= 3)).toBe(true);
  for (const cell of cells) {
    await page
      .getByRole("button", {
        name: new RegExp(
          `Likelihood ${cell.likelihood}, impact ${cell.impact}:`,
        ),
      })
      .click();
    await expect(page.locator(".matrix-issue").first()).toBeVisible();
  }
  await page.goto("/activity");
  await expect(
    page.getByRole("heading", { name: "Change volume" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  await choose(page, "History event type", "Risk assessed");
  await expect(page.getByText("Page 1", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Search history" }).fill("SIG-1001");
  await expect(page.locator(".activity-full .activity-item")).toHaveCount(6);
  await expect(
    page.locator(".activity-full .activity-item").first(),
  ).toContainText("SIG-1001");
  await page.screenshot({ path: "test-results/history.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Action outlook", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 600);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(before);
  await expect
    .poll(() =>
      header.evaluate((el) => Math.round(el.getBoundingClientRect().top)),
    )
    .toBe(0);
  await page.screenshot({
    path: "test-results/mobile-overview.png",
    fullPage: true,
  });
});

test("Appearance follows the system, persists, and role homes stay focused", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await choose(page, "Appearance", "Light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await choose(page, "Appearance", "System");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await choose(page, "Appearance", "Dark");
  await expect(page.locator(".panel").first()).toHaveCSS(
    "background-color",
    "rgb(33, 33, 33)",
  );
  await expect(
    page.getByRole("heading", { name: "Action outlook", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dark-overview.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: "Create issue", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveCSS("background-color", "rgb(33, 33, 33)");
  await expect(dialog.locator("textarea").first()).toHaveCSS("resize", "none");
  await dialog.getByRole("combobox", { name: "Priority", exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCSS(
    "background-color",
    "rgb(33, 33, 33)",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Due date", exact: true }).click();
  await expect(page.locator(".calendar-popover")).toHaveCSS(
    "background-color",
    "rgb(33, 33, 33)",
  );
  await page.screenshot({
    path: "test-results/dark-controls.png",
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await choose(page, "Appearance", "Light");
  await choose(page, "Demo user", "Daniel Reed");
  await expect(
    page.getByRole("heading", { name: "Team focus", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Customer Experience", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".issue-table tbody tr")).toHaveCount(6);
  await expect(page.locator(".action-table tbody tr")).toHaveCount(6);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Customer Experience", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".issue-table tbody tr")).toHaveCount(6);
  await page.screenshot({
    path: "test-results/manager-home.png",
    fullPage: true,
  });
  await choose(page, "Demo user", "Oliver Brooks");
  await expect(
    page.getByRole("heading", { name: "My work", exact: true }),
  ).toBeVisible();
  const people = await (await page.request.get("/api/v1/users")).json();
  const oliver = people.find(
    (person: { full_name: string }) => person.full_name === "Oliver Brooks",
  );
  const assigned = await (
    await page.request.get(
      `/api/v1/issues?active_only=true&assignee_id=${oliver.id}&sort=risk_score&page_size=6`,
    )
  ).json();
  await expect(page.locator(".issue-table tbody tr")).toHaveCount(
    assigned.items.length,
  );
  for (const issue of assigned.items)
    await expect(page.locator(".issue-table")).toContainText(issue.title);
  await expect(page.locator(".action-table tbody tr")).toHaveCount(6);
  await page.screenshot({
    path: "test-results/member-home.png",
    fullPage: true,
  });
  await choose(page, "Demo user", "Emma Wilson");
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  expect(await page.locator(".kpi-number > svg").count()).toBe(0);
  expect(await page.locator(".nav-separator").count()).toBe(0);
  await page.getByRole("button", { name: "Create issue", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close dialog" })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await choose(page, "Appearance", "Dark");
  await expect(
    page.getByRole("heading", { name: "Action outlook", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Analytics time range" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-dark.png",
    fullPage: false,
  });
});

test("Year charts, sidebar visibility and hover contrast stay consistent", async ({
  page,
}) => {
  const response = page.waitForResponse(
    (response) =>
      response.url().includes("/analytics/trends?days=365") &&
      response.status() === 200,
  );
  await page.goto("/charts");
  const history = await (await response).json();
  expect(history.timeline).toHaveLength(365);
  expect(
    history.timeline
      .slice(0, 40)
      .reduce((sum: number, day: { events: number }) => sum + day.events, 0),
  ).toBeGreaterThan(0);
  await expect(
    page.getByRole("combobox", { name: "Analytics time range" }),
  ).toContainText("Last 365 days");
  for (const name of ["Open workload", "Mitigation pace", "Work by category"])
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  for (const category of history.categories)
    await expect(
      page.getByRole("meter", {
        name: new RegExp(
          `^${category.category[0]}${category.category.slice(1).toLowerCase()} active issues$`,
        ),
      }),
    ).toHaveAttribute("aria-valuenow", String(category.count));
  await page.goto("/");
  await choose(page, "Appearance", "Light");
  const kpi = page.locator(".kpi-card").first();
  const lifecycle = page.getByRole("region", {
    name: "Issue lifecycle",
    exact: true,
  });
  await expect(lifecycle.locator(".category-track")).toHaveCount(4);
  await expect(lifecycle.locator("svg")).toHaveCount(0);
  await expect(
    lifecycle.getByRole("link", { name: /Resolved/ }),
  ).toHaveAttribute("href", "/issues?status=RESOLVED");
  const statusMeters = lifecycle.getByRole("meter");
  const statusCounts = await statusMeters.evaluateAll((elements) =>
    elements.map((element) => Number(element.getAttribute("aria-valuenow"))),
  );
  const issueTotal = statusCounts.reduce((sum, value) => sum + value, 0);
  for (const meter of await statusMeters.all())
    await expect(meter).toHaveAttribute("aria-valuemax", String(issueTotal));
  await lifecycle.screenshot({ path: "test-results/lifecycle-light.png" });
  await kpi.hover();
  await expect(kpi).toHaveCSS("background-color", "rgb(231, 235, 240)");
  await kpi.focus();
  await expect(kpi).toHaveCSS("outline-style", "none");
  await page
    .getByRole("button", { name: "Collapse sidebar", exact: true })
    .click();
  await expect(page.locator(".sidebar")).toHaveCSS("width", "64px");
  await expect(page.locator(".app-content")).toHaveCSS("margin-left", "64px");
  await expect(page.locator(".sidebar .nav-text").first()).toHaveCSS(
    "opacity",
    "0",
  );
  await expect(
    page.getByRole("navigation", { name: "Workspace", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Expand sidebar", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".sidebar")).toHaveCSS("width", "64px");
  const chartsIcon = page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Charts", exact: true });
  await chartsIcon.hover();
  await expect(
    page.getByRole("tooltip", { name: "Charts", exact: true }),
  ).toBeVisible();
  await chartsIcon.click();
  await expect(page).toHaveURL(/\/charts$/);
  await expect(
    page.getByRole("heading", { name: "Charts", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Mitigation pace", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".project-chart .recharts-bar-rectangle"),
  ).toHaveCount(4);
  await page.mouse.move(500, 80);
  await page.screenshot({
    path: "test-results/sidebar-rail.png",
    fullPage: false,
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Expand sidebar", exact: true })
    .click();
  await expect(page.locator(".sidebar")).toHaveCSS("width", "210px");
  await choose(page, "Appearance", "Dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await lifecycle.screenshot({ path: "test-results/lifecycle-dark.png" });
  await expect(
    page.getByRole("heading", { name: "Risk exposure", exact: true }),
  ).toBeVisible();
  const slice = page.locator(".distribution-panel .recharts-sector").first();
  await slice.scrollIntoViewIfNeeded();
  const point = await slice.evaluate((element) => {
    const box = element.getBoundingClientRect();
    for (let x = box.left + 4; x < box.right - 4; x += 4) {
      for (
        let y = Math.max(80, box.top + 4);
        y < Math.min(innerHeight, box.bottom - 4);
        y += 4
      ) {
        if (
          [
            [x, y],
            [x - 2, y],
            [x + 2, y],
            [x, y - 2],
            [x, y + 2],
          ].every(([px, py]) => document.elementFromPoint(px, py) === element)
        ) {
          return { x, y };
        }
      }
    }
    throw new Error("Risk exposure slice has no visible interior");
  });
  await page.mouse.move(point.x, point.y);
  await expect(
    page.locator(".distribution-panel .recharts-tooltip-item"),
  ).toBeVisible();
  await expect(
    page.locator(".distribution-panel .recharts-tooltip-item"),
  ).toHaveCSS("color", "rgb(231, 232, 235)");
  await page.screenshot({
    path: "test-results/dark-risk-tooltip.png",
    fullPage: false,
  });
  await page.goto("/risk-matrix?likelihood=2&impact=5");
  const cell = page.getByRole("button", { name: /Likelihood 2, impact 5:/ });
  await expect(cell).toHaveCSS("background-color", "rgb(81, 67, 44)");
  await expect(cell).toHaveCSS("color", "rgb(231, 232, 235)");
  await cell.focus();
  await expect(cell).toHaveCSS("outline-style", "none");
  await expect(page.locator(".selected-risks h2")).toHaveCSS(
    "color",
    "rgb(231, 232, 235)",
  );
  await page.mouse.move(5, 5);
  await page.screenshot({
    path: "test-results/dark-matrix.png",
    fullPage: true,
  });
  await page.goto("/issues?active_only=true");
  const checked = page.getByRole("checkbox", {
    name: "Active only",
    exact: true,
  });
  await expect(checked).toBeChecked();
  await expect(checked.locator(".checkbox-box")).toHaveCSS(
    "background-color",
    "rgb(53, 53, 53)",
  );
  await expect(checked.locator(".checkbox-box")).toHaveCSS(
    "color",
    "rgb(231, 232, 235)",
  );
  await page.screenshot({
    path: "test-results/dark-active-filter.png",
    fullPage: false,
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Action outlook", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Collapse sidebar", exact: true })
    .click();
  await page.mouse.move(5, 5);
  await page.screenshot({
    path: "test-results/year-dashboard.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await expect(
    page.getByRole("navigation", { name: "Workspace" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("link", { name: "Issues", exact: true })
    .click();
  await expect(page.locator(".drawer-scrim")).toBeHidden();
  await page.goto("/");
  await expect(lifecycle.locator(".category-metric")).toHaveCount(4);
  expect(
    await lifecycle
      .locator(".lifecycle-grid")
      .evaluate(
        (element) =>
          getComputedStyle(element).gridTemplateColumns.split(" ").length,
      ),
  ).toBe(2);
  await lifecycle.screenshot({ path: "test-results/lifecycle-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("Hover surfaces, matrix dividers and workflow controls share both themes", async ({
  page,
}) => {
  for (const theme of ["Light", "Dark"]) {
    await page.goto("/issues");
    await choose(page, "Appearance", theme);
    const header = page.getByRole("banner");
    await expect(header).toHaveCSS("backdrop-filter", "none");
    expect(
      await header.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).toBe(
      await page
        .locator(".sidebar")
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    );
    const row = page.locator(".issue-table tbody tr").first();
    await expect(row).toBeVisible({ timeout: 15000 });
    const badge = row.locator(".badge").last();
    await expect(badge).toHaveCSS("border-radius", "999px");
    await expect(row.locator(".risk-score")).toHaveCSS(
      "border-radius",
      "999px",
    );
    const badgeColor = await badge.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    await row.hover();
    const hover = theme === "Light" ? "rgb(231, 235, 240)" : "rgb(64, 64, 64)";
    await expect(row).toHaveCSS("background-color", hover);
    expect(badgeColor).not.toBe(hover);
    await expect(badge).toHaveCSS("background-color", badgeColor);
    await page.screenshot({
      path: `test-results/hover-${theme.toLowerCase()}.png`,
    });
    await page.goto("/risk-matrix");
    const cell = page.locator(".full-matrix .matrix-cell").first();
    await expect(cell).toBeVisible();
    const box = await cell.boundingBox();
    expect(box && Math.abs(box.width - box.height) < 1).toBeTruthy();
    await expect(cell).toHaveCSS("border-radius", "6px");
    const issue = page.locator(".matrix-issue").first();
    await expect(issue).toHaveCSS("border-top-width", "1px");
    await issue.hover();
    await expect(issue).toHaveCSS("background-color", hover);
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: `test-results/matrix-refined-${theme.toLowerCase()}.png`,
    });
    const inProgress = await (
      await page.request.get("/api/v1/issues?status=IN_PROGRESS&page_size=1")
    ).json();
    await page.goto(`/issues/${inProgress.items[0].id}`);
    const buttons = page.locator(".workflow-card .button");
    await expect(buttons).toHaveCount(2);
    for (const button of await buttons.all()) {
      await expect(button).toHaveClass("button secondary");
      await expect(button).toHaveCSS("justify-content", "space-between");
    }
    await page
      .locator(".workflow-card")
      .screenshot({ path: `test-results/workflow-${theme.toLowerCase()}.png` });
    await page.goto("/actions?overdue=true");
    const overdue = page.getByRole("checkbox", { name: "Overdue only" });
    const select = page.getByRole("combobox", { name: "Filter action status" });
    for (const property of [
      "min-height",
      "border-radius",
      "font-size",
      "padding-top",
    ]) {
      expect(
        await overdue.evaluate(
          (element, prop) => getComputedStyle(element).getPropertyValue(prop),
          property,
        ),
      ).toBe(
        await select.evaluate(
          (element, prop) => getComputedStyle(element).getPropertyValue(prop),
          property,
        ),
      );
    }
  }
});

test("Settings persist and control density, motion, chart range and live refresh", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.clock.install();
  await page.emulateMedia({
    reducedMotion: "no-preference",
    colorScheme: "dark",
  });
  await page.goto("/settings");
  await choose(page, "Density", "Compact");
  await choose(page, "Motion", "Reduced");
  await choose(page, "Default chart range", "Last 90 days");
  await choose(page, "Background refresh", "Off");
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Density", exact: true }),
  ).toContainText("Compact");
  await expect(
    page.getByRole("combobox", { name: "Motion", exact: true }),
  ).toContainText("Reduced");
  await expect(
    page.getByRole("combobox", { name: "Background refresh", exact: true }),
  ).toContainText("Off");
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
  await expect(page.locator(".sidebar-profile .avatar")).toBeVisible();
  await page.screenshot({ path: "test-results/settings-dark.png" });
  await page.goto("/charts");
  await expect(
    page.getByRole("combobox", { name: "Analytics time range" }),
  ).toContainText("Last 90 days");
  const plot = page.locator(".analytics-grid .recharts-surface").first();
  await expect(plot).toHaveCSS("animation-name", "none");
  await expect(page.locator(".sidebar")).toHaveCSS("transition-duration", "0s");
  await page.goto("/issues");
  await expect(page.locator(".issue-table td").first()).toHaveCSS(
    "padding-top",
    "11px",
  );
  let refreshes = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/issues?")) refreshes += 1;
  });
  await page.clock.fastForward(31000);
  await page.waitForTimeout(100);
  expect(refreshes).toBe(0);
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Settings", exact: true })
    .click();
  await choose(page, "Background refresh", "On");
  await choose(page, "Density", "Comfortable");
  const loaded = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/issues?") && response.status() === 200,
  );
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Issues", exact: true })
    .click();
  await loaded;
  await page.waitForTimeout(100);
  await expect(page.locator(".issue-table td").first()).toHaveCSS(
    "padding-top",
    "18px",
  );
  await expect(page.locator(".issue-table tbody tr").first()).toBeVisible();
  const before = refreshes;
  await page.clock.fastForward(31000);
  await expect.poll(() => refreshes).toBeGreaterThan(before);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/settings");
  await choose(page, "Appearance", "Light");
  await page.screenshot({ path: "test-results/settings-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Charts stay visible in navigation, command search finds issues, and the shell stays quiet", async ({
  page,
}) => {
  await page.goto("/issues/ca082e0e-bedf-59e3-86e8-d8a50ee83b12");
  await expect(
    page.locator(".issue-risk-chart .recharts-surface"),
  ).toBeVisible();
  await expect(page.locator(".sidebar .logo")).toHaveCount(0);
  await expect(page.locator(".topbar .demo-chip")).toHaveCount(0);
  await expect(page.locator(".topbar .breadcrumb strong")).toHaveCount(0);
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
  const workspace = page.getByRole("navigation", {
    name: "Workspace",
    exact: true,
  });
  await workspace.getByRole("link", { name: "Charts", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Charts", exact: true }),
  ).toBeVisible();
  for (const name of [
    "Issue flow",
    "Risk trend",
    "Open workload",
    "Mitigation pace",
  ])
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  await choose(page, "Demo user", "Oliver Brooks");
  await expect(
    workspace.getByRole("link", { name: "Charts", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", {
    name: "Search workspace",
    exact: true,
  });
  const search = dialog.getByRole("combobox", {
    name: "Search issues",
    exact: true,
  });
  await expect(search).toBeFocused();
  await search.fill("SIG-2001");
  await expect(dialog.getByRole("option")).toHaveCount(1);
  await expect(dialog.getByRole("option")).toContainText("SIG-2001");
  await page.screenshot({
    path: "test-results/command-search.png",
    fullPage: false,
  });
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(page.locator(".detail-eyebrow")).toContainText("SIG-2001");
  await expect(
    page.locator(".issue-risk-chart .recharts-surface"),
  ).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(dialog).toBeVisible();
  await search.fill("zz-no-such-signal-issue");
  await expect(dialog.getByRole("status")).toHaveText("No issues found.");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.keyboard.press("Control+k");
  await search.fill("API latency");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/issues\?search=API%20latency/);
  await expect(dialog).toBeHidden();
  await choose(page, "Appearance", "Dark");
  await page.goto("/issues/15486528-c768-5638-b2ed-aa6d7f6c1d9e");
  const completed = page.locator(".action-check.complete").first();
  await expect(completed).toHaveCSS("background-color", "rgb(53, 53, 53)");
  await expect(completed).toHaveCSS("color", "rgb(231, 232, 235)");
  await page.screenshot({
    path: "test-results/minimal-issue.png",
    fullPage: true,
  });
  await page.goto("/risk-matrix");
  await expect(page.getByText("5 × 5", { exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await expect(workspace).toBeVisible();
  await expect
    .poll(() =>
      workspace.evaluate((el) => Math.round(el.getBoundingClientRect().left)),
    )
    .toBeGreaterThanOrEqual(0);
  await page.screenshot({
    path: "test-results/minimal-sidebar.png",
    fullPage: false,
  });
  await workspace.getByRole("link", { name: "Charts", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Charts", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(dialog).toBeVisible();
  await search.fill("SIG-2001");
  await expect(dialog.getByRole("option")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-search.png",
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Mitigation pace", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Refresh analytics", exact: true }),
  ).toBeEnabled();
  await expect(
    page.locator(".project-chart .recharts-bar-rectangle"),
  ).toHaveCount(4);
  await page.screenshot({
    path: "test-results/charts-page.png",
    fullPage: true,
  });
});

test("Sidebar motion, clear modal backdrops and chart cards follow appearance preferences", async ({
  page,
}) => {
  await page.emulateMedia({
    colorScheme: "dark",
    reducedMotion: "no-preference",
  });
  await page.goto("/charts");
  await expect(
    page.getByRole("heading", { name: "Mitigation pace", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".period-metrics > div").first()).toHaveCSS(
    "background-color",
    "rgb(33, 33, 33)",
  );
  await expect(page.locator(".period-metrics > div").first()).toHaveCSS(
    "border-radius",
    "16px",
  );
  const plot = page.locator(".analytics-grid .recharts-surface").first();
  await expect(plot).toHaveCSS("animation-name", "chart-data-reveal");
  await expect(
    page.locator(".project-chart .recharts-rectangle").first(),
  ).toHaveCSS("fill", "rgb(119, 119, 119)");
  await expect(page.locator(".search-launch kbd")).toHaveCount(0);
  const create = page.getByRole("button", { name: "New issue", exact: true });
  const top = await create.boundingBox();
  const header = await page.locator(".topbar").boundingBox();
  const toggle = page.getByRole("button", {
    name: "Collapse sidebar",
    exact: true,
  });
  await expectSidebarListSpacing(page);
  const toggleBox = await toggle.boundingBox();
  expect(
    toggleBox &&
      header &&
      Math.abs(
        toggleBox.y + toggleBox.height / 2 - header.y - header.height / 2,
      ) < 1,
  ).toBeTruthy();
  await expect(
    page.locator(".topbar").getByRole("heading", { name: "Charts", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
  const firstItem = page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Overview", exact: true });
  const icon = await firstItem.locator("svg").boundingBox();
  const toggleIcon = await toggle.locator("svg").boundingBox();

  expect(
    icon &&
      toggleIcon &&
      Math.abs(icon.x + icon.width / 2 - toggleIcon.x - toggleIcon.width / 2) <
        1,
  ).toBeTruthy();
  const nav = await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .boundingBox();
  expect(top && nav && top.y + top.height <= nav.y).toBeTruthy();
  expect(
    await page
      .locator(".sidebar")
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toContain("0.32s");
  await page
    .getByRole("button", { name: "Collapse sidebar", exact: true })
    .click();
  await expect(page.locator(".sidebar")).toHaveCSS("width", "64px");
  await expect(firstItem).toBeVisible();
  await expect(firstItem.locator(".nav-text")).toHaveCSS("opacity", "0");
  await expectSidebarListSpacing(page);
  await page
    .getByRole("button", { name: "Expand sidebar", exact: true })
    .click();
  await expect(page.locator(".sidebar")).toHaveCSS("width", "210px");
  await expectSidebarListSpacing(page);
  await page.keyboard.press("Control+k");
  await expect(page.locator(".search-overlay")).toHaveCSS(
    "backdrop-filter",
    "blur(8px)",
  );
  await page.keyboard.press("Escape");
  await create.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".modal-overlay")).toHaveCSS(
    "backdrop-filter",
    "blur(8px)",
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".sidebar")).toHaveCSS("transition-duration", "0s");
  await expect(plot).toHaveCSS("animation-name", "none");
  await page.screenshot({
    path: "test-results/refined-charts.png",
    fullPage: true,
  });
});

test("App header, quiet risks, simple matrix and discussion stay consistent", async ({
  page,
}) => {
  await page.emulateMedia({
    colorScheme: "dark",
    reducedMotion: "no-preference",
  });
  await page.goto("/activity");
  const toolbar = page.getByRole("banner");
  await expect(
    toolbar.getByRole("heading", { name: "Activity", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
  const profile = page.locator(".sidebar-profile .account-control");
  const avatar = await profile.locator(".select-leading").boundingBox();
  const name = await profile.locator(".select-value").boundingBox();
  expect(
    avatar && name && Math.abs(name.x - avatar.x - avatar.width - 10) < 1,
  ).toBeTruthy();
  await expect(
    page.getByRole("heading", { name: "Change volume", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".activity-item").first()).toBeVisible();
  await page.screenshot({
    path: "test-results/app-shell-desktop.png",
    fullPage: false,
  });
  const create = page.locator(".sidebar-new-issue");
  const search = page.locator(".sidebar-search");
  const first = await create.boundingBox();
  await page
    .getByRole("button", { name: "Collapse sidebar", exact: true })
    .click();
  await expect(page.locator(".sidebar")).toHaveCSS("width", "64px");
  expect((await create.boundingBox())?.y).toBe(first?.y);
  await expect(create.locator(".nav-text")).toHaveCSS("opacity", "0");
  await expect(search).toHaveCSS("height", "40px");
  await page.goto("/risk-matrix");
  await expect(page.locator(".full-matrix .matrix-cell")).toHaveCount(25);
  await expect(page.locator(".cell-score, .matrix-cell small")).toHaveCount(0);
  const critical = page.locator(".full-matrix .matrix-cell.critical").first();
  await expect(critical).toHaveCSS("animation-name", "none");
  await expect(critical).toHaveCSS("background-color", "rgb(59, 59, 59)");
  await page.goto("/issues/ca082e0e-bedf-59e3-86e8-d8a50ee83b12");
  const discussion = page.getByRole("region", {
    name: "Discussion",
    exact: true,
  });
  await expect(discussion).toBeVisible();
  const body = `Discussion check ${Date.now()}`;
  await discussion.getByRole("textbox", { name: "Add a comment" }).fill(body);
  await discussion
    .getByRole("button", { name: "Add comment", exact: true })
    .click();
  await expect(discussion.getByText(body, { exact: true })).toBeVisible();
  await page.reload();
  await expect(discussion.getByText(body, { exact: true })).toBeVisible();
  await page.goto("/issues?severity=CRITICAL");
  await expect(page.locator(".risk-score.critical").first()).toHaveCSS(
    "background-color",
    "rgb(53, 53, 53)",
  );
  await choose(page, "Appearance", "Light");
  await expect(page.locator(".risk-score.critical").first()).toHaveCSS(
    "background-color",
    "rgb(232, 235, 239)",
  );
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/activity");
  await expect(
    toolbar.getByRole("heading", { name: "Activity", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Change volume", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".activity-item").first()).toBeVisible();
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Navigation", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".app-content")).toHaveAttribute("inert", "");
  await expect(page.locator(".sidebar")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await expectSidebarListSpacing(page);
  const mobileAvatar = await profile.locator(".select-leading").boundingBox();
  const mobileName = await profile.locator(".select-value").boundingBox();
  expect(
    mobileAvatar &&
      mobileName &&
      Math.abs(mobileName.x - mobileAvatar.x - mobileAvatar.width - 10) < 1,
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/app-shell-mobile-drawer.png",
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open navigation", exact: true }),
  ).toBeFocused();
  await expect(page.locator(".sidebar")).toHaveCSS("visibility", "hidden");
  await expect(page.locator(".drawer-scrim")).toBeHidden();
  await expect(page.locator(".app-content")).not.toHaveAttribute("inert");
  await page.screenshot({
    path: "test-results/app-shell-mobile-header.png",
    fullPage: false,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Activity KPI cards, filled searches and flat dialogs keep page colors unchanged", async ({
  page,
}) => {
  test.setTimeout(60000);
  async function expectNoShadows() {
    const shadows = await page.evaluate(() =>
      Array.from(document.querySelectorAll("body *"))
        .filter((element) => {
          const style = getComputedStyle(element);
          return (
            element.getClientRects().length &&
            (style.boxShadow !== "none" ||
              style.textShadow !== "none" ||
              style.filter.includes("drop-shadow"))
          );
        })
        .map((element) => element.className),
    );
    expect(shadows).toEqual([]);
  }
  for (const theme of ["Light", "Dark"]) {
    await page.goto("/");
    await choose(page, "Appearance", theme);
    const card = page.locator(".kpi-card").first();
    await expect(card).toBeVisible({ timeout: 15000 });
    const mainStyle = await card.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        radius: style.borderRadius,
        padding: style.padding,
      };
    });
    await page.goto("/activity");
    const activity = page.getByRole("region", {
      name: "Activity analytics",
      exact: true,
    });
    const stats = activity.locator(".kpi-card");
    await expect(stats).toHaveCount(3);
    for (const stat of await stats.all()) {
      await expect(stat).toHaveCSS("background-color", mainStyle.background);
      await expect(stat).toHaveCSS("border-radius", mainStyle.radius);
      await expect(stat).toHaveCSS("padding", mainStyle.padding);
    }
    const search = page.locator(".search-field");
    const control = page.getByRole("combobox", {
      name: "History event type",
      exact: true,
    });
    expect(
      await search.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).toBe(
      await control.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    );
    await expectNoShadows();
    await page.screenshot({
      path: `test-results/flat-activity-${theme.toLowerCase()}.png`,
    });
    await control.click();
    await expectNoShadows();
    await page.keyboard.press("Escape");
    await page.locator(".sidebar-new-issue").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.locator(".modal-overlay")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await expect(page.locator(".modal-overlay")).toHaveCSS(
      "backdrop-filter",
      "blur(8px)",
    );
    await expect(dialog).toHaveCSS("box-shadow", "none");
    await expectNoShadows();
    await page.screenshot({
      path: `test-results/flat-modal-${theme.toLowerCase()}.png`,
    });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await page.keyboard.press("Control+k");
    await expect(page.locator(".search-overlay")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await expect(page.locator(".search-overlay")).toHaveCSS(
      "backdrop-filter",
      "blur(8px)",
    );
    await expectNoShadows();
    await page.screenshot({
      path: `test-results/flat-search-${theme.toLowerCase()}.png`,
    });
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/activity");
  await expect(page.locator(".history-kpis .kpi-card")).toHaveCount(3);
  await expect(
    page.getByRole("heading", { name: "Change volume", exact: true }),
  ).toBeVisible();
  await expectNoShadows();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/flat-activity-mobile.png" });
  await page.getByRole("button", { name: "New issue", exact: true }).click();
  const overlay = page.locator(".modal-overlay");
  await expect(overlay).toHaveCSS("backdrop-filter", "blur(8px)");
  expect(await overlay.boundingBox()).toEqual({
    x: 0,
    y: 0,
    width: 390,
    height: 844,
  });
  await page.screenshot({ path: "test-results/blurred-modal-mobile.png" });
  await page.keyboard.press("Escape");
});

test("Operational overview and deeper charts export the real portfolio to Excel", async ({
  page,
}) => {
  test.setTimeout(90000);
  const healthResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/analytics/operations") &&
      response.status() === 200,
  );
  const summaryResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/dashboard/summary") &&
      response.status() === 200,
  );
  await page.goto("/");
  const health: Operations = await (await healthResponse).json();
  const summary: Summary = await (await summaryResponse).json();
  await expect(
    page.getByRole("heading", { name: "Risk trend", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("combobox", { name: "Analytics time range" }),
  ).toHaveCount(0);
  for (const name of [
    "Action outlook",
    "Risk review coverage",
    "Project health",
    "Overdue work",
  ])
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  const metrics = page.locator(".operational-metrics > div");
  await expect(metrics).toHaveCount(4);
  const expectedMetrics = [
    ["Without a plan", health.metrics.unplanned_issues],
    ["Reviews overdue", health.metrics.stale_reviews],
    ["Awaiting review", health.metrics.awaiting_review],
    ["Completed on time", health.metrics.on_time_completion],
  ] as const;
  for (const [name, value] of expectedMetrics) {
    const metric = metrics
      .filter({ has: page.getByText(name, { exact: true }) })
      .locator("strong");
    if (value === null) await expect(metric).toHaveText("—");
    else
      expect(Number((await metric.innerText()).replace(/[, %]/g, ""))).toBe(
        value,
      );
  }
  await page.screenshot({
    path: "test-results/operational-overview.png",
    fullPage: true,
  });

  const overview = await exportWorkbook(page);
  expect(metricValue(overview, "Overview", "Active issues")).toBe(
    summary.active_issues,
  );
  expect(metricValue(overview, "Overview", "Total issues")).toBe(
    summary.total_issues,
  );
  expect(
    metricValue(overview, "Operational totals", "Issues without a plan"),
  ).toBe(health.metrics.unplanned_issues);
  expect(
    metricValue(overview, "Operational totals", "On-time completion (%)"),
  ).toBe(health.metrics.on_time_completion);
  expect(metricValue(overview, "Overview", "Generated at")).toEqual(
    new Date(summary.generated_at),
  );
  const riskMatrix = overview.getWorksheet("Risk matrix")!;
  expect(riskMatrix.rowCount).toBe(26);
  expect(riskMatrix.getCell("A2").value).toBe(summary.matrix[0].likelihood);
  expect(riskMatrix.getCell("E2").value).toBe(summary.matrix[0].count);
  const overdue = overview.getWorksheet("Overdue actions")!;
  expect(overdue.rowCount).toBe(health.overdue_actions.length + 1);
  if (health.overdue_actions.length) {
    expect(overdue.getCell("A2").value).toBe(
      health.overdue_actions[0].reference,
    );
    expect(overdue.getCell("D2").value).toEqual(
      new Date(`${health.overdue_actions[0].due_date}T00:00:00Z`),
    );
    expect(overdue.getCell("E2").value).toBe(
      health.overdue_actions[0].days_overdue,
    );
  }

  for (const [index, bucket] of health.action_outlook.entries()) {
    const outlook = page
      .getByRole("heading", { name: "Action outlook", exact: true })
      .locator("xpath=ancestor::section[1]");
    await outlook
      .locator(".health-row")
      .filter({ has: page.getByText(bucket.label, { exact: true }) })
      .click();
    await expect(page).toHaveURL(
      new RegExp(["overdue=true", "due=today", "due=week", "due=later"][index]),
    );
    await expect(page.locator(".issues-toolbar .small-text")).toHaveText(
      `${bucket.count} actions`,
    );
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Action outlook", exact: true }),
    ).toBeVisible();
  }

  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Charts", exact: true })
    .click();
  for (const name of [
    "Issue flow",
    "Risk trend",
    "Issue age",
    "Owner workload",
    "Risk movement",
  ])
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Action outlook", exact: true }),
  ).toHaveCount(0);
  const trendResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/analytics/trends?days=90") &&
      response.status() === 200,
  );
  await choose(page, "Analytics time range", "Last 90 days");
  const trends: Analytics = await (await trendResponse).json();
  const charts = await exportWorkbook(page);
  expect(metricValue(charts, "Period totals", "Days")).toBe(90);
  expect(metricValue(charts, "Period totals", "Issues created")).toBe(
    trends.metrics.created,
  );
  const history = charts.getWorksheet("Daily history")!;
  expect(history.rowCount).toBe(91);
  for (const [index, day] of trends.timeline.entries()) {
    expect(history.getCell(index + 2, 1).value).toEqual(
      new Date(`${day.date}T00:00:00Z`),
    );
    expect(history.getCell(index + 2, 2).value).toBe(day.created);
    expect(history.getCell(index + 2, 4).value).toBe(day.active);
    expect(history.getCell(index + 2, 5).value).toBe(day.average_risk);
  }
  expect(charts.getWorksheet("Owner workload")!.rowCount).toBe(
    health.owners.length + 1,
  );
  const movement = charts.getWorksheet("Risk movement")!;
  expect(movement.rowCount).toBe(health.risk_movement.length + 1);
  for (const [index, bucket] of health.risk_movement.entries()) {
    expect(movement.getCell(index + 2, 1).value).toBe(bucket.label);
    expect(movement.getCell(index + 2, 2).value).toBe(bucket.count);
  }
  await page.screenshot({
    path: "test-results/deeper-charts.png",
    fullPage: true,
  });

  await page.goto("/issues?active_only=true&page_size=10");
  const active: DataPage<Issue> = await (
    await page.request.get("/api/v1/issues?active_only=true&page_size=100")
  ).json();
  expect(active.total).toBeGreaterThan(10);
  await expect(page.locator(".issue-table tbody tr")).toHaveCount(10);
  const issueExport = await exportWorkbook(page);
  const issues = issueExport.getWorksheet("Issues")!;
  expect(issues.rowCount).toBe(active.total + 1);
  expect(metricValue(issueExport, "Filters", "active_only")).toBe("true");
  for (const [index, issue] of active.items.entries()) {
    expect(issues.getCell(index + 2, 1).value).toBe(issue.reference_code);
    expect(issues.getCell(index + 2, 2).value).toBe(issue.title);
    expect(issues.getCell(index + 2, 13).value).toBe(issue.risk?.score ?? null);
    expect(issues.getCell(index + 2, 16).value).toEqual(
      new Date(issue.created_at),
    );
  }
});

test("Every statistics destination exports scoped Excel data with native dates", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/projects");
  const projects: ProjectStats[] = await (
    await page.request.get("/api/v1/projects")
  ).json();
  await expect(page.locator(".project-card")).toHaveCount(projects.length);
  const projectWorkbook = await exportWorkbook(page);
  const projectSheet = projectWorkbook.getWorksheet("Projects")!;
  expect(projectSheet.rowCount).toBe(projects.length + 1);
  for (const [index, project] of projects.entries()) {
    expect(projectSheet.getCell(index + 2, 1).value).toBe(project.code);
    expect(projectSheet.getCell(index + 2, 6).value).toBe(
      project.active_issues,
    );
    expect(projectSheet.getCell(index + 2, 8).value).toBe(project.progress);
    expect(projectSheet.getCell(index + 2, 9).value).toEqual(
      new Date(project.created_at),
    );
  }

  await page.goto("/risk-matrix");
  const summary: Summary = await (
    await page.request.get("/api/v1/dashboard/summary")
  ).json();
  await expect(page.locator(".full-matrix .matrix-cell")).toHaveCount(25);
  const matrixWorkbook = await exportWorkbook(page);
  const matrix = matrixWorkbook.getWorksheet("Risk matrix")!;
  expect(matrix.rowCount).toBe(26);
  for (const [index, cell] of summary.matrix.entries()) {
    expect(matrix.getCell(index + 2, 1).value).toBe(cell.likelihood);
    expect(matrix.getCell(index + 2, 2).value).toBe(cell.impact);
    expect(matrix.getCell(index + 2, 3).value).toBe(cell.score);
    expect(matrix.getCell(index + 2, 5).value).toBe(cell.count);
  }
  expect(matrixWorkbook.getWorksheet("Issues")!.rowCount).toBe(
    summary.matrix.reduce((total, cell) => total + cell.count, 0) + 1,
  );

  await page.goto("/actions?due=week");
  const actions: Action[] = await (
    await page.request.get("/api/v1/actions")
  ).json();
  const today = await page.evaluate(() =>
    new Date().toISOString().slice(0, 10),
  );
  const nextWeek = new Date(Date.parse(`${today}T00:00:00Z`) + 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const due = actions.filter(
    (action) =>
      !["DONE", "CANCELLED"].includes(action.status) &&
      action.issue_status !== "RESOLVED" &&
      action.due_date > today &&
      action.due_date <= nextWeek,
  );
  await expect(page.locator(".issues-toolbar .small-text")).toHaveText(
    `${due.length} actions`,
  );
  const actionWorkbook = await exportWorkbook(page);
  const actionSheet = actionWorkbook.getWorksheet("Actions")!;
  expect(actionSheet.rowCount).toBe(due.length + 1);
  expect(metricValue(actionWorkbook, "Filters", "due")).toBe("week");
  for (const [index, action] of due.entries()) {
    expect(actionSheet.getCell(index + 2, 1).value).toBe(
      action.issue_reference,
    );
    expect(actionSheet.getCell(index + 2, 3).value).toBe(action.title);
    expect(actionSheet.getCell(index + 2, 7).value).toEqual(
      new Date(`${action.due_date}T00:00:00Z`),
    );
    expect(actionSheet.getCell(index + 2, 9).value).toEqual(
      new Date(action.created_at),
    );
  }

  await page.goto("/activity?search=SIG-1001");
  const events: DataPage<Audit> = await (
    await page.request.get("/api/v1/activity?search=SIG-1001&page_size=100")
  ).json();
  await expect(
    page.locator(".activity-full .activity-item").first(),
  ).toContainText("SIG-1001");
  const activityWorkbook = await exportWorkbook(page);
  const activity = activityWorkbook.getWorksheet("Activity")!;
  expect(activity.rowCount).toBe(events.total + 1);
  expect(metricValue(activityWorkbook, "Filters", "search")).toBe("SIG-1001");
  expect(metricValue(activityWorkbook, "Period totals", "Days")).toBe(365);
  expect(activityWorkbook.getWorksheet("Daily history")!.rowCount).toBe(366);
  for (const [index, event] of events.items.entries()) {
    expect(activity.getCell(index + 2, 1).value).toEqual(
      new Date(event.occurred_at),
    );
    expect(activity.getCell(index + 2, 2).value).toBe(event.actor.full_name);
    expect(activity.getCell(index + 2, 3).value).toBe(event.issue_reference);
    expect(activity.getCell(index + 2, 7).value).toBe(
      JSON.stringify(event.new_value),
    );
  }

  const issueId = events.items[0].issue_id;
  await page.goto(`/issues/${issueId}`);
  const detail: Detail = await (
    await page.request.get(`/api/v1/issues/${issueId}`)
  ).json();
  await expect(
    page.getByRole("heading", { name: detail.title, exact: true }),
  ).toBeVisible();
  const detailWorkbook = await exportWorkbook(page);
  const riskHistory = detailWorkbook.getWorksheet("Risk history")!;
  expect(riskHistory.rowCount).toBe(detail.assessments.length + 1);
  expect(detailWorkbook.getWorksheet("Actions")!.rowCount).toBe(
    detail.actions.length + 1,
  );
  expect(detailWorkbook.getWorksheet("Activity")!.rowCount).toBe(
    detail.activity.length + 1,
  );
  for (const [index, risk] of detail.assessments.entries()) {
    expect(riskHistory.getCell(index + 2, 1).value).toEqual(
      new Date(risk.assessed_at),
    );
    expect(riskHistory.getCell(index + 2, 2).value).toBe(risk.likelihood);
    expect(riskHistory.getCell(index + 2, 3).value).toBe(risk.impact);
    expect(riskHistory.getCell(index + 2, 4).value).toBe(risk.score);
    expect(riskHistory.getCell(index + 2, 6).value).toBe(risk.rationale);
  }

  await page.goto("/");
  await choose(page, "Demo user", "Daniel Reed");
  await expect(
    page.getByRole("heading", { name: "Team focus", exact: true }),
  ).toBeVisible();
  const users: User[] = await (await page.request.get("/api/v1/users")).json();
  const manager = users.find((user) => user.full_name === "Daniel Reed")!;
  const project = projects.find((item) => item.owner_id === manager.id)!;
  await expect(
    page.getByRole("heading", { name: project.name, exact: true }),
  ).toBeVisible();
  const scoped: DataPage<Issue> = await (
    await page.request.get(
      `/api/v1/issues?active_only=true&project_id=${project.id}&page_size=100`,
    )
  ).json();
  const scopedActions: Action[] = await (
    await page.request.get(`/api/v1/actions?owner_id=${manager.id}`)
  ).json();
  const focusWorkbook = await exportWorkbook(page);
  expect(metricValue(focusWorkbook, "Scope", "User")).toBe(manager.full_name);
  expect(metricValue(focusWorkbook, "Scope", "Project")).toBe(project.name);
  expect(focusWorkbook.getWorksheet("Issues")!.rowCount).toBe(scoped.total + 1);
  expect(focusWorkbook.getWorksheet("Actions")!.rowCount).toBe(
    scopedActions.filter(
      (action) => !["DONE", "CANCELLED"].includes(action.status),
    ).length + 1,
  );
});

test("Shared action controls and search stay filled and softly rounded on desktop and mobile", async ({
  page,
}) => {
  test.setTimeout(90000);
  async function expectFilled(control: Locator, color?: string) {
    await expect(control).toBeVisible();
    await expect(control).toHaveCSS("height", "40px");
    await expect(control).toHaveCSS("border-radius", "20px");
    if (color) await expect(control).toHaveCSS("background-color", color);
    else
      expect(
        await control.evaluate(
          (element) => getComputedStyle(element).backgroundColor,
        ),
      ).not.toBe("rgba(0, 0, 0, 0)");
  }
  for (const theme of ["Light", "Dark"]) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/settings");
    await choose(page, "Appearance", theme);
    await page.mouse.move(700, 0);
    const neutral =
      theme === "Light" ? "rgb(233, 237, 242)" : "rgb(45, 45, 45)";
    const menuHover =
      theme === "Light" ? "rgb(231, 235, 240)" : "rgb(64, 64, 64)";
    for (const control of await page
      .locator(".settings-panel .select-trigger")
      .all())
      await expectFilled(control, neutral);
    for (const row of await page
      .locator(".sidebar-shortcuts button:visible")
      .all()) {
      await expect(row).toHaveCSS("border-radius", "8px");
      await expect(row).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    }
    for (const row of await page.locator(".sidebar nav a").all()) {
      await expect(row).toHaveCSS("border-radius", "8px");
      if (!(await row.getAttribute("class"))?.split(" ").includes("active"))
        await expect(row).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    }
    const account = page.locator(".sidebar-profile .account-control");
    await expect(account).toHaveCSS("border-radius", "10px");
    await expect(account).toHaveCSS("height", "40px");
    await expect(account).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expectSidebarListSpacing(page);
    const toggle = page.getByRole("button", {
      name: "Collapse sidebar",
      exact: true,
    });
    await toggle.hover();
    await expect(toggle).toHaveCSS("background-color", menuHover);
    await page.mouse.move(700, 0);

    await page.goto("/actions");
    const overdue = page.getByRole("checkbox", {
      name: "Overdue only",
      exact: true,
    });
    await expectFilled(overdue, neutral);
    await expectFilled(
      page.getByRole("combobox", { name: "Filter action status", exact: true }),
      neutral,
    );
    await expectFilled(
      page.getByRole("button", { name: "Export to Excel", exact: true }),
      neutral,
    );
    await overdue.click();
    await expect(overdue).toBeChecked();
    await expectFilled(overdue);
    await page.goto("/issues");
    await expect(page.locator(".issue-table tbody tr").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Export to Excel", exact: true }),
    ).toBeEnabled();
    for (const control of await page
      .locator(
        ".pagination .button, .sort-control .select-trigger, .sort-control .icon-button",
      )
      .all())
      await expect(control).toHaveCSS("height", "40px");
    await expectFilled(page.locator(".search-field"), neutral);
    await expectFilled(
      page.getByRole("button", { name: "Create issue", exact: true }),
    );
    await page.screenshot({
      path: `test-results/rounded-controls-${theme.toLowerCase()}.png`,
      fullPage: false,
    });

    const inProgress: DataPage<Issue> = await (
      await page.request.get("/api/v1/issues?status=IN_PROGRESS&page_size=1")
    ).json();
    await page.goto(`/issues/${inProgress.items[0].id}`);
    await expect(page.locator(".workflow-card .button")).toHaveCount(2);
    for (const control of await page
      .locator(
        ".workflow-card .button, .detail-actions .button, .detail-actions .icon-button",
      )
      .all())
      await expectFilled(control, neutral);
    for (const tab of await page.getByRole("tab").all())
      await expectFilled(tab);
    const discussion = page.getByRole("region", {
      name: "Discussion",
      exact: true,
    });
    await discussion
      .getByRole("textbox", { name: "Add a comment" })
      .fill("Control preview");
    await expectFilled(
      discussion.getByRole("button", { name: "Add comment", exact: true }),
    );
    await page.locator(".sidebar-new-issue").click();
    const modal = page.getByRole("dialog");
    const date = modal.getByRole("button", { name: "Due date", exact: true });
    await expectFilled(date, neutral);
    await date.click();
    await expectFilled(
      page.getByRole("button", { name: "Next month", exact: true }),
      neutral,
    );
    await expectFilled(
      page.getByRole("button", { name: "Previous month", exact: true }),
      neutral,
    );
    for (const control of await page
      .locator(
        ".calendar-popover button, .modal .button, .modal .icon-button, .modal .select-trigger",
      )
      .all())
      await expect(control).toHaveCSS("height", "40px");
    await page.screenshot({
      path: `test-results/rounded-form-${theme.toLowerCase()}.png`,
      fullPage: false,
    });
    await page.keyboard.press("Escape");
    await modal
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await page.keyboard.press("Control+k");
    const search = page.getByRole("dialog", {
      name: "Search workspace",
      exact: true,
    });
    await expectFilled(search.locator(".search-input-row"), neutral);
    await expectFilled(
      search.getByRole("button", { name: "Close search", exact: true }),
    );
    await page.screenshot({
      path: `test-results/rounded-search-${theme.toLowerCase()}.png`,
      fullPage: false,
    });
    await search
      .getByRole("button", { name: "Close search", exact: true })
      .click();
    await expect(search).toBeHidden();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/issues");
    await expect(page.locator(".issue-table tbody tr").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Export to Excel", exact: true }),
    ).toBeEnabled();
    await expectFilled(page.locator(".search-field"), neutral);
    const open = page.getByRole("button", {
      name: "Open navigation",
      exact: true,
    });
    await expectFilled(open, neutral);
    await open.click();
    await expectSidebarListSpacing(page);
    await expect(
      page.locator(".sidebar-profile .account-control"),
    ).toBeVisible();
    const close = page
      .locator(".sidebar-shortcuts")
      .getByRole("button", { name: "Close navigation", exact: true });
    await page.mouse.move(380, 830);
    await expect(close).toHaveCSS("border-radius", "0px");
    await expect(close).toHaveCSS("height", "40px");
    await expect(close).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(page.locator(".sidebar-new-issue")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await page.screenshot({
      path: `test-results/rounded-mobile-sidebar-${theme.toLowerCase()}.png`,
      fullPage: false,
    });
    await close.click();
    await expect(page.locator(".sidebar")).toHaveCSS("visibility", "hidden");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("Issues and unfinished actions can be deleted and restored without losing history", async ({
  page,
}) => {
  const title = await createIssue(page, "recycle");
  const issueUrl = page.url();
  const id = new URL(issueUrl).pathname.split("/").pop();
  await planAction(page);
  const action = page
    .locator(".action-table tbody tr")
    .filter({ hasText: "Restrict excess access" });
  await action
    .getByRole("button", { name: "Delete action", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Delete action?",
    exact: true,
  });
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(action).toHaveCount(0);
  const removedAction = await (
    await page.request.get(`/api/v1/issues/${id}`)
  ).json();
  expect(removedAction.actions).toHaveLength(0);
  expect(removedAction.assessments).toHaveLength(1);
  await page.goto("/actions");
  await page
    .getByRole("button", { name: "Show deleted actions", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Deleted actions", exact: true }),
  ).toBeVisible();
  const deletedAction = page
    .locator(".action-table tbody tr")
    .filter({ hasText: "Restrict excess access" });
  await deletedAction
    .getByRole("button", { name: "Restore action", exact: true })
    .click();
  await expect(deletedAction).toHaveCount(0);
  await page.goto(issueUrl);
  await expect(action).toHaveCount(1);
  await page.getByRole("button", { name: "Delete issue", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Delete issue?", exact: true })
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete issue", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Delete issue?", exact: true })
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page).toHaveURL(/\/issues$/);
  await page
    .getByRole("button", { name: "Show deleted issues", exact: true })
    .click();
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await expect(page.locator(".deleted-notice")).toContainText("Deleted issue");
  for (const name of [
    "Edit issue",
    "Assess risk",
    "Add action",
    "Change owner",
  ])
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(
      0,
    );
  await expect(
    page.getByRole("textbox", { name: "Add a comment", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "test-results/deleted-issue.png",
    fullPage: false,
  });
  await page
    .getByRole("button", { name: "Restore issue", exact: true })
    .click();
  await expect(page.locator(".deleted-notice")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Edit issue", exact: true }),
  ).toBeVisible();
  const restored: Detail = await (
    await page.request.get(`/api/v1/issues/${id}`)
  ).json();
  expect(restored.deleted_at).toBeNull();
  expect(restored.version).toBe(6);
  expect(restored.actions).toHaveLength(1);
  expect(restored.assessments.map((r) => r.id)).toEqual(
    removedAction.assessments.map((r: { id: string }) => r.id),
  );
  expect(
    restored.activity.filter((e) =>
      [
        "ISSUE_DELETED",
        "ISSUE_RESTORED",
        "ACTION_DELETED",
        "ACTION_RESTORED",
      ].includes(e.event_type),
    ),
  ).toHaveLength(4);
  await expect(page.locator(".toast")).toHaveCount(0);
});

test("Calendar geometry, risk text, menu spacing and analytics controls stay consistent", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const theme of ["Light", "Dark"]) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/settings");
    await choose(page, "Appearance", theme);
    await page.goto("/charts");
    const tools = page.locator(".analytics-tools");
    const exportButton = tools.getByRole("button", {
      name: "Export to Excel",
      exact: true,
    });
    const range = tools.getByRole("combobox", {
      name: "Analytics time range",
      exact: true,
    });
    await expect(exportButton).toBeEnabled();
    await page.mouse.move(0, 0);
    for (const property of [
      "height",
      "border-radius",
      "font-size",
      "font-weight",
      "background-color",
      "color",
    ])
      expect(
        await exportButton.evaluate(
          (e, p) => getComputedStyle(e).getPropertyValue(p),
          property,
        ),
      ).toBe(
        await range.evaluate(
          (e, p) => getComputedStyle(e).getPropertyValue(p),
          property,
        ),
      );
    await range.click();
    const selected = page.getByRole("option", {
      name: "Last 365 days",
      exact: true,
    });
    const neighbor = page.getByRole("option", {
      name: "Last 180 days",
      exact: true,
    });
    await neighbor.hover();
    const selectedBox = await selected.boundingBox();
    const neighborBox = await neighbor.boundingBox();
    expect(
      selectedBox!.y - neighborBox!.y - neighborBox!.height,
    ).toBeGreaterThanOrEqual(3.9);
    await page.screenshot({
      path: `test-results/spaced-menu-${theme.toLowerCase()}.png`,
      fullPage: false,
    });
    await page.keyboard.press("Escape");
    await page.locator(".sidebar-new-issue").click();
    const modal = page.getByRole("dialog", {
      name: "Create an issue",
      exact: true,
    });
    const neutral = await page
      .locator("body")
      .evaluate((e) => getComputedStyle(e).color);
    await expect(modal.locator(".risk-preview")).toHaveCSS("color", neutral);
    await expect(modal.locator(".risk-preview > span:last-child")).toHaveCSS(
      "color",
      neutral,
    );
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({
        width,
        height: width === 1440 ? 1000 : 844,
      });
      await modal
        .getByRole("button", { name: "Due date", exact: true })
        .click();
      const calendar = page.locator(".calendar-popover");
      await expect(calendar).toBeVisible();
      const days = calendar.locator(".calendar-day");
      await expect(days).toHaveCount(42);
      const boxes = await days.evaluateAll((elements) =>
        elements.map((e) => {
          const b = e.getBoundingClientRect();
          return { width: b.width, height: b.height };
        }),
      );
      expect(
        boxes.every(
          (b) => Math.abs(b.width - 40) < 1 && Math.abs(b.height - 40) < 1,
        ),
      ).toBe(true);
      // The popover is visible before Radix's collision placement finishes.
      // Keep the viewport bounds requirement, waiting for the final geometry.
      await expect
        .poll(async () => {
          const bounds = await calendar.boundingBox();
          return (
            !!bounds && bounds.x >= 7 && bounds.x + bounds.width <= width - 7
          );
        })
        .toBe(true);
      await calendar.screenshot({
        path: `test-results/calendar-${theme.toLowerCase()}-${width}.png`,
      });
      await page.keyboard.press("Escape");
      await expect(calendar).toBeHidden();
    }
    await modal
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
  }
});
