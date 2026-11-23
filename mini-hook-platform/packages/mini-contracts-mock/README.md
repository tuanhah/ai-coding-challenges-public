# mini-contracts-mock

Minimal, self-written Solidity mock (`contracts/MiniPositionNFT.sol`) of an
LP-position NFT. **Not** Uniswap v4 code — no `@uniswap/*` imports, no real
tick-math. Just enough state (`owner`, `poolId`, `tickLower`, `tickUpper`,
`liquidity`, `feesOwed0`, `feesOwed1`) to exercise mint / increase / decrease
/ collect / burn and a `Transfer` event, which is what the listener apps and
the frontend withdraw flow hook into.

## Build

```bash
npm install
npm run build   # compiles with solc (pure JS/WASM), writes build/MiniPositionNFT.json
```

## ABI, deploy, mint

- `src/abi.ts` — typed ABI, imported as `@mini-hook-platform/mini-contracts-mock/abi`
  by the position service and mini-site; `npm test` checks it against the solc output.
- `npm run deploy` — deploys to `MINI_CHAIN_RPC_URL` (default
  `http://localhost:8545`, chain `MINI_CHAIN_ID`, default 1337) and writes
  `build/deployment.<chainId>.json`.
- `npm run mint:demo` — mints 4 positions covering the in-range convention and
  both boundaries; `MINI_DEMO_OWNER` (default: the signer) and
  `MINI_DEMO_FUND_ETH` (gas for that owner).

Signing: on geth `--dev` / anvil leave `DEPLOYER_PRIVATE_KEY` unset — the
node's unlocked account signs via `eth_sendTransaction`. On a public testnet,
export `DEPLOYER_PRIVATE_KEY` in your shell only; never commit it.
