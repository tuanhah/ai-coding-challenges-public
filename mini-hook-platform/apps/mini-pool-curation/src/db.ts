import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CurationDb } from "./types.js";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DB_FILE = process.env.MINI_CURATION_DATA_FILE ?? join(REPO_ROOT, "data", "mini-curation.json");

export function loadDb(): CurationDb {
  if (!existsSync(DB_FILE)) return { curations: {} };
  return JSON.parse(readFileSync(DB_FILE, "utf8")) as CurationDb;
}

export function saveDb(db: CurationDb): void {
  mkdirSync(dirname(DB_FILE), { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export { DB_FILE };
