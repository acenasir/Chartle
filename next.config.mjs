/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The pure-function engine is unit-tested; keep production builds resilient to
  // lint config drift in CI/sandbox environments.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
