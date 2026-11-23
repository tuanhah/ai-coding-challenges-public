// Mints a fixed set of demo positions that exercise the in-range convention
// from CHALLENGE.md (currentTick = 0, inRange = tickLower <= 0 && 0 < tickUpper),
// including both boundaries.
//
//   MINI_DEMO_OWNER=<your wallet> MINI_DEMO_FUND_ETH=10 npm run mint:demo
//
// MINI_DEMO_OWNER defaults to the signer. When it is someone else (e.g. your
// MetaMask address) MINI_DEMO_FUND_ETH sends that much ETH for gas.
import { getAddress, isAddress, parseEther, parseEventLogs } from "viem";
import { miniPositionNftAbi } from "../src/abi.ts";
import { connect, resolveContractAddress } from "./lib.ts";

const DEMO_POSITIONS = [
  { label: "in range (straddles 0)", poolId: 1n, tickLower: -600, tickUpper: 600, liquidity: 1_000_000n },
  { label: "in range (lower bound == 0)", poolId: 1n, tickLower: 0, tickUpper: 600, liquidity: 500_000n },
  { label: "out of range (upper bound == 0)", poolId: 2n, tickLower: -600, tickUpper: 0, liquidity: 250_000n },
  { label: "out of range (above 0)", poolId: 2n, tickLower: 600, tickUpper: 1200, liquidity: 750_000n },
] as const;

const { chain, publicClient, walletClient, signer } = await connect();
const address = resolveContractAddress(chain.id);

const ownerEnv = process.env.MINI_DEMO_OWNER;
if (ownerEnv && !isAddress(ownerEnv)) throw new Error(`MINI_DEMO_OWNER is not an address: ${ownerEnv}`);
const owner = ownerEnv ? getAddress(ownerEnv) : signer;

const fundEth = process.env.MINI_DEMO_FUND_ETH;
if (fundEth && owner !== signer) {
  const hash = await walletClient.sendTransaction({ to: owner, value: parseEther(fundEth), account: walletClient.account!, chain });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Funded ${owner} with ${fundEth} ETH (tx ${hash})`);
}

console.log(`Minting demo positions on ${address} (chain ${chain.id}) to ${owner}`);
for (const p of DEMO_POSITIONS) {
  const hash = await walletClient.writeContract({
    address,
    abi: miniPositionNftAbi,
    functionName: "mint",
    args: [owner, p.poolId, p.tickLower, p.tickUpper, p.liquidity],
    account: walletClient.account!,
    chain,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`mint tx ${hash} reverted`);
  const [transfer] = parseEventLogs({ abi: miniPositionNftAbi, eventName: "Transfer", logs: receipt.logs });
  console.log(
    `  token #${transfer.args.tokenId}: pool ${p.poolId}, ticks [${p.tickLower}, ${p.tickUpper}), liquidity ${p.liquidity} — ${p.label}`
  );
}
