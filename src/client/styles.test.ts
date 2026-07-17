import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

describe("client styles", () => {
  test("uses a light theme instead of the old dark blue palette", () => {
    expect(styles).toContain("background: #f6f7fb;");
    expect(styles).toContain("color: #1f2937;");
    expect(styles).toContain("background: #ffffff;");

    expect(styles).not.toContain("linear-gradient");
    expect(styles).not.toContain("#030712");
    expect(styles).not.toContain("#0b1020");
    expect(styles).not.toContain("#0f172a");
  });
});
