"use client";

import { useState } from "react";
import { getPositionsByOwner, type PositionOwnership } from "../../lib/api";

// Valid 20-byte (40 hex char) EVM address — verified with viem's isAddress().
const DEMO_OWNER = "0x00000000000000000000000000000000000000aa";

export default function PositionsPage() {
  const [address, setAddress] = useState(DEMO_OWNER);
  const [positions, setPositions] = useState<PositionOwnership[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const result = await getPositionsByOwner(address);
    setPositions(result);
    setLoaded(true);
  }

  return (
    <main>
      <h2>My Positions</h2>
      <div style={{ marginBottom: 16 }}>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ width: 360, marginRight: 8 }}
        />
        <button onClick={load}>Load positions</button>
      </div>

      {loaded && positions.length === 0 && <p>No positions for this address.</p>}

      <ul>
        {positions.map((p) => (
          <li key={p.tokenId} style={{ marginBottom: 12, border: "1px solid #333", padding: 12 }}>
            <div>Token #{p.tokenId} — pool {p.poolId}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              last transfer: block {p.lastBlockNumber}, tx {p.lastTxHash}
            </div>
            {/*
              TODO (Part A — candidate implements):
              - fetch range (tickLower/tickUpper), live liquidity, in/out-of-range,
                and accrued fees for this position and render them here.
              - add a "Decrease liquidity / Withdraw" control that calls
                MiniPositionNFT.decreaseLiquidity / collect / burn directly via
                a wallet client (wagmi/viem), NOT through the backend.
              Currently this view only has what mini-read-api-service's
              ownership-only route returns.
            */}
          </li>
        ))}
      </ul>
    </main>
  );
}
