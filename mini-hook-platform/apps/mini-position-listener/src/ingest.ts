// "Listener" for LP position NFT ownership. Tails a newline-delimited JSON
// event log (written by scripts/seed-demo-data.ts, standing in for a real
// anvil/hardhat `Transfer` event subscription) and keeps only the CURRENT
// ownership snapshot per tokenId — this service answers "who owns this
// position right now", not full event history.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDb, saveDb } from "./db.js";
import type { PositionOwnership } from "./types.js";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const EVENTS_FILE = process.env.MINI_POSITION_EVENTS_FILE ?? join(REPO_ROOT, "data", "events-position.jsonl");

interface RawTransferLine {
  kind: "transfer";
  tokenId: string;
  owner: string;
  poolId: string;
  blockNumber: number;
  txHash: string;
  timestamp: number;
}

export function ingestOnce(): { ingestedTransfers: number } {
  const db = loadDb();
  if (!existsSync(EVENTS_FILE)) {
    return { ingestedTransfers: 0 };
  }

  const raw = readFileSync(EVENTS_FILE, "utf8");
  const newContent = raw.slice(db.cursor);
  const lines = newContent.split("\n").filter((l) => l.trim().length > 0);

  let ingestedTransfers = 0;
  for (const line of lines) {
    const parsed: RawTransferLine = JSON.parse(line);
    if (parsed.kind !== "transfer") continue;
    const record: PositionOwnership = {
      tokenId: parsed.tokenId,
      owner: parsed.owner,
      poolId: parsed.poolId,
      lastBlockNumber: parsed.blockNumber,
      lastTxHash: parsed.txHash,
      transferredAt: parsed.timestamp,
    };
    db.positions[parsed.tokenId] = record;
    ingestedTransfers++;
  }

  db.cursor = raw.length;
  saveDb(db);
  return { ingestedTransfers };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = ingestOnce();
  console.log(`[mini-position-listener] ingested ${result.ingestedTransfers} transfer(s)`);
}
