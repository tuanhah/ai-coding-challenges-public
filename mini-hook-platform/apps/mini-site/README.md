# mini-site

Minimal Next.js (App Router) frontend:

- `/` — pool list
- `/pools/[poolId]` — pool swap/donate history
- `/positions` — "My Positions": shows owned LP position NFTs. Currently
  **ownership-only** (tokenId, pool, last transfer) — see the `TODO` in
  `app/positions/page.tsx` for what's missing (Part A).
- `/curation` — submit/approve/reject pools for listing (fully working
  reference flow).

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000, expects mini-api-gateway on :4000
```

Deploy target: Vercel (`vercel --prod` or Git integration). Set
`NEXT_PUBLIC_GATEWAY_URL` to your deployed `mini-api-gateway` endpoint.
