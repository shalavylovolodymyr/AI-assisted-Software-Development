import { act, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import {
  defaultPreferences,
  PreferencesProvider,
  readPreferences,
  usePreferences,
} from "./preferences";

it("recovers from invalid or stale saved preferences", () => {
  expect(readPreferences("{invalid")).toEqual(defaultPreferences);
  expect(
    readPreferences('{"density":"old","chartRange":"999","liveUpdates":false}'),
  ).toEqual({
    ...defaultPreferences,
    liveUpdates: false,
  });
});

it("applies preferences across pages and restores them after a reload", () => {
  localStorage.removeItem("signal-preferences");
  function Control() {
    const { preferences, updatePreferences } = usePreferences();
    return (
      <button
        onClick={() =>
          updatePreferences({
            density: "compact",
            motion: "reduced",
            chartRange: "90",
            liveUpdates: false,
          })
        }
      >
        {preferences.chartRange}
      </button>
    );
  }
  const view = render(
    <PreferencesProvider>
      <Control />
    </PreferencesProvider>,
  );
  act(() => screen.getByRole("button").click());
  expect(document.documentElement.dataset.density).toBe("compact");
  expect(document.documentElement.dataset.motion).toBe("reduced");
  view.unmount();
  render(
    <PreferencesProvider>
      <Control />
    </PreferencesProvider>,
  );
  expect(screen.getByRole("button")).toHaveTextContent("90");
  expect(
    readPreferences(localStorage.getItem("signal-preferences")).liveUpdates,
  ).toBe(false);
});
