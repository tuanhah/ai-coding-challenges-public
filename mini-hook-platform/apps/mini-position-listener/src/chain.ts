import { createPublicClient, http, type Address, type PublicClient } from "viem";
import { miniPositionNftAbi } from "@mini-hook-platform/mini-contracts-mock/abi";
import type { ChainConfig } from "./config.js";
import type { OnChainPosition } from "./position-state.js";

/** Live reads from MiniPositionNFT. An interface so handlers can be tested without a node. */
export interface PositionReader {
  readonly chainId: number;
  readonly contractAddress: Address;
  readPosition(tokenId: bigint): Promise<{ position: OnChainPosition; blockNumber: bigint }>;
}

export function createClient(config: ChainConfig): PublicClient {
  return createPublicClient({ transport: http(config.rpcUrl, { timeout: 8_000, retryCount: 1 }) });
}

export function createPositionReader(config: ChainConfig, client: PublicClient = createClient(config)): PositionReader {
  // Verify once that the RPC really serves the configured chain, so a
  // misconfigured URL cannot silently return another chain's state.
  let chainCheck: Promise<void> | undefined;
  const ensureChain = () =>
    (chainCheck ??= client.getChainId().then((actual) => {
      if (actual !== config.chainId) {
        chainCheck = undefined;
        throw new Error(`RPC chainId ${actual} does not match MINI_CHAIN_ID ${config.chainId}`);
      }
    }));

  return {
    chainId: config.chainId,
    contractAddress: config.contractAddress,
    async readPosition(tokenId) {
      await ensureChain();
      // Pin one block so every field of the snapshot is mutually consistent
      // and the response can say exactly which block it reflects.
      const blockNumber = await client.getBlockNumber({ cacheTime: 0 });
      const [owner, poolId, tickLower, tickUpper, liquidity, feesOwed0, feesOwed1, exists] = await client.readContract({
        address: config.contractAddress,
        abi: miniPositionNftAbi,
        functionName: "positions",
        args: [tokenId],
        blockNumber,
      });
      return { position: { owner, poolId, tickLower, tickUpper, liquidity, feesOwed0, feesOwed1, exists }, blockNumber };
    },
  };
}
