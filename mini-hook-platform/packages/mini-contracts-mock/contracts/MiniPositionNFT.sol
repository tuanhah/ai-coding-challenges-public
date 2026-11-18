// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MiniPositionNFT
/// @notice Minimal, self-written mock of an LP-position NFT for the
///         mini-hook-platform demo. NOT Uniswap v4 code, no imports from the
///         Uniswap packages. Deliberately simplified: no real tick-math, no
///         real liquidity math — just enough state to exercise a withdraw flow.
contract MiniPositionNFT {
    struct Position {
        address owner;
        uint256 poolId;
        int24 tickLower;
        int24 tickUpper;
        uint128 liquidity;
        uint128 feesOwed0;
        uint128 feesOwed1;
        bool exists;
    }

    uint256 public nextTokenId = 1;
    mapping(uint256 => Position) public positions;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidityDelta, uint128 newLiquidity);
    event DecreaseLiquidity(uint256 indexed tokenId, uint128 liquidityDelta, uint128 newLiquidity);
    event Collect(uint256 indexed tokenId, uint128 amount0, uint128 amount1);
    event Burn(uint256 indexed tokenId);

    error NotOwner();
    error PositionNotFound();
    error InsufficientLiquidity();

    modifier onlyOwner(uint256 tokenId) {
        if (positions[tokenId].owner != msg.sender) revert NotOwner();
        _;
    }

    /// @notice Mints a new mock LP position NFT to `to`.
    function mint(
        address to,
        uint256 poolId,
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity
    ) external returns (uint256 tokenId) {
        tokenId = nextTokenId++;
        positions[tokenId] = Position({
            owner: to,
            poolId: poolId,
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidity: liquidity,
            feesOwed0: 0,
            feesOwed1: 0,
            exists: true
        });
        emit Transfer(address(0), to, tokenId);
        emit IncreaseLiquidity(tokenId, liquidity, liquidity);
    }

    /// @notice Adds liquidity to an existing position (mock — no token transfer accounting).
    function increaseLiquidity(uint256 tokenId, uint128 liquidityDelta) external onlyOwner(tokenId) {
        Position storage p = positions[tokenId];
        if (!p.exists) revert PositionNotFound();
        p.liquidity += liquidityDelta;
        emit IncreaseLiquidity(tokenId, liquidityDelta, p.liquidity);
    }

    /// @notice Removes liquidity from a position. Candidates wire the frontend
    ///         "Withdraw" button to call this directly (not through any backend).
    function decreaseLiquidity(uint256 tokenId, uint128 liquidityDelta) external onlyOwner(tokenId) {
        Position storage p = positions[tokenId];
        if (!p.exists) revert PositionNotFound();
        if (liquidityDelta > p.liquidity) revert InsufficientLiquidity();
        p.liquidity -= liquidityDelta;
        // mock fee accrual on every decrease, proportional to liquidity removed
        p.feesOwed0 += liquidityDelta / 1000;
        p.feesOwed1 += liquidityDelta / 1000;
        emit DecreaseLiquidity(tokenId, liquidityDelta, p.liquidity);
    }

    /// @notice Collects accrued mock fees for a position.
    function collect(uint256 tokenId) external onlyOwner(tokenId) returns (uint128 amount0, uint128 amount1) {
        Position storage p = positions[tokenId];
        if (!p.exists) revert PositionNotFound();
        amount0 = p.feesOwed0;
        amount1 = p.feesOwed1;
        p.feesOwed0 = 0;
        p.feesOwed1 = 0;
        emit Collect(tokenId, amount0, amount1);
    }

    /// @notice Burns a fully-withdrawn (zero liquidity, zero fees) position.
    function burn(uint256 tokenId) external onlyOwner(tokenId) {
        Position storage p = positions[tokenId];
        if (!p.exists) revert PositionNotFound();
        if (p.liquidity != 0 || p.feesOwed0 != 0 || p.feesOwed1 != 0) revert InsufficientLiquidity();
        address owner = p.owner;
        delete positions[tokenId];
        emit Transfer(owner, address(0), tokenId);
        emit Burn(tokenId);
    }

    /// @notice Mock transfer, mirrors ERC721 `transferFrom` minimally.
    function transferFrom(address from, address to, uint256 tokenId) external {
        Position storage p = positions[tokenId];
        if (!p.exists) revert PositionNotFound();
        if (p.owner != from || msg.sender != from) revert NotOwner();
        p.owner = to;
        emit Transfer(from, to, tokenId);
    }
}
