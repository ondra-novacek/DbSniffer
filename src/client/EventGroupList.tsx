import type { AuditEvent, RowValue } from "../shared/types.js";
import { DiffView } from "./DiffView.js";
import { EventHeader } from "./EventHeader.js";
import { groupEventsByTime } from "./EventGroups.js";

interface EventGroupListProps {
  events: AuditEvent[];
}

function formatGroupStartTime(changedAt: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(changedAt));
}

function getRowPrimaryKey(event: AuditEvent): RowValue | undefined {
  if (event.type === "insert") {
    return undefined;
  }

  const row = event.before ?? event.after;

  return row?.rowprimarykey ?? row?.rowPrimaryKey ?? row?.id;
}

export function EventGroupList({ events }: EventGroupListProps) {
  const groups = groupEventsByTime(events);

  return (
    <>
      {groups.map((group) => (
        <section className="event-group" key={group.id}>
          <header className="event-group-header">
            <div className="event-group-summary">
              <span className="event-group-count">
                {group.events.length}{" "}
                {group.events.length === 1 ? "change" : "changes"}
              </span>
              <span className="event-group-tables">
                {group.tables.join(", ")}
              </span>
            </div>
            <time
              className="event-group-time"
              dateTime={group.oldestChangedAt}
              title={group.oldestChangedAt}
            >
              {formatGroupStartTime(group.oldestChangedAt)}
            </time>
          </header>

          <div className="event-group-events">
            {group.events.map((event, index) => (
              <article
                className={`event event-${event.type}`}
                key={`${event.changedAt}-${event.table}-${index}`}
              >
                <EventHeader
                  type={event.type}
                  table={event.table}
                  rowPrimaryKey={getRowPrimaryKey(event)}
                />
                <DiffView type={event.type} diff={event.diff} />
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
