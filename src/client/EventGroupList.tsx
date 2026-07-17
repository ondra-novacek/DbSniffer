import type { AuditEvent } from "../shared/types.js";
import { DiffView } from "./DiffView.js";
import { EventHeader, formatEventTime } from "./EventHeader.js";
import { groupEventsByTime } from "./EventGroups.js";

interface EventGroupListProps {
  events: AuditEvent[];
}

function formatGroupTime(newestChangedAt: string, oldestChangedAt: string) {
  const newestTime = formatEventTime(newestChangedAt);
  const oldestTime = formatEventTime(oldestChangedAt);

  return newestTime === oldestTime ? newestTime : `${newestTime} - ${oldestTime}`;
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
              dateTime={group.newestChangedAt}
              title={
                group.newestChangedAt === group.oldestChangedAt
                  ? group.newestChangedAt
                  : `${group.newestChangedAt} - ${group.oldestChangedAt}`
              }
            >
              {formatGroupTime(group.newestChangedAt, group.oldestChangedAt)}
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
                  changedAt={event.changedAt}
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
