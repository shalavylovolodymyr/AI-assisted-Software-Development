import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { useWorkspace } from "./Workspace";
import type { User } from "./types";
import { AppearanceProvider } from "./components/appearance";

const people: User[] = [
  {
    id: "admin",
    full_name: "Emma Wilson",
    role: "ADMIN",
    email: "emma@example.test",
    avatar_color: "blue",
    created_at: "2026-01-01",
  },
  {
    id: "member",
    full_name: "Alex Chen",
    role: "MEMBER",
    email: "alex@example.test",
    avatar_color: "green",
    created_at: "2026-01-01",
  },
];
let usersLoading = false;
vi.mock("./api", () => ({
  useData: (path: string) => ({
    data:
      path === "/users"
        ? usersLoading
          ? undefined
          : people
        : path === "/config"
          ? { demo_mode: true, deletion: true }
          : [],
    isPending: path === "/users" && usersLoading,
    error: null,
    refetch: vi.fn(),
  }),
  useChange: () => ({ mutate: vi.fn(), reset: vi.fn() }),
}));
vi.mock("./pages/home", () => ({
  Home: () => {
    const { user } = useWorkspace();
    return <h1>{user?.full_name}'s workspace</h1>;
  },
}));

function mount() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <AppearanceProvider>
          <App />
        </AppearanceProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  usersLoading = false;
  localStorage.clear();
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe("Explicit demo sessions", () => {
  it("waits for a saved session before exposing welcome controls during reload", () => {
    localStorage.setItem("signal-session-user", "admin");
    usersLoading = true;
    mount();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading your workspace",
    );
    expect(
      screen.queryByRole("combobox", { name: "Appearance" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Welcome to Signal" }),
    ).not.toBeInTheDocument();
  });

  it("welcomes visitors even when a legacy actor was automatically saved", () => {
    localStorage.setItem("signal-user", "admin");
    mount();
    expect(
      screen.getByRole("heading", { name: "Welcome to Signal" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Log in" })).toBeDisabled();
    expect(
      screen.queryByRole("navigation", { name: "Workspace" }),
    ).not.toBeInTheDocument();
    expect(document.querySelector('input[type="password"]')).toBeNull();
  });

  it("logs in as the chosen user and restores only that explicit session on reload", async () => {
    const view = mount();
    await userEvent.click(
      screen.getByRole("combobox", { name: "Choose user" }),
    );
    await userEvent.click(screen.getByRole("option", { name: "Alex Chen" }));
    expect(
      screen.queryByRole("navigation", { name: "Workspace" }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(
      screen.getByRole("heading", { name: "Alex Chen's workspace" }),
    ).toBeVisible();
    expect(localStorage.getItem("signal-session-user")).toBe("member");
    view.unmount();
    mount();
    expect(
      screen.getByRole("heading", { name: "Alex Chen's workspace" }),
    ).toBeVisible();
  });

  it("logs out, clears the API actor and keeps appearance preferences", async () => {
    localStorage.setItem("signal-session-user", "admin");
    localStorage.setItem("signal-user", "admin");
    localStorage.setItem("signal-appearance", "dark");
    mount();
    await userEvent.click(screen.getByRole("button", { name: "New issue" }));
    expect(screen.getByRole("dialog")).toBeVisible();
    // Close the modal before using the sidebar, as a browser user would.
    await userEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    await userEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(
      screen.getByRole("heading", { name: "Welcome to Signal" }),
    ).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("signal-session-user")).toBeNull();
    expect(localStorage.getItem("signal-user")).toBeNull();
    expect(localStorage.getItem("signal-appearance")).toBe("dark");
  });

  it("does not substitute an administrator for an unknown saved session", () => {
    localStorage.setItem("signal-session-user", "missing-user");
    mount();
    expect(
      screen.getByRole("heading", { name: "Welcome to Signal" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("navigation", { name: "Workspace" }),
    ).not.toBeInTheDocument();
    expect(localStorage.getItem("signal-session-user")).toBeNull();
  });
});
