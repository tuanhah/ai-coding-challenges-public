export interface PoolActivityEvent {
  poolId: string;
  type: "Swap" | "Donate";
  amount0: string;
  amount1: string;
  priceAfter: string;
  blockNumber: number;
  txHash: string;
  timestamp: number;
}

export interface PoolInfo {
  poolId: string;
  token0: string;
  token1: string;
  createdAtBlock: number;
}

export interface PoolActivityDb {
  pools: Record<string, PoolInfo>;
  events: PoolActivityEvent[];
  cursor: number;
}
