import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { DiffView } from "./DiffView.js";

describe("DiffView", () => {
  test("renders update diffs as changed fields with before and after values", () => {
    const html = renderToStaticMarkup(
      <DiffView
        type="update"
        diff={{
          name: { from: "Ada", to: "Grace" },
          active: { from: true, to: false },
        }}
      />,
    );

    expect(html).toContain("Field");
    expect(html).toContain("Before");
    expect(html).toContain("After");
    expect(html).toContain("name");
    expect(html).toContain("&quot;Ada&quot;");
    expect(html).toContain("&quot;Grace&quot;");
    expect(html).toContain("active");
    expect(html).toContain("true");
    expect(html).toContain("false");
  });

  test("renders insert diffs as added field values", () => {
    const html = renderToStaticMarkup(
      <DiffView type="insert" diff={{ id: 1, name: "Ada" }} />,
    );

    expect(html).toContain("Added");
    expect(html).toContain("id");
    expect(html).toContain("1");
    expect(html).toContain("name");
    expect(html).toContain("&quot;Ada&quot;");
    expect(html).not.toContain("Before");
  });

  test("renders delete diffs as removed field values", () => {
    const html = renderToStaticMarkup(
      <DiffView type="delete" diff={{ id: 1, name: "Ada" }} />,
    );

    expect(html).toContain("Removed");
    expect(html).toContain("id");
    expect(html).toContain("1");
    expect(html).toContain("name");
    expect(html).toContain("&quot;Ada&quot;");
    expect(html).not.toContain("After");
  });

  test("renders append-only update diffs as added values", () => {
    const html = renderToStaticMarkup(
      <DiffView
        type="update"
        diff={{ events: [{ type: "UserRenamed", payload: { name: "Grace" } }] }}
      />,
    );

    expect(html).toContain("Added");
    expect(html).toContain("events");
    expect(html).toContain("UserRenamed");
    expect(html).toContain("Grace");
  });

  test("renders mixed update diffs with appended values on the after side", () => {
    const html = renderToStaticMarkup(
      <DiffView
        type="update"
        diff={{
          name: { from: "Ada", to: "Grace" },
          events: [{ type: "UserRenamed" }],
        }}
      />,
    );

    expect(html).toContain("Before");
    expect(html).toContain("After");
    expect(html).toContain("diff-value-empty");
    expect(html).toContain("UserRenamed");
  });

  test("renders review diff markers for removed and added values", () => {
    const html = renderToStaticMarkup(
      <DiffView type="update" diff={{ name: { from: "Ada", to: "Grace" } }} />,
    );

    expect(html).toContain('class="diff-marker"');
    expect(html).toContain("aria-hidden=\"true\">-</span>");
    expect(html).toContain("aria-hidden=\"true\">+</span>");
    expect(html).toContain('class="diff-value-content"');
  });
});
