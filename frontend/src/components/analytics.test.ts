import { describe, expect, it } from "vitest";
import { weekly } from "./analytics";
import type { TrendDay } from "../types";

describe("Chart totals", () => {
  it("keeps partial weeks and preserves all recorded counts", () => {
    const days: TrendDay[] = Array.from({ length: 10 }, (_, index) => ({
      date: `2026-10-${String(index + 1).padStart(2, "0")}`,
      created: index + 1,
      resolved: 1,
      events: 3,
      active: 10,
      average_risk: 4,
      completed_actions: index % 3,
    }));
    const buckets = weekly(days);
    expect(buckets).toEqual([
      {
        date: "2026-10-01",
        created: 28,
        resolved: 7,
        events: 21,
        completed_actions: 6,
      },
      {
        date: "2026-10-08",
        created: 27,
        resolved: 3,
        events: 9,
        completed_actions: 3,
      },
    ]);
    expect(weekly([])).toEqual([]);
  });
});
