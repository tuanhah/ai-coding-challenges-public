// Chain listener for LP position ownership: the real-chain counterpart of
// src/ingest.ts (which tails the mock JSONL log). Reads MiniPositionNFT
// `Transfer` logs from the last processed block and keeps the CURRENT owner
// per tokenId, deleting the record when a position is burned (to = 0x0).
//
// Only ownership is indexed here. Range/liquidity/fees are always read live
// by GET /positions/:tokenId/state, never re-derived from these events.
import { zeroAddress, type PublicClient } from "viem";
import { miniPositionNftAbi } from "@mini-hook-platform/mini-contracts-mock/abi";
import type { ChainConfig } from "./config.js";
import type { PositionDb } from "./types.js";

export interface ChainIngestDeps {
  client: PublicClient;
  config: ChainConfig;
  loadDb: () => PositionDb;
  saveDb: (db: PositionDb) => void;
  /** Block range per eth_getLogs call (providers cap it). */
  chunkSize?: bigint;
  /** First block to scan for a fresh DB (e.g. the deployment block). */
  startBlock?: bigint;
}

export interface ChainIngestResult {
  transfers: number;
  fromBlock: bigint;
  toBlock: bigint;
}

export async function ingestChainOnce(deps: ChainIngestDeps): Promise<ChainIngestResult> {
  const { client, config } = deps;
  const chunkSize = deps.chunkSize ?? 2_000n;
  const db = deps.loadDb();

  const actualChainId = await client.getChainId();
  if (actualChainId !== config.chainId) throw new Error(`RPC chainId ${actualChainId} does not match MINI_CHAIN_ID ${config.chainId}`);

  // A different chain/contract than last time (or a DB seeded from the mock
  // JSONL log) means the stored snapshot is not about this contract: start over.
  const sameSource =
    db.chain?.chainId === config.chainId && db.chain.contractAddress.toLowerCase() === config.contractAddress.toLowerCase();
  if (!sameSource) {
    db.positions = {};
    db.chain = { chainId: config.chainId, contractAddress: config.contractAddress, lastBlock: ((deps.startBlock ?? 0n) - 1n).toString() };
  }
  const cursor = db.chain!;

  const head = await client.getBlockNumber({ cacheTime: 0 });
  const fromBlock = BigInt(cursor.lastBlock) + 1n;
  let transfers = 0;
  const blockTimes = new Map<bigint, number>();

  for (let start = fromBlock; start <= head; start += chunkSize) {
    const end = start + chunkSize - 1n < head ? start + chunkSize - 1n : head;
    const logs = await client.getContractEvents({
      address: config.contractAddress,
      abi: miniPositionNftAbi,
      eventName: "Transfer",
      fromBlock: start,
      toBlock: end,
      strict: true,
    });

    for (const log of logs) {
      const tokenId = log.args.tokenId.toString();
      if (log.args.to === zeroAddress) {
        delete db.positions[tokenId];
      } else {
        // poolId is not in the Transfer event; it never changes after mint, so
        // read it at the log's block (where the position is known to exist).
        const [, poolId] = await client.readContract({
          address: config.contractAddress,
          abi: miniPositionNftAbi,
          functionName: "positions",
          args: [log.args.tokenId],
          blockNumber: log.blockNumber,
        });
        let ts = blockTimes.get(log.blockNumber);
        if (ts === undefined) {
          ts = Number((await client.getBlock({ blockNumber: log.blockNumber })).timestamp) * 1000;
          blockTimes.set(log.blockNumber, ts);
        }
        db.positions[tokenId] = {
          tokenId,
          owner: log.args.to,
          poolId: poolId.toString(),
          lastBlockNumber: Number(log.blockNumber),
          lastTxHash: log.transactionHash,
          transferredAt: ts,
        };
      }
      transfers++;
    }

    // Persist per chunk so a crash resumes from the last fully applied block.
    cursor.lastBlock = end.toString();
    deps.saveDb(db);
  }

  if (!sameSource && fromBlock > head) deps.saveDb(db);
  return { transfers, fromBlock, toBlock: head };
}
