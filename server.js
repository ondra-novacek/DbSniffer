const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const ZongJi = require("zongji");
const fs = require("fs");

const MYSQL_CONFIG = {
  host: "localhost",
  user: "cdc",
  password: "cdc_password",
};

const WATCH_DATABASE = "levelworks_2026_06_10";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

function broadcast(event) {
  const message = JSON.stringify(event);

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function saveEvent(event) {
  fs.appendFileSync("audit_events.jsonl", JSON.stringify(event) + "\n");
}

function diffRows(before, after) {
  const diff = {};

  for (const key of Object.keys(after || {})) {
    if (JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])) {
      diff[key] = {
        from: before?.[key],
        to: after?.[key],
      };
    }
  }

  return diff;
}

function normalizeBinlogEvent(event) {
  const tableMap = event.tableMap?.[event.tableId];

  const database = tableMap?.parentSchema;
  const table = tableMap?.tableName;

  if (database !== WATCH_DATABASE) {
    return [];
  }

  if (event.getEventName() === "writerows") {
    return event.rows.map((row) => ({
      type: "insert",
      database,
      table,
      before: null,
      after: row,
      diff: row,
      changedAt: new Date().toISOString(),
    }));
  }

  if (event.getEventName() === "updaterows") {
    return event.rows.map((row) => ({
      type: "update",
      database,
      table,
      before: row.before,
      after: row.after,
      diff: diffRows(row.before, row.after),
      changedAt: new Date().toISOString(),
    }));
  }

  if (event.getEventName() === "deleterows") {
    return event.rows.map((row) => ({
      type: "delete",
      database,
      table,
      before: row,
      after: null,
      diff: row,
      changedAt: new Date().toISOString(),
    }));
  }

  return [];
}

const zongji = new ZongJi(MYSQL_CONFIG);

zongji.on("binlog", (event) => {
  console.log("test", event);
  const changes = normalizeBinlogEvent(event);

  for (const change of changes) {
    saveEvent(change);
    broadcast(change);
    console.log(change);
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

server.listen(1234, () => {
  console.log("Local audit UI running at http://localhost:1234");
});
