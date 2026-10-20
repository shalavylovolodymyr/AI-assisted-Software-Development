import { act, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AppearanceProvider, ThemeControl } from "./appearance";

afterEach(() => vi.unstubAllGlobals());

it("keeps following system appearance after the Settings control unmounts", () => {
  let dark = false;
  const listeners = new Set<() => void>();
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return dark;
    },
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  }));
  localStorage.setItem("signal-appearance", "system");
  const view = render(
    <AppearanceProvider>
      <ThemeControl />
    </AppearanceProvider>,
  );
  expect(document.documentElement.dataset.theme).toBe("light");
  view.rerender(
    <AppearanceProvider>
      <div>Activity</div>
    </AppearanceProvider>,
  );
  act(() => {
    dark = true;
    listeners.forEach((listener) => listener());
  });
  expect(document.documentElement.dataset.theme).toBe("dark");
  act(() => {
    dark = false;
    listeners.forEach((listener) => listener());
  });
  expect(document.documentElement.dataset.theme).toBe("light");
});
