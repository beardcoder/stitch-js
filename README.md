# stitch-js

A tiny, composable progressive enhancement framework for the browser.

Enhance existing HTML with interactive behavior — without a virtual DOM, SPA framework, or build step requirement.

## Features

- **Progressive enhancement first** — HTML works without JS
- **Generic component model** — `defineComponent` gives you scoped queries, delegated events, attribute parsing, and auto-cleanup
- **Reactive store** — `createStore`, `computed`, and `effect` for state management
- **Tree-shakeable** — import only what you use
- **Accessible** — ARIA-aware utilities built in
- **Tiny** — minimal runtime, no dependencies
- **TypeScript** — strict types and great DX
- **Composable** — stack multiple behaviors on one element
- **Idempotent** — safe to call `enhance()` multiple times

## Install

```bash
bun add stitch-js
# or
npm install stitch-js
```

## Quick Start

```html
<div data-tabs>
  <div data-tab-list>
    <button data-tab>One</button>
    <button data-tab>Two</button>
  </div>
  <div data-tab-panel>Content one</div>
  <div data-tab-panel>Content two</div>
</div>

<script type="module">
  import { enhance, tabs } from "stitch-js";
  enhance("[data-tabs]", tabs());
</script>
```

## Core API

### `enhance(selector, factory, options?)`

Find all elements matching `selector` and attach the component `factory` to each. Idempotent — calling twice on the same element is a no-op.

```ts
import { enhance } from "stitch-js";
import { accordion } from "stitch-js/components/accordion";

const instances = enhance("[data-accordion]", accordion({ multiple: true }));
instances.forEach((i) => i.destroy());
```

**Options:**
- `root` — scope the query to a subtree (default: `document`)
- `options` — override the factory options

### `destroyAll(selector, factory?, root?)`

Destroy all enhanced instances on matching elements. Pass a `factory` to only remove that behavior.

### `register` / `init` / `autoInit`

Declarative auto-initialization:

```ts
import { register, autoInit, tabs, accordion } from "stitch-js";

register("[data-tabs]", tabs());
register("[data-accordion]", accordion());
autoInit(); // runs on DOMContentLoaded
```

---

## `defineComponent` — Generic Component Builder

The core primitive for creating components. Provides a scoped `ComponentContext` with DOM queries, delegated event handling, attribute parsing, and automatic cleanup.

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

| Method | Description |
|---|---|
| `ctx.el` | The root HTMLElement |
| `ctx.options` | Resolved options (defaults + overrides) |
| `ctx.query(selector)` | `querySelector` scoped to root |
| `ctx.queryAll(selector)` | `querySelectorAll` scoped to root |
| `ctx.attr(name, fallback?)` | Read a `data-*` attribute |
| `ctx.attrJson(name)` | Read + JSON.parse a `data-*` attribute |
| `ctx.on(event, handler)` | Attach event listener (auto-cleanup) |
| `ctx.on(event, selector, handler)` | Delegated event listener (auto-cleanup) |
| `ctx.aria(el, attrs)` | Set `aria-*` attributes |
| `ctx.uid(prefix?)` | Generate a unique ID |
| `ctx.onDestroy(fn)` | Register cleanup callback |
| `ctx.emit(name, detail?)` | Dispatch a CustomEvent from root |

The setup function can also return a cleanup function directly:

```ts
const counter = defineComponent({ start: 0 }, (ctx) => {
  const interval = setInterval(() => { /* ... */ }, 1000);
  return () => clearInterval(interval);
});
```

---

## Reactive Store

A minimal, dependency-free reactive primitive.

### `createStore(initial)`

```ts
import { createStore } from "stitch-js";

const count = createStore(0);

count.get();            // 0
count.set(1);           // updates + notifies
count.update(n => n + 1); // transform + notify

const unsub = count.subscribe((value, prev) => {
  console.log(`${prev} → ${value}`);
});
unsub(); // stop listening
```

### `computed(sources, derive)`

Derived read-only store that auto-updates when sources change.

```ts
import { createStore, computed } from "stitch-js";

const firstName = createStore("Jane");
const lastName = createStore("Doe");

const fullName = computed(
  [firstName, lastName],
  (first, last) => `${first} ${last}`,
);

fullName.get(); // "Jane Doe"
firstName.set("John");
fullName.get(); // "John Doe"
```

### `effect(sources, fn)`

Run a side-effect when sources change. Runs immediately, re-runs on change, and supports cleanup.

```ts
import { createStore, effect } from "stitch-js";

const theme = createStore("light");

const stop = effect([theme], (value) => {
  document.documentElement.dataset.theme = value;
  return () => {
    // cleanup before re-run or on stop
  };
});

theme.set("dark"); // side-effect fires
stop();            // tear down
```

### Combining store with components

```ts
import { defineComponent, enhance, createStore, effect } from "stitch-js";

const counter = defineComponent({ start: 0 }, (ctx) => {
  const count = createStore(ctx.options.start);
  const display = ctx.query("[data-count]");

  const stopEffect = effect([count], (n) => {
    if (display) display.textContent = String(n);
  });

  ctx.on("click", "[data-increment]", () => count.update(n => n + 1));
  ctx.on("click", "[data-decrement]", () => count.update(n => n - 1));
  ctx.onDestroy(stopEffect);
});

enhance("[data-counter]", counter());
```

---

## Example Components

The built-in components are examples built on `defineComponent`. Use them directly or as reference for your own.

### Tabs

```html
<div data-tabs>
  <div data-tab-list>
    <button data-tab>Tab 1</button>
    <button data-tab>Tab 2</button>
  </div>
  <div data-tab-panel>Panel 1</div>
  <div data-tab-panel>Panel 2</div>
</div>
```

```ts
enhance("[data-tabs]", tabs({ defaultIndex: 0 }));
```

**Options:** `listSelector`, `tabSelector`, `panelSelector`, `defaultIndex`
Keyboard: Arrow Left/Right, Home, End.

### Accordion

```html
<div data-accordion>
  <div data-accordion-item>
    <button data-accordion-trigger>Section 1</button>
    <div data-accordion-content>Content</div>
  </div>
</div>
```

```ts
enhance("[data-accordion]", accordion({ multiple: false }));
```

**Options:** `itemSelector`, `triggerSelector`, `contentSelector`, `multiple`
Keyboard: Arrow Up/Down, Home, End.

### Form

```html
<form data-form action="/api/contact" method="post">
  <input name="email" type="email" required />
  <button type="submit">Send</button>
</form>
```

```ts
enhance("[data-form]", form({
  onSuccess: (el, res) => console.log("Sent!", res),
  onError: (el, err) => console.error("Failed", err),
}));
```

### Animate

```html
<div data-animate class="fade-in">Appears on scroll</div>
```

```css
.fade-in { opacity: 0; transition: opacity 0.4s ease; }
.fade-in.is-visible { opacity: 1; }
```

```ts
enhance("[data-animate]", animate({ once: true }));
```

---

## Writing Custom Components

Use `defineComponent` for scoped DOM access, delegated events, and auto-cleanup:

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

Or use the low-level `ComponentFactory` type for maximum control:

```ts
import type { ComponentFactory } from "stitch-js";

function myBehavior(): ComponentFactory {
  return (el) => {
    // attach behavior...
    return { destroy() { /* cleanup */ } };
  };
}
```

## Development

```bash
bun install
bun test
bun run build
bun run typecheck
```

## License

MIT
