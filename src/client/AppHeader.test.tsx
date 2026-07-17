import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { AppHeader } from "./AppHeader.js";

describe("AppHeader", () => {
  test("renders the database name instead of title and subtitle", () => {
    const html = renderToStaticMarkup(
      <AppHeader database="levelworks_2026_07_17" status="connected" />,
    );

    expect(html).toContain("levelworks_2026_07_17");
    expect(html).toContain("Connected");
    expect(html).not.toContain("Local DB Change Feed");
    expect(html).not.toContain("Live row changes");
  });

  test("renders a waiting database label before the first event arrives", () => {
    const html = renderToStaticMarkup(
      <AppHeader database={null} status="connecting" />,
    );

    expect(html).toContain("Waiting for database");
    expect(html).toContain("Connecting...");
  });
});
