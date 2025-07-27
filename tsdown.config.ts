import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/empty.ts",
    "src/recipes/*",
    "src/hooks/index.ts",
    "src/types/helpers.ts",
    "src/utils/index.ts",
    "src/components/index.ts",
  ],
  sourcemap: true,
  clean: true,
  dts: true,
  format: ["esm"],
  // target: "es2022",
  target: false,
  minify: true,
});
