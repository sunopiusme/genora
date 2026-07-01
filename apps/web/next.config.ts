import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@genora/ui", "@genora/design-tokens", "@genora/utils"],
};

export default nextConfig;
