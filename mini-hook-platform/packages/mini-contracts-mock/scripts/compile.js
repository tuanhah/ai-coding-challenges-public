// Compiles MiniPositionNFT.sol with solc (pure JS/WASM, no native toolchain)
// and writes ABI + bytecode to build/MiniPositionNFT.json. Run: node scripts/compile.js
const fs = require("node:fs");
const path = require("node:path");
const solc = require("solc");

const contractPath = path.join(__dirname, "..", "contracts", "MiniPositionNFT.sol");
const source = fs.readFileSync(contractPath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "MiniPositionNFT.sol": { content: source },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

const errors = (output.errors || []).filter((e) => e.severity === "error");
if (errors.length > 0) {
  for (const e of errors) console.error(e.formattedMessage);
  process.exit(1);
}
for (const w of (output.errors || []).filter((e) => e.severity !== "error")) {
  console.warn(w.formattedMessage);
}

const contract = output.contracts["MiniPositionNFT.sol"]["MiniPositionNFT"];
const buildDir = path.join(__dirname, "..", "build");
fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(
  path.join(buildDir, "MiniPositionNFT.json"),
  JSON.stringify(
    { abi: contract.abi, bytecode: contract.evm.bytecode.object },
    null,
    2
  )
);
console.log("Compiled MiniPositionNFT.sol ->", path.join(buildDir, "MiniPositionNFT.json"));
