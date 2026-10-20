import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Issues } from "./issues";

afterEach(() => vi.restoreAllMocks());
describe("Issue filters", () => {
  it("sends search and status to the backend and resets pagination", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(
        async () =>
          new Response(
            JSON.stringify({ items: [], total: 0, page: 1, page_size: 10 }),
          ),
      );
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <MemoryRouter initialEntries={["/issues?page=2"]}>
          <Issues onCreate={() => {}} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await userEvent.click(
      screen.getByRole("combobox", { name: "Filter status" }),
    );
    await userEvent.click(screen.getByRole("option", { name: "In progress" }));
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([url]) =>
            String(url).includes("status=IN_PROGRESS") &&
            !String(url).includes("page=2"),
        ),
      ).toBe(true),
    );
    await userEvent.type(screen.getByLabelText("Search issues"), "access");
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([url]) =>
          String(url).includes("search=access"),
        ),
      ).toBe(true),
    );
  });
});
