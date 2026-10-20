import { expect, test, type Locator, type Page } from "@playwright/test";

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
      .locator(".sidebar-header")
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
    page.getByRole("heading", { name: "Risk trend", exact: true }),
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
  await page.goto("/");
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
  await expect(page.locator(".kpi-card").first()).toHaveCSS(
    "border-radius",
    "16px",
  );
  await expect(page.locator(".kpi-number").first()).toHaveCSS(
    "justify-content",
    "center",
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
    page.getByRole("heading", { name: "Risk trend", exact: true }),
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
    "rgb(30, 33, 37)",
  );
  await expect(
    page.getByRole("heading", { name: "Risk trend", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dark-overview.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: "Create issue", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveCSS("background-color", "rgb(30, 33, 37)");
  await expect(dialog.locator("textarea").first()).toHaveCSS("resize", "none");
  await dialog.getByRole("combobox", { name: "Priority", exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCSS(
    "background-color",
    "rgb(30, 33, 37)",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Due date", exact: true }).click();
  await expect(page.locator(".calendar-popover")).toHaveCSS(
    "background-color",
    "rgb(30, 33, 37)",
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
  if (
    await page.getByRole("button", { name: "Dismiss notification" }).isVisible()
  )
    await page.getByRole("button", { name: "Dismiss notification" }).click();
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
  if (
    await page.getByRole("button", { name: "Dismiss notification" }).isVisible()
  )
    await page.getByRole("button", { name: "Dismiss notification" }).click();
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
    page.getByRole("heading", { name: "Risk trend", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Refresh analytics", exact: true }),
  ).toBeEnabled();
  if (
    await page.getByRole("button", { name: "Dismiss notification" }).isVisible()
  )
    await page.getByRole("button", { name: "Dismiss notification" }).click();
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
  await page.goto("/");
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
  await expect(cell).toHaveCSS("color", "rgb(243, 217, 162)");
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
    "rgb(51, 56, 63)",
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
    page.getByRole("heading", { name: "Work by category", exact: true }),
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
    const badgeColor = await badge.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    await row.hover();
    const hover = theme === "Light" ? "rgb(231, 235, 240)" : "rgb(56, 63, 72)";
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
  if (
    await page.getByRole("button", { name: "Dismiss notification" }).isVisible()
  )
    await page.getByRole("button", { name: "Dismiss notification" }).click();
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
  await expect(completed).toHaveCSS("background-color", "rgb(51, 56, 63)");
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
    "rgb(30, 33, 37)",
  );
  await expect(page.locator(".period-metrics > div").first()).toHaveCSS(
    "border-radius",
    "16px",
  );
  const plot = page.locator(".analytics-grid .recharts-surface").first();
  await expect(plot).toHaveCSS("animation-name", "chart-data-reveal");
  await expect(
    page.locator(".project-chart .recharts-rectangle").first(),
  ).toHaveCSS("fill", "rgb(104, 117, 134)");
  await expect(page.locator(".search-launch kbd")).toHaveCount(0);
  const create = page.getByRole("button", { name: "New issue", exact: true });
  const top = await create.boundingBox();
  const header = await page.locator(".topbar").boundingBox();
  const toggle = page.getByRole("button", {
    name: "Collapse sidebar",
    exact: true,
  });
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
  await page
    .getByRole("button", { name: "Expand sidebar", exact: true })
    .click();
  await expect(page.locator(".sidebar")).toHaveCSS("width", "210px");
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
  await expect(critical).toHaveCSS("background-color", "rgb(54, 62, 72)");
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
    "rgb(48, 54, 62)",
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
