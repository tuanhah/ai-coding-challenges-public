import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { appChain } from "./chain";

// Browser-side wallet config. The withdraw flow signs and sends transactions
// through the user's injected wallet (MetaMask etc.) straight to the chain —
// there is no backend route or server action in that path.
export const wagmiConfig = createConfig({
  chains: [appChain],
  connectors: [injected()],
  transports: { [appChain.id]: http() },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
