import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { IssueForm, issueSchema } from "./forms";

describe("Issue validation", () => {
  it("rejects blank titles and invalid risk scores", () => {
    expect(
      issueSchema.safeParse({ title: " ", likelihood: 6, impact: 0 }).success,
    ).toBe(false);
  });
  it("displays field errors before submitting an empty form", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <IssueForm onClose={() => {}} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Create issue" }));
    expect(await screen.findByText("Enter an issue title.")).toBeVisible();
    expect(screen.getByText("Describe the issue.")).toBeVisible();
    expect(screen.getByText("Explain the risk evaluation.")).toBeVisible();
  });
  it("previews selected risk ratings without claiming server confirmation", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <IssueForm onClose={() => {}} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await userEvent.click(screen.getByRole("combobox", { name: "Likelihood" }));
    await userEvent.click(
      screen.getByRole("option", { name: "5 · Almost certain" }),
    );
    expect(
      screen.getByText("Critical", { selector: ".risk-preview span" }),
    ).toBeVisible();
    expect(screen.getByText("Estimated risk")).toBeVisible();
  });
});
