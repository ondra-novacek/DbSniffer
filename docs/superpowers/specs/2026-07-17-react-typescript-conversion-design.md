# React and TypeScript Conversion Design

## Goal

Convert DbSniffer from a plain JavaScript Express app with an inline browser script into a TypeScript project with:

- A TypeScript Node/Express backend.
- A React frontend written in TypeScript.
- Shared event types used by both sides.
- The existing local database change feed behavior preserved.

## Current Behavior

The server listens on port `1234`, reads MySQL binlog events with `zongji`, normalizes row changes for one configured database, appends each change to `audit_events.jsonl`, and broadcasts each change over a WebSocket. The browser UI connects to the same host over WebSocket and prepends each received change to the page.

## Architecture

Use Vite for the React frontend and `tsc` for the backend.

Planned source layout:

- `src/shared/types.ts`: shared TypeScript types for audit events and change diffs.
- `src/server/index.ts`: Express, HTTP server, WebSocket server, ZongJi event handling, normalization, persistence, and shutdown handling.
- `src/client/main.tsx`: React entry point.
- `src/client/App.tsx`: live audit feed UI.
- `src/client/styles.css`: app styling.

Build output:

- `dist/client`: Vite browser bundle.
- `dist/server`: compiled Node backend.

The compiled backend serves `dist/client` as static files and keeps the WebSocket on the same host and port as the HTTP server.

## Scripts

Add npm scripts for the common workflows:

- `npm run dev`: run the TypeScript server directly with `tsx` for local development.
- `npm run build`: run `vite build` for the React frontend, then `tsc` for the backend.
- `npm start`: run `node dist/server/index.js`.
- `npm run typecheck`: run `tsc --noEmit` across server, client, and shared TypeScript files.

The development server may serve the production-built client until a separate Vite dev proxy is needed. That keeps the first conversion small while preserving the existing single-port local workflow.

## Data Flow

1. ZongJi emits a binlog event.
2. The backend filters events to the watched database.
3. Row events are normalized into shared `AuditEvent` objects.
4. Each event is appended to `audit_events.jsonl`.
5. The event is broadcast to connected WebSocket clients.
6. React receives the event, stores it in component state, and renders the newest events first.

## Error Handling

The backend should preserve current behavior for unsupported event types by returning no normalized changes. WebSocket broadcasts should skip closed clients. The client should show a clear connection state for connecting, connected, and disconnected.

## Testing and Verification

The conversion is acceptable when:

- TypeScript typechecking passes.
- The full production build passes.
- The compiled server can start from `npm start`.
- The React UI connects to the WebSocket endpoint and renders received audit events using the shared type shape.

## Out of Scope

- Changing MySQL credentials, watched database configuration, or binlog behavior.
- Reworking persistence beyond the existing JSONL append file.
- Adding historical replay of saved audit events.
- Adding authentication or remote deployment support.
