# mini-pool-activity-listener

Ingests mock `Swap`/`Donate` events for pools (from a local event log, see
`scripts/seed-demo-data.ts` at the repo root) and persists them to
`data/mini-pool-activity.json`.

This service **only** has a listener and a DB file — there is no HTTP read
route here. Reads for pool activity currently live in
`mini-read-api-service` (see that service's README for why).

## Run locally

```bash
npm install   # from repo root, or inside this folder
npm run ingest
```

Re-run `npm run ingest` any time after adding more lines to the event log
(e.g. after `npm run seed` at the repo root) to pick up new events.
