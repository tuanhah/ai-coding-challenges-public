// npm run ingest:chain            -> one pass over new Transfer logs
// npm run ingest:chain -- --watch -> keep polling (MINI_CHAIN_POLL_MS, default 2000)
import { createClient } from "./chain.js";
import { chainConfigFromEnv } from "./config.js";
import { DB_FILE, loadDb, saveDb } from "./db.js";
import { ingestChainOnce } from "./ingest-chain.js";

const config = chainConfigFromEnv();
if (!config) {
  console.error("MINI_POSITION_NFT_ADDRESS is not set; nothing to listen to.");
  process.exit(1);
}

const client = createClient(config);
const startBlock = process.env.MINI_POSITION_NFT_START_BLOCK ? BigInt(process.env.MINI_POSITION_NFT_START_BLOCK) : 0n;
const watch = process.argv.includes("--watch");
const pollMs = Number(process.env.MINI_CHAIN_POLL_MS ?? 2000);

async function runOnce() {
  const r = await ingestChainOnce({ client, config: config!, loadDb, saveDb, startBlock });
  if (r.transfers > 0 || !watch) {
    console.log(`[mini-position-listener] chain ingest blocks ${r.fromBlock}..${r.toBlock}: ${r.transfers} transfer(s) -> ${DB_FILE}`);
  }
}

await runOnce();
if (watch) {
  console.log(`[mini-position-listener] watching ${config.contractAddress} on chain ${config.chainId} every ${pollMs}ms`);
  for (;;) {
    await new Promise((r) => setTimeout(r, pollMs));
    try {
      await runOnce();
    } catch (err) {
      console.error("[mini-position-listener] chain ingest failed, retrying:", err instanceof Error ? err.message : err);
    }
  }
}
