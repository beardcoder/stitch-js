import { $ } from "bun";

// Clean dist
await $`rm -rf dist`;

// Build with Bun
await Bun.build({
  entrypoints: [
    "src/index.ts",
    "src/core/index.ts",
    "src/core/store.ts",
    "src/core/persisted.ts",
    "src/core/router.ts",
    "src/components/tabs.ts",
    "src/components/accordion.ts",
    "src/components/form.ts",
    "src/components/animate.ts",
    "src/utils/logger.ts",
  ],
  outdir: "dist",
  format: "esm",
  splitting: true,
  sourcemap: "external",
  minify: false,
  target: "browser",
});

// Generate type declarations
await $`tsc --emitDeclarationOnly`;

console.log("Build complete.");
