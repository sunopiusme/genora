import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@genora/ui", "@genora/design-tokens", "@genora/utils"],
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/login", destination: "/", permanent: false },
      { source: "/verify", destination: "/", permanent: false },
      { source: "/dashboard", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
