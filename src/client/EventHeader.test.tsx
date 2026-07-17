import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { EventHeader, formatEventTime } from "./EventHeader.js";

describe("formatEventTime", () => {
  test("formats ISO timestamps as readable local dates", () => {
    const formatted = formatEventTime("2026-07-17T14:54:39.000Z");

    expect(formatted).toContain("17 Jul 2026");
    expect(formatted).toContain("16:54:39");
  });
});

describe("EventHeader", () => {
  test("renders table name and event type without a per-card timestamp", () => {
    const html = renderToStaticMarkup(
      <EventHeader
        type="update"
        table="users"
      />,
    );

    expect(html).toContain("users");
    expect(html).toContain("UPDATE");
    expect(html).not.toContain("17 Jul 2026");
    expect(html).not.toContain("16:54:39");
    expect(html).not.toContain("<time");
    expect(html).not.toContain("levelworks_2026_07_17.users");
  });

  test("renders the row primary key when provided", () => {
    const html = renderToStaticMarkup(
      <EventHeader
        type="update"
        table="users"
        rowPrimaryKey={42}
      />,
    );

    expect(html).toContain("PK");
    expect(html).toContain("42");
  });
});
