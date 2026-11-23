// Shared helpers for the deploy / mint scripts.
//
// Signer resolution (no key literal anywhere in the repo):
//   - DEPLOYER_PRIVATE_KEY set in the shell  -> local account (public testnets)
//   - otherwise                              -> the node's own unlocked account
//     (geth --dev / anvil expose one via eth_accounts), used through
//     eth_sendTransaction so the key never leaves the node.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  getAddress,
  http,
  isAddress,
  isHex,
  type Account,
  type Address,
  type Chain,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const ARTIFACT_FILE = join(PACKAGE_ROOT, "build", "MiniPositionNFT.json");

export function deploymentFile(chainId: number): string {
  return join(PACKAGE_ROOT, "build", `deployment.${chainId}.json`);
}

export interface Deployment {
  chainId: number;
  address: Address;
  txHash: Hex;
  blockNumber: string;
  deployer: Address;
}

export function chainFromEnv(): Chain {
  const rpcUrl = process.env.MINI_CHAIN_RPC_URL ?? "http://localhost:8545";
  const id = Number(process.env.MINI_CHAIN_ID ?? 1337);
  if (!Number.isInteger(id) || id <= 0) throw new Error(`MINI_CHAIN_ID must be a positive integer, got "${process.env.MINI_CHAIN_ID}"`);
  return defineChain({
    id,
    name: `mini-chain-${id}`,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  });
}

export async function connect() {
  const chain = chainFromEnv();
  const transport = http(chain.rpcUrls.default.http[0]);
  const publicClient = createPublicClient({ chain, transport });

  const nodeChainId = await publicClient.getChainId();
  if (nodeChainId !== chain.id) {
    throw new Error(`RPC reports chainId ${nodeChainId} but MINI_CHAIN_ID is ${chain.id}; refusing to continue.`);
  }

  let account: Account | Address;
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (pk) {
    if (!isHex(pk) || pk.length !== 66) throw new Error("DEPLOYER_PRIVATE_KEY must be a 0x-prefixed 32-byte hex string");
    account = privateKeyToAccount(pk);
  } else {
    const accounts = await createWalletClient({ chain, transport }).getAddresses(); // eth_accounts
    if (accounts.length === 0) {
      throw new Error("No DEPLOYER_PRIVATE_KEY set and the node exposes no unlocked account (expected geth --dev or anvil).");
    }
    account = getAddress(accounts[0]);
  }

  const walletClient = createWalletClient({ account, chain, transport });
  const signer = typeof account === "string" ? account : account.address;
  return { chain, publicClient, walletClient, signer };
}

export function loadArtifact(): { abi: unknown[]; bytecode: Hex } {
  if (!existsSync(ARTIFACT_FILE)) throw new Error(`Missing ${ARTIFACT_FILE}; run \`npm run build\` first.`);
  const raw = JSON.parse(readFileSync(ARTIFACT_FILE, "utf8")) as { abi: unknown[]; bytecode: string };
  return { abi: raw.abi, bytecode: `0x${raw.bytecode.replace(/^0x/, "")}` as Hex };
}

export function resolveContractAddress(chainId: number): Address {
  const fromEnv = process.env.MINI_POSITION_NFT_ADDRESS;
  if (fromEnv && fromEnv !== "REPLACE_ME") {
    if (!isAddress(fromEnv)) throw new Error(`MINI_POSITION_NFT_ADDRESS is not an address: ${fromEnv}`);
    return getAddress(fromEnv);
  }
  const file = deploymentFile(chainId);
  if (!existsSync(file)) throw new Error(`Set MINI_POSITION_NFT_ADDRESS or run \`npm run deploy\` first (no ${file}).`);
  return (JSON.parse(readFileSync(file, "utf8")) as Deployment).address;
}
