# Part B — Redesigning as microservices

## The problem with the current split

`mini-read-api-service` serves pool **and** position reads by opening the DB
files of two other services (`mini-pool-activity-listener`,
`mini-position-listener`). That is a shared database across service
boundaries:

- **Coupling:** a listener cannot change its schema or storage without
  breaking a service it does not own.
- **No independent deploys:** the read service only works when it runs next
  to the other services' files. On Lambda those files simply are not there.
- **Wrong boundary:** services are grouped by *technical shape* ("read-only"),
  not by domain, so one domain change touches two services.

Its stated benefit, "scale reads independently", does not need the merge:
each domain can scale its own read side.

**Fix:** one service per domain. Each service owns its data, ingestion, read
API and (where it has one) write API — the shape `mini-pool-curation` already
has. Services never read each other's stores; they integrate through events
or published APIs. `mini-read-api-service` goes away: its routes move into the
services that own the data.

## Services

```
            ┌──────── Edge: CDN + API Gateway (routing, auth, rate limit, cache) ────────┐
UI ────────▶│   /pools*          /owners* /positions*      /curations*       /discovery   │
            └─────┬──────────────────┬───────────────────────┬──────────────────┬───────┘
                  ▼                  ▼                       ▼                  ▼
           Pool Activity          Position               Curation        Pool Discovery
            (own store)          (own store)            (own store)       (read model)
                  ▲                  ▲                       │                  ▲
                  └──── events ──────┴──── Event bus ◀──────┘─────── events ────┘
                                          ▲
                              Chain Ingestion (per chain)
                                          ▲
wallet ── signed tx (direct) ──▶  EVM chain
```

| Service | Domain question it answers | For whom | Owns |
|---|---|---|---|
| **Chain Ingestion** *(platform)* | What did the chain emit, in order, and is it final? | The domain services | Block cursor, reorg handling, normalized event stream |
| **Pool Activity** | Which pools exist, what happened in pool X, what are its stats? | Traders, analytics, pool pages | Pool registry, swap/donate history, aggregates |
| **Position** | What does wallet W own? What is position N's live state? | LPs ("My Positions") | Ownership index, position projections, live contract reads |
| **Curation** | Is pool X approved for listing, by whom, when? | Curators (write), UI and Discovery (read) | Curation records + audit log; publishes approval events |
| **Pool Discovery** *(add when needed)* | Which pools should the app list, with what headline stats? | Home page | Listing view built from Pool Activity + Curation **events** |
| **Edge / API Gateway** *(not a domain)* | — | All clients | Routing, CORS, auth, rate limits, caching; no business logic |

Withdrawals stay wallet → contract; no service sits in the money path.

## Scaling

**Read traffic ×100**
- Each service scales its own read side independently (stateless compute plus
  its own replicas, projections or cache). This is CQRS *inside* a service,
  never a shared read service across domains.
- Cache at the edge by block: finalized history is immutable (long TTL), and
  "latest" data gets a TTL of about one block.
- Position live reads: cache per `(tokenId, block)`, batch with multicall, use
  an RPC provider pool. Push updates to the UI (SSE) instead of polling.

**Many new hook / pool types**
- Ingestion is config-driven: a new contract is a registry entry, not new code.
- Pool Activity adds one decoder per hook type, mapped to a common event
  model, so a new hook type does not require a new service.
- Add a new service only when a hook brings a new domain question (e.g. limit
  orders → an Orders service).

## Rules that keep it microservices

- **Database per service.** Cross-service data flows only through events or
  APIs.
- **Idempotent, ordered events** keyed by `(chainId, txHash, logIndex)`, so
  consumers can replay and roll back on reorgs.
- **Split by domain question, not by read/write** — and not one service per
  endpoint.
