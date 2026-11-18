# Codebase Challenge: mini-hook-platform

You've been given a small, working mock of an on-chain "hook platform":
pool activity tracking, LP position ownership, pool curation, and a
frontend — see `README.md` for how to run it locally.

## Part A — Ship a feature: "LP Position Detail + Withdraw"

Right now, the "My Positions" page (`apps/mini-site/app/positions/page.tsx`)
only shows which LP-position NFTs an address owns (token ID, pool, last
transfer). It does **not** show the position's current range, liquidity, or
accrued fees, and there is **no way to withdraw liquidity**.

Your task:

1. **Backend** — add a route that returns the live state of one LP
   position: its tick range, current liquidity, whether it's in or out of
   range, and accrued (uncollected) fees. Read this live from the mock
   contract (`packages/mini-contracts-mock`) — do not try to re-derive it
   from indexed events.

   > **"In range" convention (read this before implementing).**
   > `MiniPositionNFT` is a deliberately simplified mock: it tracks each
   > position's `tickLower`/`tickUpper`, but there is no pool-level
   > "current tick/price" concept anywhere in the contract or the demo
   > data — this is a documented simplification of the mock, not
   > something you need to derive from on-chain state. For this
   > challenge, treat the pool's current tick as a **fixed `currentTick
   > = 0`** when computing in/out-of-range status, i.e.:
   > `inRange = tickLower <= 0 && 0 < tickUpper`. Use exactly this
   > convention so your result is comparable to any other submission.
2. **Frontend** — extend the "My Positions" view to display that data, and
   add a "Decrease liquidity / Withdraw" control. The withdraw action must
   call the mock contract **directly from the browser** (e.g. via a wallet
   client such as wagmi/viem), not through any backend route.
3. **Deploy**:
   - Frontend → **Vercel**.
   - Backend → **AWS** (a CDK stack already exists at `infra/cdk-mini` for
     reference; extend or replace it as needed for your route).

Where you add the backend route is part of what we're evaluating — make a
deliberate choice and be ready to explain it.

**Secrets/keys hygiene.** Never hardcode or commit any private key literal
— including well-known local devnet test keys (e.g. the default
anvil/hardhat test accounts) — anywhere in your diff. If you need a signer
to demo the withdraw flow against a local chain (e.g. `anvil`), supply the
key via an environment variable (e.g. `anvil --mnemonic "..."` or a local,
untracked `.env` you load at runtime), not as a string literal in
source/tests/scripts. Submissions that commit a private key literal, even
a throwaway/well-known test one, will fail the automated secrets check.

## Part B — Design question (no code required)

> If this system (the 3 backend services + gateway + frontend you just
> worked with) were redesigned as microservices to scale into the future —
> for example read traffic increasing 100x, or adding many new hook/pool
> types — how would you split and scale it? List or diagram the services,
> and for each one state what domain question it answers and for whom.

Answer in your PR description or a short `PART_B.md`. There's no single
"correct" diagram we're grading against — we're looking at your reasoning.

## Submitting

Open a PR against this repo with your changes for Part A, and include your
Part B answer in the PR description.

When you're done, email **particle4dev@gmail.com** with a link to your PR
(or fork). Questions about the challenge while you're working on it go to
the same address.
