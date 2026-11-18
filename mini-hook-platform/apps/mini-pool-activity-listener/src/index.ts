import { ingestOnce } from "./ingest.js";

const result = ingestOnce();
console.log(
  `[mini-pool-activity-listener] ingest run complete: ${result.ingestedPools} pool(s), ${result.ingestedEvents} event(s). ` +
    `No read API in this service — see README.md.`
);
