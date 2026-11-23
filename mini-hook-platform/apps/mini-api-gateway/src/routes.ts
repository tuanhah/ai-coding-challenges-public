// Route table: path prefix -> downstream base URL. Pure 1:1 forwarding, no
// business logic, no aggregation — this is an edge/dumb-pipe layer, not a
// bounded context in its own right.
export interface Route {
  prefix: string;
  targetBaseUrl: string;
  /** Optional exact pattern, checked instead of the prefix (first match wins). */
  pattern?: RegExp;
}

export function buildRouteTable(): Route[] {
  const readApiUrl = process.env.MINI_READ_API_URL ?? "http://localhost:4001";
  const curationUrl = process.env.MINI_POOL_CURATION_URL ?? "http://localhost:4002";
  const positionUrl = process.env.MINI_POSITION_SERVICE_URL ?? "http://localhost:4003";

  return [
    // Live on-chain position state is owned by the Position context
    // (mini-position-listener). Listed before the /positions prefix.
    { prefix: "/positions", pattern: /^\/positions\/[^/]+\/state$/, targetBaseUrl: positionUrl },
    { prefix: "/pools", targetBaseUrl: readApiUrl },
    { prefix: "/owners", targetBaseUrl: readApiUrl },
    { prefix: "/positions", targetBaseUrl: readApiUrl },
    { prefix: "/curations", targetBaseUrl: curationUrl },
  ];
}

export function resolveTarget(path: string, table: Route[]): string | null {
  const pathname = path.split("?")[0];
  const match = table.find((r) =>
    r.pattern ? r.pattern.test(pathname) : pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );
  return match ? match.targetBaseUrl : null;
}
