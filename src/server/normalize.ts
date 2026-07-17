import type {
  AuditEvent,
  ChangeDiff,
  RowData,
  RowValue,
} from "../shared/types.js";

export interface BinlogEvent {
  tableId?: number | string;
  tableMap?: Record<
    string | number,
    { parentSchema?: string; tableName?: string }
  >;
  rows?: unknown[];
  getEventName(): string;
}

interface UpdateRow {
  before: RowData;
  after: RowData;
}

const ignoredColumns = new Set(["events", "évents"]);
const appendOnlyColumns = new Set(["events"]);

function asRowData(row: unknown): RowData {
  if (!row || typeof row !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(row as RowData).filter(([key]) => !ignoredColumns.has(key)),
  );
}

function asUpdateRow(row: unknown): UpdateRow {
  const value =
    row && typeof row === "object" ? (row as Partial<UpdateRow>) : {};

  return {
    before: asRowData(value.before),
    after: asRowData(value.after),
  };
}

function diffRows(before: RowData, after: RowData): ChangeDiff {
  const diff: ChangeDiff = {};

  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = {
        from: before[key] as RowValue,
        to: after[key] as RowValue,
      };
    }
  }

  return diff;
}

function getAppendedValues(
  before: RowData,
  after: RowData,
  column: string,
): RowValue[] {
  const beforeValues = asArrayValue(before[column]);
  const afterValues = asArrayValue(after[column]);

  if (!afterValues) {
    return [];
  }

  return afterValues.slice(beforeValues ? beforeValues.length : 0);
}

function asArrayValue(value: RowValue): RowValue[] | null {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function diffAppendOnlyColumns(before: RowData, after: RowData): ChangeDiff {
  const diff: ChangeDiff = {};

  for (const column of appendOnlyColumns) {
    const appendedValues = getAppendedValues(before, after, column);

    if (appendedValues.length > 0) {
      diff[column] = appendedValues;
    }
  }

  return diff;
}

export function normalizeBinlogEvent(
  event: BinlogEvent,
  watchDatabase: string,
): AuditEvent[] {
  const tableMap =
    event.tableId === undefined ? undefined : event.tableMap?.[event.tableId];
  const database = tableMap?.parentSchema;
  const table = tableMap?.tableName;

  if (database !== watchDatabase || !table) {
    return [];
  }

  const rows = event.rows ?? [];
  const changedAt = new Date().toISOString();

  if (event.getEventName() === "writerows") {
    return rows.map((row) => {
      const after = asRowData(row);

      return {
        type: "insert",
        database,
        table,
        before: null,
        after,
        diff: after,
        changedAt,
      };
    });
  }

  if (event.getEventName() === "updaterows") {
    return rows.map((row) => {
      const updateRow = asUpdateRow(row);
      const rawUpdateRow =
        row && typeof row === "object" ? (row as Partial<UpdateRow>) : {};
      const appendOnlyDiff = diffAppendOnlyColumns(
        (rawUpdateRow.before ?? {}) as RowData,
        (rawUpdateRow.after ?? {}) as RowData,
      );

      return {
        type: "update",
        database,
        table,
        before: updateRow.before,
        after: updateRow.after,
        diff: {
          ...diffRows(updateRow.before, updateRow.after),
          ...appendOnlyDiff,
        },
        changedAt,
      };
    });
  }

  if (event.getEventName() === "deleterows") {
    return rows.map((row) => {
      const before = asRowData(row);

      return {
        type: "delete",
        database,
        table,
        before,
        after: null,
        diff: before,
        changedAt,
      };
    });
  }

  return [];
}
