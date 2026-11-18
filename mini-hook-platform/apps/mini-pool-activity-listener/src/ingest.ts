// "Listener" for pool activity. In a real deployment this would subscribe to
// Swap/Donate events from an anvil/hardhat node or a live RPC websocket. For
// local/demo use (and to keep this scaffold runnable without a chain node),
// it tails a newline-delimited JSON event log written by
// scripts/seed-demo-data.ts and ingests any lines not seen yet (tracked via
// `cursor`, a byte offset into the log file).
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDb, saveDb } from "./db.js";
import type { PoolActivityEvent, PoolInfo } from "./types.js";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const EVENTS_FILE = process.env.MINI_POOL_ACTIVITY_EVENTS_FILE ?? join(REPO_ROOT, "data", "events-pool-activity.jsonl");

interface RawLogLine {
  kind: "pool-created" | "pool-event";
  pool?: PoolInfo;
  event?: PoolActivityEvent;
}

export function ingestOnce(): { ingestedPools: number; ingestedEvents: number } {
  const db = loadDb();
  if (!existsSync(EVENTS_FILE)) {
    return { ingestedPools: 0, ingestedEvents: 0 };
  }

  const raw = readFileSync(EVENTS_FILE, "utf8");
  const newContent = raw.slice(db.cursor);
  const lines = newContent.split("\n").filter((l) => l.trim().length > 0);

  let ingestedPools = 0;
  let ingestedEvents = 0;

  for (const line of lines) {
    const parsed: RawLogLine = JSON.parse(line);
    if (parsed.kind === "pool-created" && parsed.pool) {
      db.pools[parsed.pool.poolId] = parsed.pool;
      ingestedPools++;
    } else if (parsed.kind === "pool-event" && parsed.event) {
      db.events.push(parsed.event);
      ingestedEvents++;
    }
  }

  db.cursor = raw.length;
  saveDb(db);
  return { ingestedPools, ingestedEvents };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = ingestOnce();
  console.log(`[mini-pool-activity-listener] ingested ${result.ingestedPools} pool(s), ${result.ingestedEvents} event(s)`);
}
