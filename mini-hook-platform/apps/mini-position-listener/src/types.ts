export interface PositionOwnership {
  tokenId: string;
  owner: string;
  poolId: string;
  lastBlockNumber: number;
  lastTxHash: string;
  transferredAt: number;
}

/** Where the chain listener (src/ingest-chain.ts) has read up to. */
export interface ChainCursor {
  chainId: number;
  contractAddress: string;
  /** Last block whose Transfer logs are fully applied, as a decimal string. */
  lastBlock: string;
}

export interface PositionDb {
  positions: Record<string, PositionOwnership>;
  /** Byte offset into the mock event log (file listener, src/ingest.ts). */
  cursor: number;
  /** Set once the chain listener has run; see src/ingest-chain.ts. */
  chain?: ChainCursor;
}
