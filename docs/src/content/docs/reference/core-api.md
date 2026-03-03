---
title: Core API
description: API reference for enhance, destroyAll, register, init, autoInit, and defineComponent.
---

## `enhance(selector, factory, options?)`

Find all elements matching `selector` and attach the component `factory` to each. Idempotent — calling twice on the same element is a no-op.

```ts
import { enhance } from "@beardcoder/stitch-js";
import { accordion } from "@beardcoder/stitch-js/components/accordion";

const instances = enhance("[data-accordion]", accordion({ multiple: true }));
instances.forEach((i) => i.destroy());
```

**Options:**

| Option    | Description                                |
| --------- | ------------------------------------------ |
| `root`    | Scope the query to a subtree (default: `document`) |
| `options` | Override the factory options                |

## `destroyAll(selector, factory?, root?)`

Destroy all enhanced instances on matching elements. Pass a `factory` to only remove that behavior.

## `register` / `init` / `autoInit`

Declarative auto-initialization:

```ts
import { register, autoInit, tabs, accordion } from "@beardcoder/stitch-js";

register("[data-tabs]", tabs());
register("[data-accordion]", accordion());
autoInit(); // runs on DOMContentLoaded
```

## `defineComponent(defaults, setup)`

The core primitive for creating components. Provides a scoped `ComponentContext` with DOM queries, delegated events, attribute parsing, and auto-cleanup.

```ts
import { defineComponent, enhance } from "@beardcoder/stitch-js";

const toggle = defineComponent(
  { activeClass: "is-active" },
  (ctx) => {
    ctx.on("click", () => {
      ctx.el.classList.toggle(ctx.options.activeClass);
    });
  },
);

enhance("[data-toggle]", toggle());
```

See the [Custom Components guide](/stitch-js/guides/custom-components/) for the full `ComponentContext` API reference.
