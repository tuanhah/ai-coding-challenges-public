// Guards src/abi.ts (hand-maintained, `as const` for type inference) against
// drifting from what solc actually produces for MiniPositionNFT.sol.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { miniPositionNftAbi } from "../src/abi.ts";
import { ARTIFACT_FILE } from "../scripts/lib.ts";

function normalize(abi: readonly unknown[]): string[] {
  return abi.map((item) => JSON.stringify(sortKeys(item))).sort();
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortKeys(v)])
    );
  }
  return value;
}

test("src/abi.ts matches the compiled MiniPositionNFT ABI", { skip: !existsSync(ARTIFACT_FILE) && "run `npm run build` first" }, () => {
  const compiled = JSON.parse(readFileSync(ARTIFACT_FILE, "utf8")) as { abi: unknown[] };
  assert.deepEqual(normalize(miniPositionNftAbi), normalize(compiled.abi));
});
