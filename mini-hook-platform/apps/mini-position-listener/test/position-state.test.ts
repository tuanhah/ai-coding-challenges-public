import { test } from "node:test";
import assert from "node:assert/strict";
import { CURRENT_TICK, isInRange, toPositionState } from "../src/position-state.js";

test("current tick is fixed at 0 (CHALLENGE.md convention)", () => {
  assert.equal(CURRENT_TICK, 0);
});

test("isInRange = tickLower <= 0 && 0 < tickUpper", () => {
  const cases: Array<[number, number, boolean]> = [
    [-600, 600, true], // straddles 0
    [0, 600, true], // lower bound inclusive
    [-600, 0, false], // upper bound exclusive
    [0, 0, false], // empty range at 0
    [1, 600, false], // entirely above
    [-600, -1, false], // entirely below
    [-1, 1, true],
    [-887272, 887272, true], // full int24-ish range
  ];
  for (const [lower, upper, expected] of cases) {
    assert.equal(isInRange(lower, upper), expected, `[${lower}, ${upper})`);
  }
});

test("toPositionState serializes uint values as decimal strings", () => {
  const big = (1n << 128n) - 1n; // max uint128 — would lose precision as a JS number
  const state = toPositionState(
    42n,
    {
      owner: "0x00000000000000000000000000000000000000aA",
      poolId: 7n,
      tickLower: -10,
      tickUpper: 10,
      liquidity: big,
      feesOwed0: 1n,
      feesOwed1: 2n,
      exists: true,
    },
    { blockNumber: 99n, chainId: 1337, contractAddress: "0x00000000000000000000000000000000000000bB" }
  );
  assert.deepEqual(state, {
    tokenId: "42",
    owner: "0x00000000000000000000000000000000000000aA",
    poolId: "7",
    tickLower: -10,
    tickUpper: 10,
    liquidity: big.toString(),
    currentTick: 0,
    inRange: true,
    uncollectedFees: { token0: "1", token1: "2" },
    blockNumber: "99",
    chainId: 1337,
    contractAddress: "0x00000000000000000000000000000000000000bB",
  });
  assert.doesNotThrow(() => JSON.stringify(state));
});
