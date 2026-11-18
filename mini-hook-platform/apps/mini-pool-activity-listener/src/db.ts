import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PoolActivityDb } from "./types.js";

// Default anchors to the repo-root `data/` dir regardless of cwd (this file
// lives at apps/mini-pool-activity-listener/src/db.ts, 3 levels under root).
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DB_FILE = process.env.MINI_POOL_ACTIVITY_DATA_FILE ?? join(REPO_ROOT, "data", "mini-pool-activity.json");

export function loadDb(): PoolActivityDb {
  if (!existsSync(DB_FILE)) {
    return { pools: {}, events: [], cursor: 0 };
  }
  return JSON.parse(readFileSync(DB_FILE, "utf8")) as PoolActivityDb;
}

export function saveDb(db: PoolActivityDb): void {
  mkdirSync(dirname(DB_FILE), { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export { DB_FILE };
