// Typed ABI of contracts/MiniPositionNFT.sol, shared by the position service
// (live reads) and mini-site (wallet writes). Written `as const` so viem/wagmi
// infer argument and return types. test/abi.test.ts checks it against the
// solc output (build/MiniPositionNFT.json), so it cannot drift from the source.
export const miniPositionNftAbi = [
  {
    type: "function",
    name: "nextTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "positions",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "poolId", type: "uint256", internalType: "uint256" },
      { name: "tickLower", type: "int24", internalType: "int24" },
      { name: "tickUpper", type: "int24", internalType: "int24" },
      { name: "liquidity", type: "uint128", internalType: "uint128" },
      { name: "feesOwed0", type: "uint128", internalType: "uint128" },
      { name: "feesOwed1", type: "uint128", internalType: "uint128" },
      { name: "exists", type: "bool", internalType: "bool" },
    ],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "poolId", type: "uint256", internalType: "uint256" },
      { name: "tickLower", type: "int24", internalType: "int24" },
      { name: "tickUpper", type: "int24", internalType: "int24" },
      { name: "liquidity", type: "uint128", internalType: "uint128" },
    ],
    outputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "increaseLiquidity",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256", internalType: "uint256" },
      { name: "liquidityDelta", type: "uint128", internalType: "uint128" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "decreaseLiquidity",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256", internalType: "uint256" },
      { name: "liquidityDelta", type: "uint128", internalType: "uint128" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "collect",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "amount0", type: "uint128", internalType: "uint128" },
      { name: "amount1", type: "uint128", internalType: "uint128" },
    ],
  },
  {
    type: "function",
    name: "burn",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "transferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address", internalType: "address" },
      { name: "to", type: "address", internalType: "address" },
      { name: "tokenId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "Transfer",
    anonymous: false,
    inputs: [
      { name: "from", type: "address", indexed: true, internalType: "address" },
      { name: "to", type: "address", indexed: true, internalType: "address" },
      { name: "tokenId", type: "uint256", indexed: true, internalType: "uint256" },
    ],
  },
  {
    type: "event",
    name: "IncreaseLiquidity",
    anonymous: false,
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "liquidityDelta", type: "uint128", indexed: false, internalType: "uint128" },
      { name: "newLiquidity", type: "uint128", indexed: false, internalType: "uint128" },
    ],
  },
  {
    type: "event",
    name: "DecreaseLiquidity",
    anonymous: false,
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "liquidityDelta", type: "uint128", indexed: false, internalType: "uint128" },
      { name: "newLiquidity", type: "uint128", indexed: false, internalType: "uint128" },
    ],
  },
  {
    type: "event",
    name: "Collect",
    anonymous: false,
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "amount0", type: "uint128", indexed: false, internalType: "uint128" },
      { name: "amount1", type: "uint128", indexed: false, internalType: "uint128" },
    ],
  },
  {
    type: "event",
    name: "Burn",
    anonymous: false,
    inputs: [{ name: "tokenId", type: "uint256", indexed: true, internalType: "uint256" }],
  },
  { type: "error", name: "InsufficientLiquidity", inputs: [] },
  { type: "error", name: "NotOwner", inputs: [] },
  { type: "error", name: "PositionNotFound", inputs: [] },
] as const;
