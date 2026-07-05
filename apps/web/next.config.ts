import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@genora/ui", "@genora/design-tokens", "@genora/utils"],
  reactStrictMode: true,
};

export default nextConfig;
