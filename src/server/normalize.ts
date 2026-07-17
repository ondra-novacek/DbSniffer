import type { AuditEvent, ChangeDiff, RowData, RowValue } from "../shared/types.js";

export interface BinlogEvent {
  tableId?: number | string;
  tableMap?: Record<string | number, { parentSchema?: string; tableName?: string }>;
  rows?: unknown[];
  getEventName(): string;
}

interface UpdateRow {
  before: RowData;
  after: RowData;
}

function asRowData(row: unknown): RowData {
  return row && typeof row === "object" ? (row as RowData) : {};
}

function asUpdateRow(row: unknown): UpdateRow {
  const value = row && typeof row === "object" ? (row as Partial<UpdateRow>) : {};

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

export function normalizeBinlogEvent(
  event: BinlogEvent,
  watchDatabase: string,
): AuditEvent[] {
  const tableMap = event.tableId === undefined ? undefined : event.tableMap?.[event.tableId];
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

      return {
        type: "update",
        database,
        table,
        before: updateRow.before,
        after: updateRow.after,
        diff: diffRows(updateRow.before, updateRow.after),
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
