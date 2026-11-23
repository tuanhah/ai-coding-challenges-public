"use client";

import { useConnect, useConnection, useConnectors, useDisconnect, useSwitchChain } from "wagmi";
import { appChain } from "../../lib/chain";

export function WalletBar() {
  const { address, chainId, isConnected } = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();

  if (!isConnected) {
    const injected = connectors[0];
    return (
      <div style={bar}>
        <button
          data-testid="connect-wallet"
          disabled={!injected || connect.isPending}
          onClick={() => injected && connect.mutate({ connector: injected, chainId: appChain.id })}
        >
          {connect.isPending ? "Connecting…" : "Connect wallet"}
        </button>
        <span style={muted}>Needed to withdraw. Viewing positions works without it.</span>
        {connect.error && <span style={errorText}>{connect.error.message.split("\n")[0]}</span>}
      </div>
    );
  }

  return (
    <div style={bar}>
      <span data-testid="connected-address">Connected: {address}</span>
      {chainId !== appChain.id ? (
        <button onClick={() => switchChain.mutate({ chainId: appChain.id })}>
          Switch to {appChain.name} ({appChain.id})
        </button>
      ) : (
        <span style={muted}>chain {chainId}</span>
      )}
      <button onClick={() => disconnect.mutate()}>Disconnect</button>
    </div>
  );
}

const bar = { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" as const, marginBottom: 16, fontSize: 14 };
const muted = { opacity: 0.7, fontSize: 12 };
const errorText = { color: "#f28b82", fontSize: 12 };
