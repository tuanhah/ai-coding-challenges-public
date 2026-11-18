import { ingestOnce } from "./ingest.js";

const result = ingestOnce();
console.log(
  `[mini-position-listener] ingest run complete: ${result.ingestedTransfers} transfer(s). ` +
    `No read API in this service — see README.md.`
);
