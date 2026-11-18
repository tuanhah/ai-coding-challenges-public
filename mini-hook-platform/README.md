# mini-hook-platform

A simplified mock of a "hook platform" (AMM pool backend + frontend) used as
a hands-on codebase challenge. See `CHALLENGE.md` for the assignment.

## Structure

```
apps/
  mini-pool-activity-listener/   listener + DB for pool swap/donate events
  mini-position-listener/        listener + DB for LP position ownership
  mini-pool-curation/            listener-equivalent + DB + read/write API for pool curation
  mini-read-api-service/         read API (pool history + position ownership)
  mini-api-gateway/               edge layer, forwards requests to the above
  mini-site/                     Next.js frontend
packages/
  mini-contracts-mock/           minimal self-written Solidity LP-position NFT mock
infra/
  cdk-mini/                      AWS CDK stack (Lambda + HTTP API Gateway)
scripts/
  seed-demo-data.ts              generates demo events/data for local runs
```

## Prerequisites

- Node.js 20+
- npm 10+

## Install

```bash
npm install
```

(This installs all workspaces — `apps/*`, `packages/*`, `infra/*` — via npm
workspaces. `mini-site` additionally needs its own `npm install` inside
`apps/mini-site` the first time if you don't use workspace hoisting.)

## Run everything locally

```bash
# 1. generate demo on-chain-style event logs + seed curation data
npm run seed

# 2. ingest events into each listener's local DB file
cd apps/mini-pool-activity-listener && npm run ingest && cd -
cd apps/mini-position-listener && npm run ingest && cd -

# 3. start the backend services (separate terminals)
cd apps/mini-read-api-service && npm run dev   # :4001
cd apps/mini-pool-curation && npm run dev      # :4002
cd apps/mini-api-gateway && npm run dev        # :4000

# 4. start the frontend
cd apps/mini-site && npm install && npm run dev   # :3000
```

Visit `http://localhost:3000`.

## CDK (infra/cdk-mini)

```bash
cd infra/cdk-mini
npm install
npm run synth   # cdk synth — no AWS account/credentials required
```

## Contracts mock

```bash
cd packages/mini-contracts-mock
npm install
npm run build   # compiles MiniPositionNFT.sol with solc
```
