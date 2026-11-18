import { createServer } from "node:http";
import { handleRequest } from "./handlers.js";

const PORT = Number(process.env.MINI_POOL_CURATION_PORT ?? 4002);

const server = createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const rawBody = Buffer.concat(chunks).toString("utf8");
    const result = handleRequest(req.method ?? "GET", req.url ?? "/", rawBody);
    res.writeHead(result.status, { "content-type": "application/json" });
    res.end(JSON.stringify(result.body));
  });
});

server.listen(PORT, () => {
  console.log(`[mini-pool-curation] listening on http://localhost:${PORT}`);
});
