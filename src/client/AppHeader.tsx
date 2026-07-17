export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export const DEFAULT_DATABASE = "levelworks_2026_07_17";

const statusLabels: Record<ConnectionStatus, string> = {
  connecting: "Connecting...",
  connected: "Connected",
  disconnected: "Disconnected",
};

interface AppHeaderProps {
  database: string | null;
  status: ConnectionStatus;
}

export function AppHeader({ database, status }: AppHeaderProps) {
  return (
    <header className="header">
      <h1>
        <code>{database ?? DEFAULT_DATABASE}</code>
      </h1>
      <span className={`status status-${status}`}>{statusLabels[status]}</span>
    </header>
  );
}
