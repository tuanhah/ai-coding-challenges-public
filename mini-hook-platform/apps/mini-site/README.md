# mini-site

Minimal Next.js (App Router) frontend:

- `/` — pool list
- `/pools/[poolId]` — pool swap/donate history
- `/positions` — "My Positions": connect a wallet, list owned LP position NFTs
  and, per position, its live state from `GET /positions/:tokenId/state`
  (tick range, in/out of range, liquidity, uncollected fees) plus a
  **Decrease liquidity / Withdraw** control.
- `/curation` — submit/approve/reject pools for listing (fully working
  reference flow).

The withdraw control (decrease / withdraw all + collect / collect / burn)
sends transactions from the user's injected wallet **directly to
MiniPositionNFT from the browser** via wagmi/viem — no backend route, server
action or route handler. Each action is simulated first, then signed, then the
backend state is re-read.

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000, expects mini-api-gateway on :4000
```

Env (public values only — `NEXT_PUBLIC_*` are inlined into the browser bundle):
`NEXT_PUBLIC_GATEWAY_URL` (default `http://localhost:4000`),
`NEXT_PUBLIC_CHAIN_ID` (default `1337`), `NEXT_PUBLIC_CHAIN_RPC_URL`
(default `http://localhost:8545`), `NEXT_PUBLIC_POSITION_NFT_ADDRESS`.

Deploy target: Vercel (`vercel --prod` or Git integration). Set
`NEXT_PUBLIC_GATEWAY_URL` to your deployed `mini-api-gateway` endpoint.
