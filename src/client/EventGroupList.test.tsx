import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type { AuditEvent } from "../shared/types.js";
import { EventGroupList } from "./EventGroupList.js";

function makeEvent(
  changedAt: string,
  table: string,
  name: string,
): AuditEvent {
  return {
    type: "update",
    database: "levelworks_2026_07_17",
    table,
    before: { id: 1, name: "Before" },
    after: { id: 1, name },
    diff: { name: { from: "Before", to: name } },
    changedAt,
  };
}

describe("EventGroupList", () => {
  test("renders grouped event summaries and the existing event details", () => {
    const html = renderToStaticMarkup(
      <EventGroupList
        events={[
          makeEvent("2026-07-17T12:00:00.300Z", "users", "Grace"),
          makeEvent("2026-07-17T12:00:00.000Z", "orders", "Ada"),
        ]}
      />,
    );

    expect(html).toContain("2 changes");
    expect(html).toContain("users");
    expect(html).toContain("orders");
    expect(html).toContain("UPDATE");
    expect(html).toContain("&quot;Grace&quot;");
    expect(html).toContain("&quot;Ada&quot;");
  });

  test("renders row primary keys for update and delete event headers", () => {
    const html = renderToStaticMarkup(
      <EventGroupList
        events={[
          makeEvent("2026-07-17T12:00:00.300Z", "users", "Grace"),
          {
            type: "delete",
            database: "levelworks_2026_07_17",
            table: "orders",
            before: { id: 9, status: "open" },
            after: null,
            diff: { id: 9, status: "open" },
            changedAt: "2026-07-17T12:00:00.000Z",
          },
        ]}
      />,
    );

    expect(html).toContain("PK");
    expect(html).toContain("1");
    expect(html).toContain("9");
  });

  test("shows only the group start time and no per-card dates", () => {
    const html = renderToStaticMarkup(
      <EventGroupList
        events={[
          makeEvent("2026-07-17T12:00:00.300Z", "users", "Grace"),
          makeEvent("2026-07-17T12:00:00.000Z", "orders", "Ada"),
        ]}
      />,
    );

    expect(html).toContain("14:00:00");
    expect(html).toContain('dateTime="2026-07-17T12:00:00.000Z"');
    expect(html).not.toContain("17 Jul 2026");
    expect(html).not.toContain("14:00:00.300");
  });
});
