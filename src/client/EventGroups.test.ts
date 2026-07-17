import { describe, expect, test } from "vitest";
import type { AuditEvent } from "../shared/types.js";
import { groupEventsByTime } from "./EventGroups.js";

function makeEvent(changedAt: string, table = "users"): AuditEvent {
  return {
    type: "update",
    database: "levelworks_2026_07_17",
    table,
    before: { id: 1 },
    after: { id: 1 },
    diff: {},
    changedAt,
  };
}

describe("groupEventsByTime", () => {
  test("returns no groups for an empty event list", () => {
    expect(groupEventsByTime([])).toEqual([]);
  });

  test("groups consecutive events with the same timestamp", () => {
    const events = [
      makeEvent("2026-07-17T12:00:00.000Z", "users"),
      makeEvent("2026-07-17T12:00:00.000Z", "orders"),
    ];

    expect(groupEventsByTime(events)).toMatchObject([
      {
        events,
        tables: ["users", "orders"],
      },
    ]);
  });

  test("groups consecutive events within the threshold", () => {
    const events = [
      makeEvent("2026-07-17T12:00:00.500Z"),
      makeEvent("2026-07-17T12:00:00.100Z"),
      makeEvent("2026-07-17T12:00:00.000Z"),
    ];

    expect(groupEventsByTime(events, 500)).toHaveLength(1);
  });

  test("splits events outside the threshold", () => {
    const events = [
      makeEvent("2026-07-17T12:00:01.000Z"),
      makeEvent("2026-07-17T12:00:00.499Z"),
    ];

    expect(groupEventsByTime(events, 500)).toHaveLength(2);
  });

  test("invalid timestamps break groups instead of throwing", () => {
    const events = [
      makeEvent("2026-07-17T12:00:00.200Z"),
      makeEvent("not-a-date"),
      makeEvent("2026-07-17T12:00:00.000Z"),
    ];

    expect(groupEventsByTime(events, 500)).toHaveLength(3);
  });
});
