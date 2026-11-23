import type { Address } from "viem";

/**
 * MiniPositionNFT has no pool-level price/tick. CHALLENGE.md fixes the pool's
 * current tick at 0 for every pool so results are comparable across
 * submissions.
 */
export const CURRENT_TICK = 0;

/** Exactly the CHALLENGE.md convention: tickLower <= 0 && 0 < tickUpper. */
export function isInRange(tickLower: number, tickUpper: number, currentTick: number = CURRENT_TICK): boolean {
  return tickLower <= currentTick && currentTick < tickUpper;
}

/** One `positions(tokenId)` read from MiniPositionNFT. */
export interface OnChainPosition {
  owner: Address;
  poolId: bigint;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  feesOwed0: bigint;
  feesOwed1: bigint;
  exists: boolean;
}

/**
 * Response of GET /positions/:tokenId/state. uint values are decimal strings:
 * uint128/uint256 do not fit in a JS number and JSON has no bigint.
 */
export interface PositionStateResponse {
  tokenId: string;
  owner: Address;
  poolId: string;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  currentTick: number;
  inRange: boolean;
  /** Accrued, not yet collected (MiniPositionNFT feesOwed0 / feesOwed1). */
  uncollectedFees: { token0: string; token1: string };
  /** Block the snapshot was read at; every field comes from this one block. */
  blockNumber: string;
  chainId: number;
  contractAddress: Address;
}

export function toPositionState(
  tokenId: bigint,
  p: OnChainPosition,
  source: { blockNumber: bigint; chainId: number; contractAddress: Address }
): PositionStateResponse {
  return {
    tokenId: tokenId.toString(),
    owner: p.owner,
    poolId: p.poolId.toString(),
    tickLower: p.tickLower,
    tickUpper: p.tickUpper,
    liquidity: p.liquidity.toString(),
    currentTick: CURRENT_TICK,
    inRange: isInRange(p.tickLower, p.tickUpper),
    uncollectedFees: { token0: p.feesOwed0.toString(), token1: p.feesOwed1.toString() },
    blockNumber: source.blockNumber.toString(),
    chainId: source.chainId,
    contractAddress: source.contractAddress,
  };
}
