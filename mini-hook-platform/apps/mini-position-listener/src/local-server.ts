import { createServer } from "node:http";
import { handleRequest } from "./handlers.js";

const PORT = Number(process.env.MINI_POSITION_SERVICE_PORT ?? 4003);

const server = createServer(async (req, res) => {
  const result = await handleRequest(req.method ?? "GET", req.url ?? "/");
  res.writeHead(result.status, { "content-type": "application/json", ...result.headers });
  res.end(JSON.stringify(result.body));
});

server.listen(PORT, () => {
  console.log(`[mini-position-service] listening on http://localhost:${PORT}`);
});
