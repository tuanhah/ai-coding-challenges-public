import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const POOL_ACTIVITY_DB = process.env.MINI_POOL_ACTIVITY_DATA_FILE ?? join(REPO_ROOT, "data", "mini-pool-activity.json");
const POSITION_DB = process.env.MINI_POSITION_DATA_FILE ?? join(REPO_ROOT, "data", "mini-position.json");

interface PoolActivityDb {
  pools: Record<string, { poolId: string; token0: string; token1: string; createdAtBlock: number }>;
  events: Array<{ poolId: string; type: string; amount0: string; amount1: string; priceAfter: string; blockNumber: number; txHash: string; timestamp: number }>;
}

interface PositionDb {
  positions: Record<string, { tokenId: string; owner: string; poolId: string; lastBlockNumber: number; lastTxHash: string; transferredAt: number }>;
}

function readPoolActivityDb(): PoolActivityDb {
  if (!existsSync(POOL_ACTIVITY_DB)) return { pools: {}, events: [] };
  return JSON.parse(readFileSync(POOL_ACTIVITY_DB, "utf8"));
}

function readPositionDb(): PositionDb {
  if (!existsSync(POSITION_DB)) return { positions: {} };
  return JSON.parse(readFileSync(POSITION_DB, "utf8"));
}

export interface HandlerResponse {
  status: number;
  body: unknown;
}

// NOTE: this service reads straight out of two DB files that belong to two
// different listener services (mini-pool-activity-listener,
// mini-position-listener) because both routes below happen to be read-only.
// See README.md for the (intentional) reasoning that led here.
export function handleRequest(method: string, path: string): HandlerResponse {
  const parts = path.split("/").filter(Boolean);

  // --- pool activity reads ---
  if (method === "GET" && parts[0] === "pools" && parts.length === 1) {
    const db = readPoolActivityDb();
    return { status: 200, body: { pools: Object.values(db.pools) } };
  }

  if (method === "GET" && parts[0] === "pools" && parts[2] === "history") {
    const poolId = parts[1];
    const db = readPoolActivityDb();
    if (!db.pools[poolId]) return { status: 404, body: { error: "pool not found" } };
    const events = db.events.filter((e) => e.poolId === poolId);
    return { status: 200, body: { poolId, events } };
  }

  // --- position ownership reads ---
  if (method === "GET" && parts[0] === "owners" && parts[2] === "positions") {
    const addr = parts[1].toLowerCase();
    const db = readPositionDb();
    const owned = Object.values(db.positions).filter((p) => p.owner.toLowerCase() === addr);
    return { status: 200, body: { owner: addr, positions: owned } };
  }

  if (method === "GET" && parts[0] === "positions" && parts.length === 2) {
    const tokenId = parts[1];
    const db = readPositionDb();
    const position = db.positions[tokenId];
    if (!position) return { status: 404, body: { error: "position not found" } };
    // Ownership snapshot only — no range/liquidity/fee here yet.
    return { status: 200, body: position };
  }

  return { status: 404, body: { error: "not found" } };
}
