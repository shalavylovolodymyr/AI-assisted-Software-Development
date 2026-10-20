import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, RiskScore, State } from "./ui";

describe("Workspace feedback", () => {
  it("renders risk scores with an accessible severity description", () => {
    render(<RiskScore score={20} severity="CRITICAL" />);
    expect(screen.getByLabelText("Risk 20, Critical")).toHaveTextContent(
      "20/25",
    );
  });
  it("shows a readable workflow status", () => {
    render(<Badge value="IN_PROGRESS" />);
    expect(screen.getByText("In progress")).toHaveClass("in_progress");
  });
  it("announces loading without displaying stale children", () => {
    render(
      <State loading>
        <span>Details</span>
      </State>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading your workspace",
    );
    expect(screen.queryByText("Details")).not.toBeInTheDocument();
  });
  it("shows actionable server errors", () => {
    render(<State error={new Error("Database unavailable")} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Database unavailable");
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });
});
