import express from "express";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import ZongJi from "zongji";
import type { AuditEvent } from "../shared/types.js";
import { normalizeBinlogEvent, type BinlogEvent } from "./normalize.js";
import { applyZongJiColumnOrderingPatch } from "./zongji-column-order.js";

const MYSQL_CONFIG = {
  host: "localhost",
  user: "cdc",
  password: "cdc_password",
};

const WATCH_DATABASE = "levelworks_2026_07_17";
const PORT = Number(process.env.PORT ?? 1234);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../client");
const publicFallbackPath = path.resolve(process.cwd(), "public");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

applyZongJiColumnOrderingPatch(ZongJi);

app.use(
  express.static(
    fs.existsSync(clientDistPath) ? clientDistPath : publicFallbackPath,
  ),
);

function broadcast(event: AuditEvent) {
  const message = JSON.stringify(event);

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function saveEvent(event: AuditEvent) {
  fs.appendFileSync("audit_events.jsonl", `${JSON.stringify(event)}\n`);
}

const zongji = new ZongJi(MYSQL_CONFIG);

zongji.on("binlog", (event: BinlogEvent) => {
  console.log("\n\n\n\n\n NEW EVENT:\n");
  console.log(event);
  const changes = normalizeBinlogEvent(event, WATCH_DATABASE);

  for (const change of changes) {
    saveEvent(change);
    broadcast(change);
    // console.log(change);
  }
});

zongji.start({
  startAtEnd: true,
  includeEvents: [
    "rotate",
    "format",
    "tablemap",
    "writerows",
    "updaterows",
    "deleterows",
  ],
  includeSchema: {
    [WATCH_DATABASE]: true,
  },
});

process.on("SIGINT", () => {
  console.log("Stopping...");
  zongji.stop();
  process.exit();
});

server.listen(PORT, () => {
  console.log(`Local audit UI running at http://localhost:${PORT}`);
});
