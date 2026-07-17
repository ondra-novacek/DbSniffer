export type AuditEventType = "insert" | "update" | "delete";

export type RowValue = unknown;

export type RowData = Record<string, RowValue>;

export type ChangeDiff = Record<
  string,
  RowValue | {
    from: RowValue;
    to: RowValue;
  }
>;

export interface AuditEvent {
  type: AuditEventType;
  database: string;
  table: string;
  before: RowData | null;
  after: RowData | null;
  diff: ChangeDiff;
  changedAt: string;
}
