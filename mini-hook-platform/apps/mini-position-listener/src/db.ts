import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PositionDb } from "./types.js";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DB_FILE = process.env.MINI_POSITION_DATA_FILE ?? join(REPO_ROOT, "data", "mini-position.json");

export function loadDb(): PositionDb {
  if (!existsSync(DB_FILE)) {
    return { positions: {}, cursor: 0 };
  }
  return JSON.parse(readFileSync(DB_FILE, "utf8")) as PositionDb;
}

export function saveDb(db: PositionDb): void {
  mkdirSync(dirname(DB_FILE), { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export { DB_FILE };
