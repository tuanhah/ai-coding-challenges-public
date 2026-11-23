import { defineChain, getAddress, isAddress, type Address } from "viem";

// NEXT_PUBLIC_* are inlined into the browser bundle at build time: only public
// values here (chain id, a public RPC URL, the contract address). Never a key,
// never an RPC URL that embeds a provider API key.
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 1337);
const rpcUrl = process.env.NEXT_PUBLIC_CHAIN_RPC_URL ?? "http://localhost:8545";

export const appChain = defineChain({
  id: chainId,
  name: process.env.NEXT_PUBLIC_CHAIN_NAME ?? `mini-hook chain ${chainId}`,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
});

const rawAddress = process.env.NEXT_PUBLIC_POSITION_NFT_ADDRESS;

/** null when not configured; the withdraw controls then explain why they are disabled. */
export const positionNftAddress: Address | null = rawAddress && isAddress(rawAddress) ? getAddress(rawAddress) : null;
