import { createServer } from "node:http";
import { handleRequest } from "./handlers.js";

const PORT = Number(process.env.MINI_READ_API_PORT ?? 4001);

const server = createServer((req, res) => {
  const result = handleRequest(req.method ?? "GET", req.url ?? "/");
  res.writeHead(result.status, { "content-type": "application/json" });
  res.end(JSON.stringify(result.body));
});

server.listen(PORT, () => {
  console.log(`[mini-read-api-service] listening on http://localhost:${PORT}`);
});
