"use client";

import { useCallback, useEffect, useState } from "react";
import { isAddress } from "viem";
import { useConnection } from "wagmi";
import { getPositionsByOwner, type PositionOwnership } from "../../lib/api";
import { PositionCard } from "./PositionCard";
import { WalletBar } from "./WalletBar";

// Valid 20-byte (40 hex char) EVM address — verified with viem's isAddress().
const DEMO_OWNER = "0x00000000000000000000000000000000000000aa";

export default function PositionsPage() {
  const { address: connected } = useConnection();
  const [address, setAddress] = useState(DEMO_OWNER);
  const [positions, setPositions] = useState<PositionOwnership[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async (owner: string) => {
    const result = await getPositionsByOwner(owner);
    setPositions(result);
    setLoaded(true);
  }, []);

  // Default the lookup to the connected wallet.
  useEffect(() => {
    if (connected) {
      setAddress(connected);
      void load(connected);
    }
  }, [connected, load]);

  const valid = isAddress(address, { strict: false });

  return (
    <main>
      <h2>My Positions</h2>
      <WalletBar />
      <div style={{ marginBottom: 16 }}>
        <input
          data-testid="owner-address"
          value={address}
          onChange={(e) => setAddress(e.target.value.trim())}
          style={{ width: 360, marginRight: 8 }}
        />
        <button data-testid="load-positions" disabled={!valid} onClick={() => load(address)}>
          Load positions
        </button>
        {!valid && <span style={{ color: "#f28b82", fontSize: 12, marginLeft: 8 }}>Not an address</span>}
      </div>

      {loaded && positions.length === 0 && <p data-testid="no-positions">No positions for this address.</p>}

      <ul style={{ padding: 0 }}>
        {positions.map((p) => (
          <PositionCard key={p.tokenId} position={p} onChanged={() => load(address)} />
        ))}
      </ul>
    </main>
  );
}
