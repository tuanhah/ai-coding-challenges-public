export interface PositionOwnership {
  tokenId: string;
  owner: string;
  poolId: string;
  lastBlockNumber: number;
  lastTxHash: string;
  transferredAt: number;
}

export interface PositionDb {
  positions: Record<string, PositionOwnership>;
  cursor: number;
}
