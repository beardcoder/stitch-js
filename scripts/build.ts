import { $ } from "bun";

// Clean dist
await $`rm -rf dist`;

// Build with Bun — barrel entries are excluded because Bun's code-splitting
// produces broken re-export files (missing import for the shared chunk).
await Bun.build({
  root: "./src",
  entrypoints: [
    "./src/core/enhance.ts",
    "./src/core/auto.ts",
    "./src/core/component.ts",
    "./src/core/store.ts",
    "./src/core/persisted.ts",
    "./src/core/router.ts",
    "./src/components/tabs.ts",
    "./src/components/accordion.ts",
    "./src/components/form.ts",
    "./src/components/animate.ts",
    "./src/utils/dom.ts",
  ],
  outdir: "dist",
  format: "esm",
  splitting: true,
  sourcemap: "external",
  minify: true,
  target: "browser",
});

// Generate passthrough barrel files so that the package entry points
// ("." and "./core") re-export correctly instead of containing broken
// single-letter variable names from Bun's code-splitting.
const barrels: Record<string, string> = {
  "dist/index.js": [
    `export { enhance, destroyAll } from "./core/enhance.js";`,
    `export { register, init, autoInit } from "./core/auto.js";`,
    `export { defineComponent } from "./core/component.js";`,
    `export { createStore, computed, effect } from "./core/store.js";`,
    `export { persistedStore } from "./core/persisted.js";`,
    `export { createRouter } from "./core/router.js";`,
    `export { tabs } from "./components/tabs.js";`,
    `export { accordion } from "./components/accordion.js";`,
    `export { form } from "./components/form.js";`,
    `export { animate } from "./components/animate.js";`,
    `export { queryAll, setAria, uid } from "./utils/dom.js";`,
  ].join("\n") + "\n",
  "dist/core/index.js": [
    `export { enhance, destroyAll } from "./enhance.js";`,
    `export { register, init, autoInit } from "./auto.js";`,
    `export { defineComponent } from "./component.js";`,
    `export { createStore, computed, effect } from "./store.js";`,
    `export { persistedStore } from "./persisted.js";`,
    `export { createRouter } from "./router.js";`,
  ].join("\n") + "\n",
};

for (const [path, content] of Object.entries(barrels)) {
  await Bun.write(path, content);
}

// Generate type declarations
await $`tsc --emitDeclarationOnly`;

console.log("Build complete.");
