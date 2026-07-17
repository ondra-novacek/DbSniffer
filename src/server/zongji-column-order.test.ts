import { describe, expect, test, vi } from "vitest";
import { applyZongJiColumnOrderingPatch } from "./zongji-column-order.js";

describe("applyZongJiColumnOrderingPatch", () => {
  test("fetches table column metadata in ordinal position order", () => {
    interface PatchedFakeZongJi extends FakeZongJi {
      _fetchTableInfo(
        tableMapEvent: { tableId: number; schemaName: string; tableName: string },
        next: () => void,
      ): void;
    }

    class FakeZongJi {
      ctrlConnection = {
        query: vi.fn(
          (
            _sql: string,
            _values: string[],
            callback: (err: Error | null, rows: unknown[]) => void,
          ) => {
            callback(null, [{ COLUMN_NAME: "id" }]);
          },
        ),
      };
      tableMap: Record<string, unknown> = {};
      emit = vi.fn();
    }

    applyZongJiColumnOrderingPatch(FakeZongJi);

    const zongji = new FakeZongJi() as PatchedFakeZongJi;
    const next = vi.fn();

    zongji._fetchTableInfo(
      { tableId: 42, schemaName: "app", tableName: "shift" },
      next,
    );

    expect(zongji.ctrlConnection.query).toHaveBeenCalledWith(
      expect.stringContaining("ORDER BY ORDINAL_POSITION"),
      ["app", "shift"],
      expect.any(Function),
    );
    expect(zongji.tableMap[42]).toEqual({
      columnSchemas: [{ COLUMN_NAME: "id" }],
      parentSchema: "app",
      tableName: "shift",
    });
    expect(next).toHaveBeenCalledOnce();
  });
});
