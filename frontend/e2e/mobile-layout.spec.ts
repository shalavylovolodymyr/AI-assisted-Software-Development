import { expect, test, type Locator, type Page } from "@playwright/test";
import type { Issue, Page as DataPage, User } from "../src/types";

test.use({ isMobile: true, hasTouch: true, deviceScaleFactor: 3 });

test.beforeEach(async ({ page, request }) => {
  const users: User[] = await (await request.get("/api/v1/users")).json();
  await page.addInitScript(
    (id) => {
      localStorage.setItem("signal-session-user", id);
    },
    users.find((user) => user.role === "ADMIN")!.id,
  );
});

async function issueId(page: Page) {
  const issues: DataPage<Issue> = await (
    await page.request.get("/api/v1/issues?status=OPEN&page_size=100")
  ).json();
  return issues.items.sort((a, b) => b.title.length - a.title.length)[0].id;
}

async function expectStableViewport(page: Page, width: number) {
  await expect
    .poll(() =>
      page.evaluate(() => ({
        layout: innerWidth,
        content: document.documentElement.scrollWidth,
        visual: Math.round(visualViewport!.width),
        scale: visualViewport!.scale,
      })),
    )
    .toEqual({ layout: width, content: width, visual: width, scale: 1 });
}

async function expectInputSize(field: Locator) {
  await expect(field).toHaveCSS("font-size", "16px");
  await field.focus();
  await expect(field).toHaveCSS("font-size", "16px");
}

test("Mobile issue actions fit without expanding the viewport and Delete opens its confirmation", async ({
  page,
}) => {
  test.setTimeout(60000);
  const id = await issueId(page);
  await page.goto("/");
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (value) => localStorage.setItem("signal-appearance", value),
      theme,
    );
    for (const width of [320, 375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/issues/${id}`);
      const remove = page.getByRole("button", {
        name: "Delete issue",
        exact: true,
      });
      await expect(remove).toBeVisible();
      await expectStableViewport(page, width);
      for (const button of [
        remove,
        page.getByRole("button", { name: "Edit issue", exact: true }),
        page.getByRole("button", { name: "Export to Excel", exact: true }),
      ])
        await expect(button).toBeInViewport({ ratio: 1 });
      await remove.click();
      const dialog = page.getByRole("dialog", {
        name: "Delete issue?",
        exact: true,
      });
      await expect(
        dialog.getByRole("button", { name: "Delete", exact: true }),
      ).toBeInViewport({ ratio: 1 });
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(dialog).toBeHidden();
      if (width === 375)
        await page.screenshot({
          path: `../docs/screenshots/mobile-issue-actions-${theme}.png`,
        });
    }
  }
});

test("Mobile exposure sectors fit their SVG and square navigation follows the visible viewport height", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/");
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (value) => localStorage.setItem("signal-appearance", value),
      theme,
    );
    for (const width of [320, 375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      const panel = page.locator(".distribution-panel");
      await expect(panel.locator(".recharts-pie-sector")).toHaveCount(4);
      await expectStableViewport(page, width);
      await expect
        .poll(() =>
          panel.evaluate((element) => {
            const svg = element
              .querySelector(".recharts-surface")!
              .getBoundingClientRect();
            return [...element.querySelectorAll(".recharts-pie-sector")].every(
              (sector) => {
                const box = sector.getBoundingClientRect();
                return (
                  box.width > 0 &&
                  box.left >= svg.left + 2 &&
                  box.right <= svg.right - 2 &&
                  box.top >= svg.top + 2 &&
                  box.bottom <= svg.bottom - 2
                );
              },
            );
          }),
        )
        .toBe(true);
      if (width === 375)
        await panel.screenshot({
          path: `../docs/screenshots/mobile-exposure-${theme}.png`,
        });
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
      const drawer = page.getByRole("dialog", {
        name: "Navigation",
        exact: true,
      });
      await expect(drawer).toHaveCSS("border-radius", "0px");
      await expect(page.locator(".drawer-scrim")).toHaveCSS(
        "border-radius",
        "0px",
      );
      for (const row of await drawer
        .locator(".sidebar-item:visible, nav a, .account-control")
        .all())
        await expect(row).toHaveCSS("border-radius", "0px");
      for (const height of [844, 667, 568]) {
        await page.setViewportSize({ width, height });
        await expect
          .poll(() =>
            drawer.evaluate((element) => {
              const box = element.getBoundingClientRect();
              return {
                top: Math.round(box.top),
                bottom: Math.round(box.bottom),
                height: Math.round(box.height),
                viewport: Math.round(visualViewport!.height),
              };
            }),
          )
          .toEqual({ top: 0, bottom: height, height, viewport: height });
        await expect(
          drawer.getByRole("button", { name: "Log out", exact: true }),
        ).toBeInViewport({ ratio: 1 });
      }
      if (width === 375)
        await page.screenshot({
          path: `../docs/screenshots/mobile-square-drawer-${theme}.png`,
        });
      await drawer
        .getByRole("button", { name: "Close navigation", exact: true })
        .click();
      await expect(drawer).toBeHidden();
    }
  }
});

test("Mobile search, forms and discussion keep readable input sizing and a stable focus scale", async ({
  page,
}) => {
  const id = await issueId(page);
  const width = 375;
  await page.setViewportSize({ width, height: 812 });
  await page.goto("/issues");
  await expectInputSize(
    page.getByRole("textbox", { name: "Search issues", exact: true }),
  );
  await expectStableViewport(page, width);
  await page.goto(`/issues/${id}`);
  await expectInputSize(
    page.getByRole("textbox", { name: "Add a comment", exact: true }),
  );
  await expectStableViewport(page, width);
  await page.getByRole("button", { name: "Assess risk", exact: true }).click();
  const assessment = page.getByRole("dialog");
  await expectInputSize(
    assessment.getByRole("textbox", { name: "Rationale", exact: true }),
  );
  await expectStableViewport(page, width);
  await assessment
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Search workspace", exact: true })
    .click();
  const search = page.getByRole("dialog", {
    name: "Search workspace",
    exact: true,
  });
  await expectInputSize(
    search.getByRole("combobox", { name: "Search issues", exact: true }),
  );
  await expectStableViewport(page, width);
  await search
    .getByRole("button", { name: "Close search", exact: true })
    .click();
  await page.getByRole("button", { name: "New issue", exact: true }).click();
  const form = page.getByRole("dialog", {
    name: "Create an issue",
    exact: true,
  });
  for (const field of await form
    .locator("input:not([type=hidden]), textarea")
    .all())
    await expectInputSize(field);
  await expectStableViewport(page, width);
  await form.getByRole("textbox", { name: "Description", exact: true }).focus();
  await page.screenshot({ path: "../docs/screenshots/mobile-input-focus.png" });
  await form.getByRole("button", { name: "Close dialog", exact: true }).click();
});
