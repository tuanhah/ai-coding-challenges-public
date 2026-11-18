# mini-pool-curation

Full bounded context for "is this pool approved to be listed": owns its own
DB (`data/mini-curation.json`), its own read API, AND its own write API
(submit/approve/reject) in one service — unlike the pool-activity/position
pair, this context was **not** split by read vs. write.

## Routes

- `GET /curations` — list all curation records
- `GET /curations/:poolId` — one record
- `POST /curations` `{ poolId, submittedBy }` — submit a pool for review
- `POST /curations/:poolId/approve` `{ reviewedBy }`
- `POST /curations/:poolId/reject` `{ reviewedBy }`

## Run locally

```bash
npm install
npm run dev   # HTTP server on MINI_POOL_CURATION_PORT (default 4002)
```
