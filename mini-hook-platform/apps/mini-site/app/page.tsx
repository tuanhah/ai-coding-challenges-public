import { getPools } from "../lib/api";

export const dynamic = "force-dynamic";

export default async function PoolsPage() {
  const pools = await getPools();

  return (
    <main>
      <h2>Pools</h2>
      {pools.length === 0 && <p>No pools yet — run `npm run seed` then the listeners' `npm run ingest`.</p>}
      <ul>
        {pools.map((p) => (
          <li key={p.poolId} style={{ marginBottom: 8 }}>
            <a href={`/pools/${p.poolId}`} style={{ color: "#8ab4f8" }}>
              {p.poolId}
            </a>{" "}
            — {p.token0} / {p.token1}
          </li>
        ))}
      </ul>
    </main>
  );
}
