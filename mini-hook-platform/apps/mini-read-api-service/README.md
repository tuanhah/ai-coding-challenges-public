# mini-read-api-service

Serves the read-only HTTP routes for both pool activity and LP position
ownership:

- `GET /pools` — list known pools
- `GET /pools/:poolId/history` — swap/donate history for a pool
- `GET /owners/:address/positions` — positions owned by an address
- `GET /positions/:tokenId` — ownership snapshot for one position

This service was split out from `mini-pool-activity-listener` and
`mini-position-listener` so that read traffic could be cached and scaled
independently from the write/indexing side later, without touching the
listeners. Both routes above are read-only, so they were grouped here
together.

## Run locally

```bash
npm install
npm run dev   # starts an HTTP server on MINI_READ_API_PORT (default 4001)
```

Requires `data/mini-pool-activity.json` and `data/mini-position.json` to
already exist — run the listener apps' `npm run ingest` first (after
`npm run seed` at the repo root).
