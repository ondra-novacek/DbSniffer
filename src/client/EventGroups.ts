import type { AuditEvent } from "../shared/types.js";

export interface EventGroup {
  id: string;
  events: AuditEvent[];
  tables: string[];
  newestChangedAt: string;
  oldestChangedAt: string;
}

const DEFAULT_MAX_GAP_MS = 500;

function timestampMs(changedAt: string) {
  const timestamp = new Date(changedAt).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function uniqueTables(events: AuditEvent[]) {
  return [...new Set(events.map((event) => event.table))];
}

function makeGroup(events: AuditEvent[]): EventGroup {
  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];

  return {
    id: `${firstEvent.changedAt}-${lastEvent.changedAt}-${events.length}`,
    events,
    tables: uniqueTables(events),
    newestChangedAt: firstEvent.changedAt,
    oldestChangedAt: lastEvent.changedAt,
  };
}

function shouldJoinGroup(
  previousEvent: AuditEvent,
  nextEvent: AuditEvent,
  maxGapMs: number,
) {
  const previousTime = timestampMs(previousEvent.changedAt);
  const nextTime = timestampMs(nextEvent.changedAt);

  if (previousTime === null || nextTime === null) {
    return false;
  }

  return Math.abs(previousTime - nextTime) <= maxGapMs;
}

export function groupEventsByTime(
  events: AuditEvent[],
  maxGapMs = DEFAULT_MAX_GAP_MS,
): EventGroup[] {
  if (events.length === 0) {
    return [];
  }

  const groups: EventGroup[] = [];
  let currentGroup = [events[0]];

  for (const event of events.slice(1)) {
    const previousEvent = currentGroup[currentGroup.length - 1];

    if (shouldJoinGroup(previousEvent, event, maxGapMs)) {
      currentGroup = [...currentGroup, event];
    } else {
      groups.push(makeGroup(currentGroup));
      currentGroup = [event];
    }
  }

  groups.push(makeGroup(currentGroup));

  return groups;
}
