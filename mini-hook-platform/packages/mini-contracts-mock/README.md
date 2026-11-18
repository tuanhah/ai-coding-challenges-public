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
