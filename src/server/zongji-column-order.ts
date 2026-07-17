interface TableMapEventInfo {
  tableId: string | number;
  schemaName: string;
  tableName: string;
}

interface QueryConnection {
  query(
    sql: string,
    values: string[],
    callback: (err: Error | null, rows: unknown[]) => void,
  ): void;
}

interface ZongJiInstance {
  ctrlConnection: QueryConnection;
  tableMap: Record<string | number, unknown>;
  emit(eventName: "error", error: Error): void;
}

interface ZongJiConstructor {
  prototype: object;
}

const tableInfoQuery = [
  "SELECT COLUMN_NAME, COLLATION_NAME, CHARACTER_SET_NAME, COLUMN_COMMENT, COLUMN_TYPE",
  "FROM information_schema.columns",
  "WHERE table_schema=? AND table_name=?",
  "ORDER BY ORDINAL_POSITION",
].join(" ");

export function applyZongJiColumnOrderingPatch(ZongJi: ZongJiConstructor) {
  const prototype = ZongJi.prototype as {
    _fetchTableInfo?: (
      this: ZongJiInstance,
      tableMapEvent: TableMapEventInfo,
      next: () => void,
    ) => void;
    __dbSnifferColumnOrderingPatchApplied?: boolean;
  };

  if (prototype.__dbSnifferColumnOrderingPatchApplied) {
    return;
  }

  prototype._fetchTableInfo = function fetchTableInfoInColumnOrder(
    this: ZongJiInstance,
    tableMapEvent: TableMapEventInfo,
    next: () => void,
  ) {
    this.ctrlConnection.query(
      tableInfoQuery,
      [tableMapEvent.schemaName, tableMapEvent.tableName],
      (err, rows) => {
        if (err) {
          this.emit("error", err);
          return;
        }

        if (rows.length === 0) {
          this.emit(
            "error",
            new Error(
              `Insufficient permissions to access: ${tableMapEvent.schemaName}.${tableMapEvent.tableName}`,
            ),
          );
          return;
        }

        this.tableMap[tableMapEvent.tableId] = {
          columnSchemas: rows,
          parentSchema: tableMapEvent.schemaName,
          tableName: tableMapEvent.tableName,
        };

        next();
      },
    );
  };

  prototype.__dbSnifferColumnOrderingPatchApplied = true;
}
