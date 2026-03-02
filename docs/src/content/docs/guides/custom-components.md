---
title: Custom Components
description: Build your own components using defineComponent and the low-level ComponentFactory type.
---

## Using `defineComponent`

`defineComponent` is the core primitive for creating components. It provides a scoped `ComponentContext` with DOM queries, delegated event handling, attribute parsing, and automatic cleanup.

```ts
import { defineComponent, enhance } from "stitch-js";

const toggle = defineComponent(
  { activeClass: "is-active" },   // typed defaults
  (ctx) => {
    ctx.on("click", () => {
      ctx.el.classList.toggle(ctx.options.activeClass);
    });
  },
);

enhance("[data-toggle]", toggle());
enhance("[data-toggle]", toggle({ activeClass: "open" }));
```

### ComponentContext

Every setup function receives a `ctx` with these methods:

| Method                          | Description                                            |
| ------------------------------- | ------------------------------------------------------ |
| `ctx.el`                        | The root HTMLElement                                   |
| `ctx.options`                   | Resolved options (defaults + overrides)                |
| `ctx.query(selector)`           | `querySelector` scoped to root                         |
| `ctx.queryAll(selector)`        | `querySelectorAll` scoped to root                      |
| `ctx.attr(name, fallback?)`     | Read a `data-*` attribute                              |
| `ctx.attrJson(name)`            | Read + JSON.parse a `data-*` attribute                 |
| `ctx.on(event, handler)`        | Attach event listener (auto-cleanup)                   |
| `ctx.on(event, selector, handler)` | Delegated event listener (auto-cleanup)             |
| `ctx.aria(el, attrs)`           | Set `aria-*` attributes                                |
| `ctx.uid(prefix?)`              | Generate a unique ID                                   |
| `ctx.onDestroy(fn)`             | Register cleanup callback                              |
| `ctx.emit(name, detail?)`       | Dispatch a CustomEvent from root                       |
| `ctx.sync(store, listener)`     | Subscribe to a store (auto-cleanup on destroy)         |
| `ctx.data<T>()`                 | Read structured data from HTML (see below)             |

The setup function can also return a cleanup function directly:

```ts
const counter = defineComponent({ start: 0 }, (ctx) => {
  const interval = setInterval(() => { /* ... */ }, 1000);
  return () => clearInterval(interval);
});
```

## `ctx.data<T>()` — Passing Data from HTML to JS

Pass structured data from server-rendered HTML into your components. This is essential for integrating external libraries (TanStack Table, charts, maps, etc.) that need configuration or datasets.

`ctx.data<T>()` reads from three sources in priority order:

1. **`<script type="application/json">`** — best for large payloads (column defs, row data, etc.)
2. **`data-props` attribute** — convenient for smaller inline JSON
3. **All `data-*` attributes** — automatic fallback, camelCased keys

```html
<!-- Option 1: Script tag for large/complex data -->
<div data-table>
  <script type="application/json">
    {
      "columns": [
        { "header": "Name", "accessorKey": "name" },
        { "header": "Age", "accessorKey": "age" }
      ],
      "rows": [
        { "name": "Alice", "age": 30 },
        { "name": "Bob", "age": 25 }
      ],
      "endpoint": "/api/users"
    }
  </script>
  <table><!-- server-rendered fallback rows --></table>
</div>

<!-- Option 2: data-props attribute for smaller payloads -->
<div data-chart data-props='{"type":"bar","labels":["A","B","C"]}'></div>

<!-- Option 3: Individual data attributes (auto-collected) -->
<div data-map data-lat="48.137" data-lng="11.576" data-zoom="12"></div>
```

```ts
import { defineComponent, enhance } from "stitch-js";

// TanStack Table example
const dataTable = defineComponent({}, (ctx) => {
  const { columns, rows, endpoint } = ctx.data<{
    columns: ColumnDef[];
    rows: Row[];
    endpoint: string;
  }>();

  const table = createTable({ columns, data: rows });
  // render table into ctx.el ...
});

enhance("[data-table]", dataTable());
```

## Tooltip Example

Here is a full custom component example:

```ts
import { defineComponent, enhance } from "stitch-js";

const tooltip = defineComponent(
  { position: "top" as "top" | "bottom" },
  (ctx) => {
    const tip = document.createElement("span");
    tip.textContent = ctx.attr("tooltip") ?? "";
    tip.className = `tooltip tooltip--${ctx.options.position}`;

    ctx.on("mouseenter", () => ctx.el.appendChild(tip));
    ctx.on("mouseleave", () => tip.remove());
    ctx.onDestroy(() => tip.remove());
  },
);

enhance("[data-tooltip]", tooltip());
enhance("[data-tooltip-bottom]", tooltip({ position: "bottom" }));
```

## Low-Level `ComponentFactory`

For maximum control, use the `ComponentFactory` type directly:

```ts
import type { ComponentFactory } from "stitch-js";

function myBehavior(): ComponentFactory {
  return (el) => {
    // attach behavior...
    return { destroy() { /* cleanup */ } };
  };
}
```
