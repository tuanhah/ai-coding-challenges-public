# mini-api-gateway

Dumb-pipe edge layer. Forwards each incoming request 1:1 to the backend
service that owns its path prefix — no business logic, no response
aggregation. This is an edge/API-gateway layer, not a bounded context.

| Path prefix | Forwards to |
|---|---|
| `/positions/:tokenId/state` | `mini-position-listener` (live on-chain position state) |
| `/pools*` | `mini-read-api-service` |
| `/owners*` | `mini-read-api-service` |
| `/positions*` | `mini-read-api-service` |
| `/curations*` | `mini-pool-curation` |

## Run locally

```bash
npm install
npm run dev   # HTTP server on MINI_API_GATEWAY_PORT (default 4000)
```

Start `mini-read-api-service`, `mini-pool-curation` and
`mini-position-listener` (`npm run dev`) first (see their READMEs) so there's
something to forward to. Responses carry CORS headers
(`MINI_CORS_ALLOW_ORIGIN`, default `*`) because mini-site calls the gateway
from the browser.
