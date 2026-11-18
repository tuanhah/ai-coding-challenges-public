import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { buildRouteTable, resolveTarget } from "./routes.js";

const PORT = Number(process.env.MINI_API_GATEWAY_PORT ?? 4000);
const routeTable = buildRouteTable();

async function forward(req: IncomingMessage, res: ServerResponse) {
  const path = req.url ?? "/";
  const targetBase = resolveTarget(path, routeTable);
  if (!targetBase) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "no route for path", path }));
    return;
  }

  const chunks: Buffer[] = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", async () => {
    const rawBody = Buffer.concat(chunks).toString("utf8");
    try {
      const upstream = await fetch(`${targetBase}${path}`, {
        method: req.method,
        headers: { "content-type": "application/json" },
        body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : rawBody,
      });
      const body = await upstream.text();
      res.writeHead(upstream.status, { "content-type": "application/json" });
      res.end(body);
    } catch (err) {
      res.writeHead(502, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "upstream unreachable", detail: String(err) }));
    }
  });
}

const server = createServer((req, res) => {
  forward(req, res);
});

server.listen(PORT, () => {
  console.log(`[mini-api-gateway] listening on http://localhost:${PORT}`);
  console.log("[mini-api-gateway] route table:", routeTable);
});
