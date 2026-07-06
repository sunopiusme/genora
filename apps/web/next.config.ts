import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@genora/ui", "@genora/design-tokens", "@genora/utils"],
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/login", destination: "/dashboard", permanent: false },
      { source: "/verify", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
