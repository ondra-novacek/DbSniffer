import { useEffect, useState } from "react";
import type { AuditEvent } from "../shared/types.js";
import { AppHeader, type ConnectionStatus } from "./AppHeader.js";
import { EventGroupList } from "./EventGroupList.js";

const WATCH_DATABASE = "levelworks_2026_07_17";

export function App() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [events, setEvents] = useState<AuditEvent[]>([]);

  useEffect(() => {
    const socket = new WebSocket(`ws://${location.host}`);

    socket.onopen = () => {
      setStatus("connected");
    };

    socket.onclose = () => {
      setStatus("disconnected");
    };

    socket.onmessage = (message) => {
      const event = JSON.parse(message.data as string) as AuditEvent;
      setEvents((currentEvents) => [event, ...currentEvents]);
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <main className="shell">
      <AppHeader database={events[0]?.database ?? WATCH_DATABASE} status={status} />

      <section className="events" aria-label="Database change events">
        {events.length === 0 ? (
          <div className="empty">Waiting for database changes...</div>
        ) : (
          <EventGroupList events={events} />
        )}
      </section>
    </main>
  );
}
