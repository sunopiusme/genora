import { fileURLToPath } from "node:url";
import path from "node:path";
import { FlatCompat } from "@eslint/eslintrc";

const baseDirectory = path.dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({ baseDirectory });

export default [
  {
    ignores: ["node_modules", ".next", "dist", "storybook-static"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
