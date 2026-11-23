// HTTP route of the Position bounded context: the LIVE state of one LP
// position, read from MiniPositionNFT on chain at request time
// (CHALLENGE.md: do not re-derive it from indexed events).
//
// It lives here, next to this service's ownership listener, rather than in
// mini-read-api-service ("it's read-only") or mini-api-gateway (no business
// logic at the edge): it answers a position question.
import { createPositionReader, type PositionReader } from "./chain.js";
import { chainConfigFromEnv } from "./config.js";
import { toPositionState } from "./position-state.js";

export interface HandlerResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

export interface HandlerDeps {
  /** null when no contract is configured; the route then answers 503. */
  positionReader: PositionReader | null;
}

const MAX_UINT256 = (1n << 256n) - 1n;

function parseTokenId(raw: string): bigint | null {
  if (!/^\d{1,78}$/.test(raw)) return null;
  const id = BigInt(raw);
  return id <= MAX_UINT256 ? id : null;
}

export function createHandler(deps: HandlerDeps) {
  return async function handleRequest(method: string, rawPath: string): Promise<HandlerResponse> {
    const parts = rawPath.split("?")[0].split("/").filter(Boolean);

    // GET /positions/:tokenId/state
    if (method === "GET" && parts[0] === "positions" && parts.length === 3 && parts[2] === "state") {
      const tokenId = parseTokenId(parts[1]);
      if (tokenId === null) return { status: 400, body: { error: "tokenId must be a uint256 in decimal" } };
      if (!deps.positionReader) {
        return { status: 503, body: { error: "chain not configured (set MINI_POSITION_NFT_ADDRESS / MINI_CHAIN_RPC_URL)" } };
      }
      try {
        const { position, blockNumber } = await deps.positionReader.readPosition(tokenId);
        // Burned and never-minted ids both read back as an all-zero struct.
        if (!position.exists) return { status: 404, body: { error: "position not found on chain", tokenId: parts[1] } };
        return {
          status: 200,
          body: toPositionState(tokenId, position, {
            blockNumber,
            chainId: deps.positionReader.chainId,
            contractAddress: deps.positionReader.contractAddress,
          }),
          headers: { "cache-control": "no-store" },
        };
      } catch (err) {
        // Details stay in the server log: RPC errors can echo the RPC URL,
        // which may embed a provider API key.
        console.error("[position-service] chain read failed:", err);
        return { status: 502, body: { error: "chain read failed" } };
      }
    }

    return { status: 404, body: { error: "not found" } };
  };
}

let defaultHandler: ReturnType<typeof createHandler> | undefined;

/** Handler wired to the chain configured in env. */
export function handleRequest(method: string, path: string): Promise<HandlerResponse> {
  if (!defaultHandler) {
    let reader: PositionReader | null = null;
    try {
      const config = chainConfigFromEnv();
      reader = config ? createPositionReader(config) : null;
    } catch (err) {
      console.error("[position-service] invalid chain config, live state disabled:", err instanceof Error ? err.message : err);
    }
    defaultHandler = createHandler({ positionReader: reader });
  }
  return defaultHandler(method, path);
}
