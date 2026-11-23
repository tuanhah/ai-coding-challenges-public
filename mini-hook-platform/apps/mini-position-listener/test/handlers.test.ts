import { test } from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../src/handlers.js";
import type { PositionReader } from "../src/chain.js";
import type { OnChainPosition } from "../src/position-state.js";

const OWNER = "0x00000000000000000000000000000000000000aA" as const;
const CONTRACT = "0x00000000000000000000000000000000000000bB" as const;

function fakeReader(positions: Record<string, OnChainPosition>, opts: { fail?: boolean } = {}): PositionReader {
  return {
    chainId: 1337,
    contractAddress: CONTRACT,
    async readPosition(tokenId) {
      if (opts.fail) throw new Error("connect ECONNREFUSED http://rpc.example/secret-api-key");
      const p = positions[tokenId.toString()] ?? {
        owner: "0x0000000000000000000000000000000000000000",
        poolId: 0n,
        tickLower: 0,
        tickUpper: 0,
        liquidity: 0n,
        feesOwed0: 0n,
        feesOwed1: 0n,
        exists: false,
      };
      return { position: p, blockNumber: 123n };
    },
  };
}

const livePosition: OnChainPosition = {
  owner: OWNER,
  poolId: 1n,
  tickLower: -600,
  tickUpper: 600,
  liquidity: 1_000_000n,
  feesOwed0: 400n,
  feesOwed1: 400n,
  exists: true,
};

test("GET /positions/:id/state returns the live on-chain state", async () => {
  const handle = createHandler({ positionReader: fakeReader({ "1": livePosition }) });
  const res = await handle("GET", "/positions/1/state");
  assert.equal(res.status, 200);
  assert.equal(res.headers?.["cache-control"], "no-store");
  assert.deepEqual(res.body, {
    tokenId: "1",
    owner: OWNER,
    poolId: "1",
    tickLower: -600,
    tickUpper: 600,
    liquidity: "1000000",
    currentTick: 0,
    inRange: true,
    uncollectedFees: { token0: "400", token1: "400" },
    blockNumber: "123",
    chainId: 1337,
    contractAddress: CONTRACT,
  });
});

test("404 for a position that does not exist on chain (never minted or burned)", async () => {
  const handle = createHandler({ positionReader: fakeReader({}) });
  assert.equal((await handle("GET", "/positions/999/state")).status, 404);
});

test("400 for malformed token ids", async () => {
  const handle = createHandler({ positionReader: fakeReader({}) });
  for (const id of ["abc", "-1", "1.5", "0x10", (1n << 256n).toString()]) {
    assert.equal((await handle("GET", `/positions/${encodeURIComponent(id)}/state`)).status, 400, id);
  }
});

test("503 when no chain is configured", async () => {
  const handle = createHandler({ positionReader: null });
  assert.equal((await handle("GET", "/positions/1/state")).status, 503);
});

test("502 on RPC failure, without leaking the RPC URL", async () => {
  const handle = createHandler({ positionReader: fakeReader({}, { fail: true }) });
  const original = console.error;
  console.error = () => {};
  try {
    const res = await handle("GET", "/positions/1/state");
    assert.equal(res.status, 502);
    assert.doesNotMatch(JSON.stringify(res.body), /secret-api-key|rpc\.example/);
  } finally {
    console.error = original;
  }
});

test("other routes and methods are 404", async () => {
  const handle = createHandler({ positionReader: fakeReader({ "1": livePosition }) });
  assert.equal((await handle("GET", "/positions/1")).status, 404);
  assert.equal((await handle("POST", "/positions/1/state")).status, 404);
});
