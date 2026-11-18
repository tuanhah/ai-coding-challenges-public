export const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:4000";

export interface PoolInfo {
  poolId: string;
  token0: string;
  token1: string;
  createdAtBlock: number;
}

export interface PoolActivityEvent {
  poolId: string;
  type: string;
  amount0: string;
  amount1: string;
  priceAfter: string;
  blockNumber: number;
  txHash: string;
  timestamp: number;
}

export interface PositionOwnership {
  tokenId: string;
  owner: string;
  poolId: string;
  lastBlockNumber: number;
  lastTxHash: string;
  transferredAt: number;
  // NOTE: no range/liquidity/fee fields yet — that is Part A's backend gap.
}

export interface Curation {
  poolId: string;
  status: "pending" | "approved" | "rejected";
  submittedBy: string;
  submittedAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
}

export async function getPools(): Promise<PoolInfo[]> {
  const res = await fetch(`${GATEWAY_URL}/pools`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.pools ?? [];
}

export async function getPoolHistory(poolId: string): Promise<PoolActivityEvent[]> {
  const res = await fetch(`${GATEWAY_URL}/pools/${poolId}/history`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.events ?? [];
}

export async function getPositionsByOwner(address: string): Promise<PositionOwnership[]> {
  const res = await fetch(`${GATEWAY_URL}/owners/${address}/positions`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.positions ?? [];
}

export async function getCurations(): Promise<Curation[]> {
  const res = await fetch(`${GATEWAY_URL}/curations`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.curations ?? [];
}

export async function submitCuration(poolId: string, submittedBy: string): Promise<void> {
  await fetch(`${GATEWAY_URL}/curations`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ poolId, submittedBy }),
  });
}

export async function reviewCuration(poolId: string, action: "approve" | "reject", reviewedBy: string): Promise<void> {
  await fetch(`${GATEWAY_URL}/curations/${poolId}/${action}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reviewedBy }),
  });
}
