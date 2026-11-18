import { getPoolHistory } from "../../../lib/api";

export const dynamic = "force-dynamic";

export default async function PoolDetailPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  const events = await getPoolHistory(poolId);

  return (
    <main>
      <h2>Pool {poolId}</h2>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th>Type</th>
            <th>Amount0</th>
            <th>Amount1</th>
            <th>Price After</th>
            <th>Block</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.txHash}>
              <td>{e.type}</td>
              <td>{e.amount0}</td>
              <td>{e.amount1}</td>
              <td>{e.priceAfter}</td>
              <td>{e.blockNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {events.length === 0 && <p>No history yet for this pool.</p>}
    </main>
  );
}
