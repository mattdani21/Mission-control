import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Generated / build artifacts and the generated env declaration are
    // excluded from linting (the .next output and next-env.d.ts are produced
    // by Next.js tooling, not authored by hand).
    ignores: [".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
