---
title: Store
description: API reference for createStore, computed, effect, persistedStore, and ctx.sync.
---

A minimal, dependency-free reactive primitive.

## `createStore(initial)`

```ts
import { createStore } from "@beardcoder/stitch-js";

const count = createStore(0);

count.get();               // 0
count.set(1);              // updates + notifies
count.update(n => n + 1);  // transform + notify

const unsub = count.subscribe((value, prev) => {
  console.log(`${prev} → ${value}`);
});
unsub(); // stop listening
```

## `computed(sources, derive)`

Derived read-only store that auto-updates when sources change.

```ts
import { createStore, computed } from "@beardcoder/stitch-js";

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

## `effect(sources, fn)`

Run a side-effect when sources change. Runs immediately, re-runs on change, and supports cleanup.

```ts
import { createStore, effect } from "@beardcoder/stitch-js";

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

## Combining Store with Components

```ts
import { defineComponent, enhance, createStore, effect } from "@beardcoder/stitch-js";

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

## `ctx.sync(store, listener)`

Subscribe to a store inside a component with automatic cleanup on destroy. The listener fires immediately with the current value and re-fires on every change.

```ts
import { defineComponent, enhance, createStore } from "@beardcoder/stitch-js";

const count = createStore(0);

const display = defineComponent({}, (ctx) => {
  ctx.sync(count, (n) => {
    ctx.el.textContent = String(n);
  });
});

enhance("[data-display]", display());
count.set(5); // all [data-display] elements update to "5"
```

## `persistedStore(key, initial, options?)`

A reactive store that persists its value to `localStorage` (or `sessionStorage`) and syncs across browser tabs via the `storage` event. It implements the same `Store` interface, so it works with `effect`, `computed`, and `ctx.sync`.

```ts
import { persistedStore, effect } from "@beardcoder/stitch-js";

const theme = persistedStore("theme", "light");

theme.get();        // reads from localStorage, or falls back to "light"
theme.set("dark");  // updates localStorage + notifies subscribers

// Works with effect, computed, ctx.sync — just like createStore
effect([theme], (value) => {
  document.documentElement.dataset.theme = value;
});
```

**Options:**

| Option        | Default          | Description                                           |
| ------------- | ---------------- | ----------------------------------------------------- |
| `storage`     | `localStorage`   | Storage backend (`localStorage` or `sessionStorage`)  |
| `serialize`   | `JSON.stringify`  | Custom value → string serializer                      |
| `deserialize` | `JSON.parse`      | Custom string → value deserializer                    |
