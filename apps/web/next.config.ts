import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

function loadWorkspaceEnv(): void {
  const workspaceRoot = path.resolve(__dirname, "../..");
  const files = [".env", ".env.local", ".env.development.local"];
  for (const file of files) {
    const filePath = path.join(workspaceRoot, file);
    if (!fs.existsSync(filePath)) {
      continue;
    }
    for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
      const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line.trim());
      if (!match) {
        continue;
      }
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) {
        continue;
      }
      process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  }
}

loadWorkspaceEnv();

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
