import { describe, expect, test } from "vitest";
import { normalizeBinlogEvent } from "./normalize.js";

const watchDatabase = "levelworks_2026_06_10";

function makeEvent(eventName: string, rows: unknown[], database = watchDatabase) {
  return {
    tableId: 42,
    tableMap: {
      42: {
        parentSchema: database,
        tableName: "users",
      },
    },
    rows,
    getEventName: () => eventName,
  };
}

describe("normalizeBinlogEvent", () => {
  test("normalizes inserted rows", () => {
    const [event] = normalizeBinlogEvent(
      makeEvent("writerows", [{ id: 1, name: "Ada" }]),
      watchDatabase,
    );

    expect(event).toMatchObject({
      type: "insert",
      database: watchDatabase,
      table: "users",
      before: null,
      after: { id: 1, name: "Ada" },
      diff: { id: 1, name: "Ada" },
    });
    expect(event?.changedAt).toEqual(expect.any(String));
  });

  test("normalizes updated rows with changed fields only", () => {
    const [event] = normalizeBinlogEvent(
      makeEvent("updaterows", [
        {
          before: { id: 1, name: "Ada", active: true },
          after: { id: 1, name: "Grace", active: true },
        },
      ]),
      watchDatabase,
    );

    expect(event).toMatchObject({
      type: "update",
      before: { id: 1, name: "Ada", active: true },
      after: { id: 1, name: "Grace", active: true },
      diff: {
        name: {
          from: "Ada",
          to: "Grace",
        },
      },
    });
  });

  test("shows only appended events in updated row diffs", () => {
    const [event] = normalizeBinlogEvent(
      makeEvent("updaterows", [
        {
          before: {
            id: 1,
            name: "Ada",
            events: [{ type: "UserCreated" }],
            "évents": [{ type: "LegacyUserCreated" }],
          },
          after: {
            id: 1,
            name: "Grace",
            events: [{ type: "UserCreated" }, { type: "UserRenamed" }],
            "évents": [{ type: "LegacyUserCreated" }, { type: "LegacyUserRenamed" }],
          },
        },
      ]),
      watchDatabase,
    );

    expect(event).toMatchObject({
      type: "update",
      before: { id: 1, name: "Ada" },
      after: { id: 1, name: "Grace" },
      diff: {
        name: {
          from: "Ada",
          to: "Grace",
        },
        events: [{ type: "UserRenamed" }],
      },
    });
    expect(event?.before).not.toHaveProperty("events");
    expect(event?.before).not.toHaveProperty("évents");
    expect(event?.after).not.toHaveProperty("events");
    expect(event?.after).not.toHaveProperty("évents");
    expect(event?.diff).toHaveProperty("events");
    expect(event?.diff).not.toHaveProperty("évents");
  });

  test("parses appended events from json string columns", () => {
    const [event] = normalizeBinlogEvent(
      makeEvent("updaterows", [
        {
          before: {
            id: 1,
            events: JSON.stringify([{ type: "UserCreated" }]),
          },
          after: {
            id: 1,
            events: JSON.stringify([
              { type: "UserCreated" },
              { type: "UserRenamed", payload: { name: "Grace" } },
            ]),
          },
        },
      ]),
      watchDatabase,
    );

    expect(event?.diff).toMatchObject({
      events: [{ type: "UserRenamed", payload: { name: "Grace" } }],
    });
  });

  test("normalizes deleted rows", () => {
    const [event] = normalizeBinlogEvent(
      makeEvent("deleterows", [{ id: 1, name: "Ada" }]),
      watchDatabase,
    );

    expect(event).toMatchObject({
      type: "delete",
      before: { id: 1, name: "Ada" },
      after: null,
      diff: { id: 1, name: "Ada" },
    });
  });

  test("ignores events from other databases", () => {
    const events = normalizeBinlogEvent(
      makeEvent("writerows", [{ id: 1 }], "other_database"),
      watchDatabase,
    );

    expect(events).toEqual([]);
  });
});
