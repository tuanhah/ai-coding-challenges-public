# mini-position-listener

Tracks current ownership of LP position NFTs (`MiniPositionNFT` in
`packages/mini-contracts-mock`) into `data/mini-position.json`, and serves the
**live on-chain state** of a position.

Ownership reads (`/owners/:address/positions`, `/positions/:tokenId`) are
still served by `mini-read-api-service` from this service's DB file.

## Live state — `GET /positions/:tokenId/state` (port 4003)

Read live from the contract — one `positions(tokenId)` call pinned to one
block, not re-derived from indexed events:

```json
{
  "tokenId": "1",
  "owner": "0x71562b71999873DB5b286dF957af199Ec94617F7",
  "poolId": "1",
  "tickLower": -600,
  "tickUpper": 600,
  "liquidity": "1000000",
  "currentTick": 0,
  "inRange": true,
  "uncollectedFees": { "token0": "0", "token1": "0" },
  "blockNumber": "7",
  "chainId": 1337,
  "contractAddress": "0xdB7d6AB1f17c6b31909aE466702703dAEf9269Cf"
}
```

- `inRange` uses the CHALLENGE.md convention: `currentTick = 0`,
  `inRange = tickLower <= 0 && 0 < tickUpper`.
- `uncollectedFees` = `feesOwed0` / `feesOwed1` (accrued, not yet collected).
- uint values are decimal strings (they overflow JS numbers; JSON has no bigint).
- `404` not on chain (never minted / burned), `400` malformed id, `503` no
  contract configured, `502` RPC failure (details logged, not returned).

Why here and not in `mini-read-api-service` or the gateway: live position
state is a *position* question, so it sits with the service that owns
position data; the read service groups routes by "read-only" (a technical
split), and the gateway carries no business logic.

## Listeners

- `npm run ingest` — original: tails the mock log `data/events-position.jsonl`
  written by `npm run seed`.
- `npm run ingest:chain [-- --watch]` — indexes real `Transfer` logs of
  `MINI_POSITION_NFT_ADDRESS` (current owner per token, burn removes it, block
  cursor). Use this when running against a chain, so "My Positions" lists the
  tokens that actually exist on it.

## Config

`MINI_CHAIN_RPC_URL` (default `http://localhost:8545`), `MINI_CHAIN_ID`
(default `1337`), `MINI_POSITION_NFT_ADDRESS`, `MINI_POSITION_SERVICE_PORT`
(default `4003`).

## Run locally

```bash
npm run ingest:chain -- --watch
npm run dev
npm test   # + MINI_IT_CHAIN_RPC_URL=http://localhost:8545 for the live-chain test
```
