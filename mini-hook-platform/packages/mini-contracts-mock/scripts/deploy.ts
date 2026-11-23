// Deploys MiniPositionNFT to the chain at MINI_CHAIN_RPC_URL and records the
// address in build/deployment.<chainId>.json (gitignored).
//
//   npm run build && npm run deploy
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { getAddress } from "viem";
import { connect, deploymentFile, loadArtifact, type Deployment } from "./lib.ts";

const { chain, publicClient, walletClient, signer } = await connect();
const { abi, bytecode } = loadArtifact();

const hash = await walletClient.deployContract({ abi, bytecode, account: walletClient.account!, chain });
const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== "success" || !receipt.contractAddress) {
  throw new Error(`Deployment transaction ${hash} failed (status ${receipt.status}).`);
}

const address = getAddress(receipt.contractAddress); // EIP-55 checksummed
const deployment: Deployment = {
  chainId: chain.id,
  address,
  txHash: hash,
  blockNumber: receipt.blockNumber.toString(),
  deployer: signer,
};
const file = deploymentFile(chain.id);
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, JSON.stringify(deployment, null, 2));

console.log(`MiniPositionNFT deployed on chain ${chain.id} at block ${receipt.blockNumber}`);
console.log(`  deployer: ${signer}`);
console.log(`  tx:       ${hash}`);
console.log(`  saved:    ${file}`);
console.log("\nExport for the services / frontend:");
console.log(`  export MINI_POSITION_NFT_ADDRESS=${address}`);
console.log(`  export NEXT_PUBLIC_POSITION_NFT_ADDRESS=${address}`);
