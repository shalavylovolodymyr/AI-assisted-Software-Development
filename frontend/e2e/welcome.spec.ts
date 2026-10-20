import { expect, test, type Page } from "@playwright/test";
import type { User } from "../src/types";

async function logIn(page: Page, name: string) {
  await page
    .getByRole("combobox", { name: "Choose user", exact: true })
    .click();
  await page.getByRole("option", { name, exact: true }).click();
  await page.getByRole("button", { name: "Log in", exact: true }).click();
}

test("Welcome requires an explicit user, preserves deep links and supports persistent login and logout", async ({
  page,
  request,
}) => {
  const users: User[] = await (await request.get("/api/v1/users")).json();
  const admin = users.find((user) => user.role === "ADMIN")!;
  await page.addInitScript(
    (id) => localStorage.setItem("signal-user", id),
    admin.id,
  );
  await page.goto("/charts");
  await expect(
    page.getByRole("heading", { name: "Welcome to Signal", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Log in", exact: true }),
  ).toBeDisabled();
  await expect(page.locator("input[type=password]")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Workspace" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("combobox", { name: "Choose user" }),
  ).toBeEnabled();
  await page.getByRole("combobox", { name: "Appearance", exact: true }).click();
  await page.getByRole("option", { name: "Light", exact: true }).click();
  await expect(page.locator(".welcome-brand-mark")).toHaveCSS(
    "background-color",
    "rgb(45, 48, 53)",
  );
  await expect(page.locator(".welcome-brand-mark svg")).toHaveCSS(
    "stroke",
    "rgb(255, 255, 255)",
  );
  await expect(page.locator(".welcome-brand")).toHaveCSS(
    "color",
    "rgb(38, 40, 45)",
  );
  await page.screenshot({
    path: "../docs/screenshots/welcome-light.png",
    fullPage: true,
  });
  await page.getByRole("combobox", { name: "Appearance", exact: true }).click();
  await page.getByRole("option", { name: "Dark", exact: true }).click();
  await expect(page.locator(".welcome-brand")).toHaveCSS(
    "color",
    "rgb(231, 232, 235)",
  );
  await expect(page.locator(".welcome-brand-mark")).toHaveCSS(
    "background-color",
    "rgb(217, 221, 227)",
  );
  await expect(page.locator(".welcome-brand-mark svg")).toHaveCSS(
    "stroke",
    "rgb(32, 35, 41)",
  );
  await page.screenshot({
    path: "../docs/screenshots/welcome-dark.png",
    fullPage: true,
  });
  await logIn(page, admin.full_name);
  await expect(page).toHaveURL(/\/charts$/);
  await expect(
    page.getByRole("heading", { name: "Charts", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("navigation", { name: "Workspace" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("signal-session-user")),
  ).toBe(admin.id);
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("link", { name: "Issues", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Collapse sidebar", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Log out", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Welcome to Signal" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("signal-session-user")),
  ).toBeNull();
  expect(
    await page.evaluate(() => localStorage.getItem("signal-user")),
  ).toBeNull();
  expect(
    await page.evaluate(() => localStorage.getItem("signal-appearance")),
  ).toBe("dark");
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Welcome to Signal" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Workspace" })).toHaveCount(
    0,
  );
});

test("Mobile users can log in and out through the drawer without losing theme or leaving scroll locked", async ({
  page,
  request,
}) => {
  const users: User[] = await (await request.get("/api/v1/users")).json();
  const member = users.find((user) => user.role === "MEMBER")!;
  await page.emulateMedia({ colorScheme: "dark" });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/issues");
    await expect(
      page.getByRole("heading", { name: "Welcome to Signal" }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Choose user", exact: true }),
    ).toBeEnabled();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `../docs/screenshots/welcome-mobile-${width}.png`,
      fullPage: true,
    });
    await logIn(page, member.full_name);
    await expect(
      page.getByRole("heading", { name: "Issues", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
    const drawer = page.getByRole("dialog", {
      name: "Navigation",
      exact: true,
    });
    await expect(
      drawer.getByRole("combobox", { name: "Demo user" }),
    ).toContainText(member.full_name);
    await drawer.getByRole("button", { name: "Log out", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Welcome to Signal" }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(
      await page.locator("body").evaluate((element) => element.style.overflow),
    ).not.toBe("hidden");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  }
});

test("Invalid sessions return to welcome and logout also updates an already open tab", async ({
  page,
  context,
  request,
}) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("visited")) {
      localStorage.setItem("signal-session-user", "unknown-user");
      sessionStorage.setItem("visited", "true");
    }
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Welcome to Signal" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("signal-session-user")),
    )
    .toBeNull();
  const users: User[] = await (await request.get("/api/v1/users")).json();
  await logIn(page, users.find((user) => user.role === "ADMIN")!.full_name);
  const other = await context.newPage();
  await other.goto("/issues");
  await expect(
    other.getByRole("heading", { name: "Issues", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(
    other.getByRole("heading", { name: "Welcome to Signal" }),
  ).toBeVisible();
  await expect(
    other.getByRole("navigation", { name: "Workspace" }),
  ).toHaveCount(0);
});
