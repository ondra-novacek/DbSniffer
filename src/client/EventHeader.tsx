import type { AuditEventType } from "../shared/types.js";

interface EventHeaderProps {
  type: AuditEventType;
  table: string;
  changedAt: string;
}

const eventTypeLabels: Record<AuditEventType, string> = {
  insert: "INSERT",
  update: "UPDATE",
  delete: "DELETE",
};

export function formatEventTime(changedAt: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(changedAt));
}

export function EventHeader({
  type,
  table,
  changedAt,
}: EventHeaderProps) {
  return (
    <header className="event-header">
      <div className="event-title">
        <span className={`event-badge event-badge-${type}`}>
          {eventTypeLabels[type]}
        </span>
        <code className="event-table">{table}</code>
      </div>
      <time className="event-time" dateTime={changedAt} title={changedAt}>
        {formatEventTime(changedAt)}
      </time>
    </header>
  );
}
