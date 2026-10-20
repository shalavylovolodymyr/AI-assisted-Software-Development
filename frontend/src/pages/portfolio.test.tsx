import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./portfolio";

describe("Page toolbar", () => {
  it("keeps the current title and actions together when the page changes", () => {
    const page = (title: string, action?: string) => (
      <>
        <header>
          <div id="page-toolbar" />
        </header>
        <main>
          <PageHeader title={title}>
            {action && <button>{action}</button>}
          </PageHeader>
        </main>
      </>
    );
    const view = render(page("Issues", "Create issue"));
    const toolbar = within(screen.getByRole("banner"));
    expect(
      toolbar.getByRole("heading", { name: "Issues", level: 1 }),
    ).toBeVisible();
    expect(toolbar.getByRole("button", { name: "Create issue" })).toBeVisible();
    view.rerender(page("Activity"));
    expect(
      toolbar.getByRole("heading", { name: "Activity", level: 1 }),
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: "Create issue" }),
    ).not.toBeInTheDocument();
  });
});
