import { getAddress, isAddress, type Address } from "viem";

export interface ChainConfig {
  rpcUrl: string;
  chainId: number;
  contractAddress: Address;
}

/**
 * Chain settings for live position reads and the chain listener.
 * Returns null when no contract address is configured (the ownership routes
 * keep working; the live-state route answers 503). Throws on malformed values
 * so a bad deploy fails loudly instead of reading the wrong chain.
 */
export function chainConfigFromEnv(env: NodeJS.ProcessEnv = process.env): ChainConfig | null {
  const address = env.MINI_POSITION_NFT_ADDRESS;
  if (!address || address === "REPLACE_ME") return null;
  // Mixed-case input must carry a valid EIP-55 checksum (catches typos);
  // all-lowercase is accepted as-is.
  if (!isAddress(address)) {
    throw new Error(`MINI_POSITION_NFT_ADDRESS is not a valid address (bad hex or EIP-55 checksum): ${address}`);
  }

  const chainId = Number(env.MINI_CHAIN_ID ?? 1337);
  if (!Number.isInteger(chainId) || chainId <= 0) throw new Error(`MINI_CHAIN_ID must be a positive integer, got "${env.MINI_CHAIN_ID}"`);

  return {
    rpcUrl: env.MINI_CHAIN_RPC_URL ?? "http://localhost:8545",
    chainId,
    contractAddress: getAddress(address),
  };
}
