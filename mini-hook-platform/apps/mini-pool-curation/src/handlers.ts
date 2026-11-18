import { loadDb, saveDb } from "./db.js";
import type { Curation } from "./types.js";

export interface HandlerResponse {
  status: number;
  body: unknown;
}

export function handleRequest(method: string, path: string, rawBody: string): HandlerResponse {
  const parts = path.split("/").filter(Boolean);
  const db = loadDb();

  // GET /curations
  if (method === "GET" && parts[0] === "curations" && parts.length === 1) {
    return { status: 200, body: { curations: Object.values(db.curations) } };
  }

  // GET /curations/:poolId
  if (method === "GET" && parts[0] === "curations" && parts.length === 2) {
    const c = db.curations[parts[1]];
    if (!c) return { status: 404, body: { error: "not found" } };
    return { status: 200, body: c };
  }

  // POST /curations  { poolId, submittedBy }
  if (method === "POST" && parts[0] === "curations" && parts.length === 1) {
    const payload = JSON.parse(rawBody || "{}") as { poolId?: string; submittedBy?: string };
    if (!payload.poolId || !payload.submittedBy) {
      return { status: 400, body: { error: "poolId and submittedBy are required" } };
    }
    const curation: Curation = {
      poolId: payload.poolId,
      status: "pending",
      submittedBy: payload.submittedBy,
      submittedAt: Date.now(),
    };
    db.curations[payload.poolId] = curation;
    saveDb(db);
    return { status: 201, body: curation };
  }

  // POST /curations/:poolId/approve  { reviewedBy }
  if (method === "POST" && parts[0] === "curations" && parts[2] === "approve") {
    const poolId = parts[1];
    const existing = db.curations[poolId];
    if (!existing) return { status: 404, body: { error: "not found" } };
    const payload = JSON.parse(rawBody || "{}") as { reviewedBy?: string };
    existing.status = "approved";
    existing.reviewedBy = payload.reviewedBy ?? "unknown";
    existing.reviewedAt = Date.now();
    saveDb(db);
    return { status: 200, body: existing };
  }

  // POST /curations/:poolId/reject  { reviewedBy }
  if (method === "POST" && parts[0] === "curations" && parts[2] === "reject") {
    const poolId = parts[1];
    const existing = db.curations[poolId];
    if (!existing) return { status: 404, body: { error: "not found" } };
    const payload = JSON.parse(rawBody || "{}") as { reviewedBy?: string };
    existing.status = "rejected";
    existing.reviewedBy = payload.reviewedBy ?? "unknown";
    existing.reviewedAt = Date.now();
    saveDb(db);
    return { status: 200, body: existing };
  }

  return { status: 404, body: { error: "not found" } };
}
