import { useEffect, useState } from "react";
import type { AuditEvent } from "../shared/types.js";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

const statusLabels: Record<ConnectionStatus, string> = {
  connecting: "Connecting...",
  connected: "Connected",
  disconnected: "Disconnected",
};

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
      <header className="header">
        <div>
          <h1>Local DB Change Feed</h1>
          <p className="subtitle">Live row changes from the watched MySQL database.</p>
        </div>
        <span className={`status status-${status}`}>{statusLabels[status]}</span>
      </header>

      <section className="events" aria-label="Database change events">
        {events.length === 0 ? (
          <div className="empty">Waiting for database changes...</div>
        ) : (
          events.map((event, index) => (
            <article className={`event event-${event.type}`} key={`${event.changedAt}-${index}`}>
              <div className="meta">
                <strong>{event.type.toUpperCase()}</strong>
                <span>
                  {event.database}.{event.table}
                </span>
                <time dateTime={event.changedAt}>at {event.changedAt}</time>
              </div>
              <pre>{JSON.stringify(event.diff, null, 2)}</pre>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
