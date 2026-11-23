/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The shared contract ABI is a TypeScript workspace package (no build step).
  transpilePackages: ["@mini-hook-platform/mini-contracts-mock"],
};

module.exports = nextConfig;
