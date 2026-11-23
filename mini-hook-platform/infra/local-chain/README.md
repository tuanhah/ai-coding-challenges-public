# infra/local-chain

Single geth node in `--dev` mode for local development and tests.

```bash
docker compose -f infra/local-chain/docker-compose.yml up -d    # start
docker compose -f infra/local-chain/docker-compose.yml down     # stop (wipes the chain)
```

- JSON-RPC: `http://127.0.0.1:8545` (bound to localhost only), chain id **1337**.
- One pre-funded developer account, unlocked inside the node. The deploy/mint
  scripts and the integration test sign through it with `eth_sendTransaction`,
  so no private key is ever handled by the repo, a script, or a `.env` file.
  It is geth's well-known deterministic dev account
  (`0x71562b71999873DB5b286dF957af199Ec94617F7`) whose key is public: local
  throwaway chains only.
- State is in memory: after a restart re-run `npm run deploy` and
  `npm run mint:demo` (packages/mini-contracts-mock).
- To withdraw from the UI with MetaMask, mint to your own address and fund it:
  `MINI_DEMO_OWNER=0xYou MINI_DEMO_FUND_ETH=10 npm run mint:demo -w packages/mini-contracts-mock`.

anvil works too (`anvil` → chain id 31337, also exposes unlocked accounts):
set `MINI_CHAIN_ID=31337` and `NEXT_PUBLIC_CHAIN_ID=31337`.
