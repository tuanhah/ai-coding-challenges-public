# mini-api-gateway

Dumb-pipe edge layer. Forwards each incoming request 1:1 to the backend
service that owns its path prefix — no business logic, no response
aggregation. This is an edge/API-gateway layer, not a bounded context.

| Path prefix | Forwards to |
|---|---|
| `/pools*` | `mini-read-api-service` |
| `/owners*` | `mini-read-api-service` |
| `/positions*` | `mini-read-api-service` |
| `/curations*` | `mini-pool-curation` |

## Run locally

```bash
npm install
npm run dev   # HTTP server on MINI_API_GATEWAY_PORT (default 4000)
```

Start `mini-read-api-service` and `mini-pool-curation` first (see their
READMEs) so there's something to forward to.
