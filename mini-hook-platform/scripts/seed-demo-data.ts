// Generates demo pool/position/curation data by writing mock on-chain event
// logs that the listener apps tail, plus seeding an initial curation record
// directly (curation has no "listener" — it is a direct write API).
//
// Run: npm run seed  (from repo root)
import { writeFileSync, mkdirSync, existsSync } from "node:fs";

const DATA_DIR = "./data";
mkdirSync(DATA_DIR, { recursive: true });

const POOLS = [
  { poolId: "pool-demo-aaa", token0: "mUSDC", token1: "mETH", createdAtBlock: 100 },
  { poolId: "pool-demo-bbb", token0: "mUSDC", token1: "mWBTC", createdAtBlock: 101 },
];

// Valid 20-byte (40 hex char) EVM address — verified with viem's isAddress().
const DEMO_OWNER = "0x00000000000000000000000000000000000000aa";

function buildPoolActivityLog(): string {
  const lines: string[] = [];
  for (const pool of POOLS) {
    lines.push(JSON.stringify({ kind: "pool-created", pool }));
  }

  let block = 200;
  for (const pool of POOLS) {
    for (let i = 0; i < 3; i++) {
      block += 1;
      lines.push(
        JSON.stringify({
          kind: "pool-event",
          event: {
            poolId: pool.poolId,
            type: i % 2 === 0 ? "Swap" : "Donate",
            amount0: String(1000 * (i + 1)),
            amount1: String(500 * (i + 1)),
            priceAfter: String(1800 + i * 10),
            blockNumber: block,
            txHash: `0x${"ab".repeat(30)}${block.toString(16).padStart(4, "0")}`,
            timestamp: Date.now() - (10 - i) * 60_000,
          },
        })
      );
    }
  }
  return lines.join("\n") + "\n";
}

function buildPositionLog(): string {
  const lines: string[] = [];
  const tokenIds = ["1", "2"];
  tokenIds.forEach((tokenId, i) => {
    lines.push(
      JSON.stringify({
        kind: "transfer",
        tokenId,
        owner: DEMO_OWNER,
        poolId: POOLS[i % POOLS.length].poolId,
        blockNumber: 300 + i,
        txHash: `0x${"cd".repeat(30)}${(300 + i).toString(16).padStart(4, "0")}`,
        timestamp: Date.now() - (5 - i) * 60_000,
      })
    );
  });
  return lines.join("\n") + "\n";
}

function seedCuration(): void {
  const curationFile = process.env.MINI_CURATION_DATA_FILE ?? "./data/mini-curation.json";
  if (existsSync(curationFile)) return;
  const curations: Record<string, unknown> = {};
  curations[POOLS[0].poolId] = {
    poolId: POOLS[0].poolId,
    status: "approved",
    submittedBy: "demo-curator",
    submittedAt: Date.now() - 3_600_000,
    reviewedBy: "demo-curator",
    reviewedAt: Date.now() - 1_800_000,
  };
  curations[POOLS[1].poolId] = {
    poolId: POOLS[1].poolId,
    status: "pending",
    submittedBy: "demo-curator",
    submittedAt: Date.now() - 600_000,
  };
  writeFileSync(curationFile, JSON.stringify({ curations }, null, 2));
}

const poolActivityEventsFile = process.env.MINI_POOL_ACTIVITY_EVENTS_FILE ?? "./data/events-pool-activity.jsonl";
const positionEventsFile = process.env.MINI_POSITION_EVENTS_FILE ?? "./data/events-position.jsonl";

writeFileSync(poolActivityEventsFile, buildPoolActivityLog());
writeFileSync(positionEventsFile, buildPositionLog());
seedCuration();

console.log(`Seeded demo event logs:\n  ${poolActivityEventsFile}\n  ${positionEventsFile}`);
console.log("Seeded demo curation DB: ./data/mini-curation.json");
console.log("\nNext: run each listener's `npm run ingest`, then start the services (see README.md).");
