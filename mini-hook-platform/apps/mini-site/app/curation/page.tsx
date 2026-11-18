"use client";

import { useEffect, useState } from "react";
import { getCurations, reviewCuration, submitCuration, type Curation } from "../../lib/api";

export default function CurationPage() {
  const [curations, setCurations] = useState<Curation[]>([]);
  const [poolId, setPoolId] = useState("");

  async function refresh() {
    setCurations(await getCurations());
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <main>
      <h2>Pool Curation</h2>

      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="poolId to submit"
          value={poolId}
          onChange={(e) => setPoolId(e.target.value)}
          style={{ width: 240, marginRight: 8 }}
        />
        <button
          onClick={async () => {
            await submitCuration(poolId, "demo-submitter");
            setPoolId("");
            refresh();
          }}
        >
          Submit
        </button>
      </div>

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th>Pool</th>
            <th>Status</th>
            <th>Submitted by</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {curations.map((c) => (
            <tr key={c.poolId}>
              <td>{c.poolId}</td>
              <td>{c.status}</td>
              <td>{c.submittedBy}</td>
              <td>
                {c.status === "pending" && (
                  <>
                    <button onClick={async () => { await reviewCuration(c.poolId, "approve", "demo-curator"); refresh(); }}>
                      Approve
                    </button>{" "}
                    <button onClick={async () => { await reviewCuration(c.poolId, "reject", "demo-curator"); refresh(); }}>
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
