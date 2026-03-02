---
title: Advanced Examples
description: Real-world patterns combining multiple stitch-js features.
---

## Composing Multiple Behaviors

Stack more than one behavior on the same element by calling `enhance` multiple times with different factories.

```html
<div data-card data-tooltip data-tooltip-text="More info">
  <h2>Card Title</h2>
  <p>Card content.</p>
</div>
```

```ts
import { enhance, defineComponent } from "stitch-js";

const highlight = defineComponent({}, (ctx) => {
  ctx.on("mouseenter", () => ctx.el.classList.add("is-highlighted"));
  ctx.on("mouseleave", () => ctx.el.classList.remove("is-highlighted"));
});

const tooltip = defineComponent({ position: "top" as "top" | "bottom" }, (ctx) => {
  const tip = document.createElement("span");
  tip.textContent = ctx.attr("tooltip-text") ?? "";
  tip.className = `tooltip tooltip--${ctx.options.position}`;
  ctx.on("mouseenter", () => ctx.el.appendChild(tip));
  ctx.on("mouseleave", () => tip.remove());
  ctx.onDestroy(() => tip.remove());
});

enhance("[data-card]", highlight());
enhance("[data-card]", tooltip());
```

Each factory attaches its own listeners and manages its own cleanup independently.

## Counter with Reactive Store

Combine `defineComponent` with `createStore` and `effect` to build a self-contained counter.

```html
<div data-counter>
  <button data-decrement>−</button>
  <span data-count>0</span>
  <button data-increment>+</button>
</div>
```

```ts
import { defineComponent, enhance, createStore, effect } from "stitch-js";

const counter = defineComponent({ start: 0 }, (ctx) => {
  const count = createStore(ctx.options.start);
  const display = ctx.query("[data-count]");

  const stopEffect = effect([count], (n) => {
    if (display) display.textContent = String(n);
  });

  ctx.on("click", "[data-increment]", () => count.update((n) => n + 1));
  ctx.on("click", "[data-decrement]", () => count.update((n) => n - 1));
  ctx.onDestroy(stopEffect);
});

enhance("[data-counter]", counter());
enhance("[data-counter][data-start]", counter({ start: 10 }));
```

## Theme Switcher with `persistedStore`

Persist user preferences to `localStorage` and keep the UI in sync across tabs.

```html
<button data-theme-toggle>Toggle theme</button>
```

```ts
import { defineComponent, enhance, persistedStore, effect } from "stitch-js";

const theme = persistedStore<"light" | "dark">("theme", "light");

// Apply the theme whenever it changes (including on initial load)
effect([theme], (value) => {
  document.documentElement.dataset.theme = value;
});

const themeToggle = defineComponent({}, (ctx) => {
  ctx.on("click", () => {
    theme.update((t) => (t === "light" ? "dark" : "light"));
  });
});

enhance("[data-theme-toggle]", themeToggle());
```

Changes are automatically synced to any other open browser tabs via the `storage` event.

## Route-Driven Content with the Router

Use `createRouter` together with `ctx.sync` to render different content depending on the current hash route.

```html
<nav>
  <a href="#/">Home</a>
  <a href="#/about">About</a>
  <a href="#/users/42">User 42</a>
</nav>

<main data-view></main>
```

```ts
import { defineComponent, enhance, createRouter } from "stitch-js";

const router = createRouter(["", "about", "users/:id"]);

const view = defineComponent({}, (ctx) => {
  ctx.sync(router, (route) => {
    if (route.pattern === "users/:id") {
      ctx.el.textContent = `User profile: ${route.params.id}`;
    } else if (route.pattern === "about") {
      ctx.el.textContent = "About page";
    } else {
      ctx.el.textContent = "Home page";
    }
  });
});

enhance("[data-view]", view());
```

`ctx.sync` fires immediately with the current route and re-fires on every navigation, with automatic cleanup when the component is destroyed.

## External Library Integration with `ctx.data`

Pass server-rendered configuration or datasets into a component and hand them off to an external library. `ctx.data<T>()` reads from a `<script type="application/json">` tag, a `data-props` attribute, or individual `data-*` attributes — in that priority order.

```html
<div data-chart data-props='{"type":"bar","labels":["Jan","Feb","Mar"],"values":[10,25,15]}'></div>
```

```ts
import { defineComponent, enhance } from "stitch-js";

interface ChartConfig {
  type: "bar" | "line";
  labels: string[];
  values: number[];
}

const chart = defineComponent({}, (ctx) => {
  const config = ctx.data<ChartConfig>();

  // Hand off to an external charting library
  const instance = new MyChartLibrary(ctx.el, config);
  ctx.onDestroy(() => instance.destroy());
});

enhance("[data-chart]", chart());
```

For larger payloads such as table rows or column definitions, use an inline `<script>` tag instead:

```html
<div data-table>
  <script type="application/json">
    {
      "columns": [
        { "header": "Name", "accessorKey": "name" },
        { "header": "Age",  "accessorKey": "age"  }
      ],
      "rows": [
        { "name": "Alice", "age": 30 },
        { "name": "Bob",   "age": 25 }
      ]
    }
  </script>
  <table><!-- server-rendered fallback --></table>
</div>
```

```ts
import { defineComponent, enhance } from "stitch-js";

const dataTable = defineComponent({}, (ctx) => {
  const { columns, rows } = ctx.data<{ columns: unknown[]; rows: unknown[] }>();
  // Pass to TanStack Table, AG Grid, or any other library...
});

enhance("[data-table]", dataTable());
```
