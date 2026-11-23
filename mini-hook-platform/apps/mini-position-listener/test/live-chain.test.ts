// Integration test against a real EVM node (geth --dev or anvil).
//
//   docker compose -f infra/local-chain/docker-compose.yml up -d
//   npm run build -w packages/mini-contracts-mock
//   MINI_IT_CHAIN_RPC_URL=http://localhost:8545 npm test -w apps/mini-position-listener
//
// Deploys a FRESH MiniPositionNFT (so it never touches a demo deployment),
// signing with the node's unlocked dev account via eth_sendTransaction — no
// private key involved. Skipped when MINI_IT_CHAIN_RPC_URL is unset.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, createWalletClient, getAddress, http, type Address, type Hex } from "viem";
import { miniPositionNftAbi } from "@mini-hook-platform/mini-contracts-mock/abi";
import { createPositionReader } from "../src/chain.js";
import { createHandler } from "../src/handlers.js";
import { ingestChainOnce } from "../src/ingest-chain.js";
import type { PositionStateResponse } from "../src/position-state.js";
import type { PositionDb } from "../src/types.js";

const RPC = process.env.MINI_IT_CHAIN_RPC_URL;
const ARTIFACT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "packages", "mini-contracts-mock", "build", "MiniPositionNFT.json");
const skip = !RPC ? "set MINI_IT_CHAIN_RPC_URL to run" : !existsSync(ARTIFACT) ? "run `npm run build -w packages/mini-contracts-mock`" : false;

test("live position state + withdraw lifecycle against a real chain", { skip }, async () => {
  const transport = http(RPC);
  const publicClient = createPublicClient({ transport });
  const chainId = await publicClient.getChainId();
  const [devAccount] = await createWalletClient({ transport }).getAddresses();
  assert.ok(devAccount, "node must expose an unlocked account (geth --dev / anvil)");
  const chain = { id: chainId, name: "it", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [RPC!] } } };
  const wallet = createWalletClient({ account: getAddress(devAccount), chain, transport });

  const artifact = JSON.parse(readFileSync(ARTIFACT, "utf8")) as { bytecode: string };
  const deployHash = await wallet.deployContract({ abi: miniPositionNftAbi, bytecode: `0x${artifact.bytecode}` as Hex });
  const deployReceipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
  const address = deployReceipt.contractAddress as Address;

  const send = async (fn: "mint" | "decreaseLiquidity" | "collect" | "burn", args: readonly unknown[]) => {
    const hash = await wallet.writeContract({ address, abi: miniPositionNftAbi, functionName: fn, args } as never);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    assert.equal(receipt.status, "success", `${fn} reverted`);
  };

  await send("mint", [devAccount, 1n, -600, 600, 1_000_000n]); // #1 in range
  await send("mint", [devAccount, 1n, 0, 60, 5_000n]); // #2 lower bound == 0 -> in
  await send("mint", [devAccount, 2n, -60, 0, 5_000n]); // #3 upper bound == 0 -> out

  const handle = createHandler({
    positionReader: createPositionReader({ rpcUrl: RPC!, chainId, contractAddress: address }),
  });
  const state = async (id: number) => {
    const res = await handle("GET", `/positions/${id}/state`);
    return { status: res.status, body: res.body as PositionStateResponse };
  };

  let s = await state(1);
  assert.equal(s.status, 200);
  assert.equal(s.body.owner, getAddress(devAccount));
  assert.equal(s.body.poolId, "1");
  assert.equal(s.body.tickLower, -600);
  assert.equal(s.body.tickUpper, 600);
  assert.equal(s.body.liquidity, "1000000");
  assert.equal(s.body.inRange, true);
  assert.deepEqual(s.body.uncollectedFees, { token0: "0", token1: "0" });
  assert.equal(s.body.contractAddress, address);
  assert.equal((await state(2)).body.inRange, true);
  assert.equal((await state(3)).body.inRange, false);

  // Partial withdraw: liquidity drops, mock fees accrue (delta / 1000).
  await send("decreaseLiquidity", [1n, 400_000n]);
  s = await state(1);
  assert.equal(s.body.liquidity, "600000");
  assert.deepEqual(s.body.uncollectedFees, { token0: "400", token1: "400" });

  // Full withdraw then collect, then burn (burn requires zero liquidity AND zero fees).
  await send("decreaseLiquidity", [1n, 600_000n]);
  s = await state(1);
  assert.equal(s.body.liquidity, "0");
  assert.deepEqual(s.body.uncollectedFees, { token0: "1000", token1: "1000" });
  await send("collect", [1n]);
  assert.deepEqual((await state(1)).body.uncollectedFees, { token0: "0", token1: "0" });
  await send("burn", [1n]);
  assert.equal((await state(1)).status, 404, "burned position must be 404");

  // Chain listener: ownership index follows Transfer logs, burn removes the record.
  const dbFile = join(mkdtempSync(join(tmpdir(), "mini-position-it-")), "db.json");
  const load = (): PositionDb => (existsSync(dbFile) ? JSON.parse(readFileSync(dbFile, "utf8")) : { positions: {}, cursor: 0 });
  const r = await ingestChainOnce({
    client: publicClient,
    config: { rpcUrl: RPC!, chainId, contractAddress: address },
    loadDb: load,
    saveDb: (db) => writeFileSync(dbFile, JSON.stringify(db)),
    startBlock: deployReceipt.blockNumber,
  });
  assert.equal(r.transfers, 4, "3 mints + 1 burn");
  const indexed = load();
  assert.deepEqual(Object.keys(indexed.positions).sort(), ["2", "3"]);
  assert.equal(indexed.positions["3"].owner, getAddress(devAccount));
  assert.equal(indexed.positions["3"].poolId, "2");

  // A second pass is a no-op (cursor persisted).
  const again = await ingestChainOnce({
    client: publicClient,
    config: { rpcUrl: RPC!, chainId, contractAddress: address },
    loadDb: load,
    saveDb: (db) => writeFileSync(dbFile, JSON.stringify(db)),
  });
  assert.equal(again.transfers, 0);
});
