# mini-position-listener

Tracks current ownership of LP position NFTs (`MiniPositionNFT` in
`packages/mini-contracts-mock`) by ingesting mock `Transfer` events from a
local event log (see `scripts/seed-demo-data.ts`) into
`data/mini-position.json`.

This service **only** has a listener and a DB file — there is no HTTP read
route here. Reads for position ownership currently live in
`mini-read-api-service`.

## Run locally

```bash
npm install
npm run ingest
```
