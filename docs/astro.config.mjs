import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://beardcoder.github.io",
  base: "/stitch-js",
  integrations: [
    starlight({
      title: "stitch-js",
      description:
        "A tiny, composable progressive enhancement framework for the browser",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/beardcoder/stitch-js",
        },
      ],
      sidebar: [
        {
          label: "Guides",
          items: [
            { label: "Getting Started", slug: "guides/getting-started" },
            { label: "Custom Components", slug: "guides/custom-components" },
            { label: "Advanced Examples", slug: "guides/advanced-examples" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Core API", slug: "reference/core-api" },
            { label: "Components", slug: "reference/components" },
            { label: "Store", slug: "reference/store" },
            { label: "Router", slug: "reference/router" },
            { label: "Logger", slug: "reference/logger" },
          ],
        },
      ],
    }),
  ],
});
