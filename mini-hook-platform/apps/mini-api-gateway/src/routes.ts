// Route table: path prefix -> downstream base URL. Pure 1:1 forwarding, no
// business logic, no aggregation — this is an edge/dumb-pipe layer, not a
// bounded context in its own right.
export interface Route {
  prefix: string;
  targetBaseUrl: string;
}

export function buildRouteTable(): Route[] {
  const readApiUrl = process.env.MINI_READ_API_URL ?? "http://localhost:4001";
  const curationUrl = process.env.MINI_POOL_CURATION_URL ?? "http://localhost:4002";

  return [
    { prefix: "/pools", targetBaseUrl: readApiUrl },
    { prefix: "/owners", targetBaseUrl: readApiUrl },
    { prefix: "/positions", targetBaseUrl: readApiUrl },
    { prefix: "/curations", targetBaseUrl: curationUrl },
  ];
}

export function resolveTarget(path: string, table: Route[]): string | null {
  const match = table.find((r) => path === r.prefix || path.startsWith(`${r.prefix}/`));
  return match ? match.targetBaseUrl : null;
}
