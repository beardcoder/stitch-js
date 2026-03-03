---
title: Router
description: API reference for the hash-based client-side router.
---

A simple hash-based client-side router. Exposes a store-compatible interface so it works with `effect`, `computed`, and `ctx.sync`.

## `createRouter(patterns?, options?)`

```ts
import { createRouter, effect } from "@beardcoder/stitch-js";

const router = createRouter(["", "about", "users/:id"]);

effect([router], (route) => {
  console.log(route.path, route.params);
});

router.push("users/42"); // logs "users/42" { id: "42" }
```

### Parameters

| Parameter  | Type              | Default | Description                          |
| ---------- | ----------------- | ------- | ------------------------------------ |
| `patterns` | `string[]`        | `[]`    | Route patterns to match against      |
| `options`  | `RouterOptions`   | `{}`    | Optional configuration               |

### `RouterOptions`

| Property | Type     | Default     | Description                                              |
| -------- | -------- | ----------- | -------------------------------------------------------- |
| `key`    | `string` | `undefined` | Namespace key for multi-router support (see below)       |

## Route State

| Property  | Type                     | Description                                       |
| --------- | ------------------------ | ------------------------------------------------- |
| `path`    | `string`                 | The full hash path (without the leading `#`)      |
| `params`  | `Record<string, string>` | Named params extracted from the pattern           |
| `pattern` | `string`                 | The matched pattern, or `""` if none matched      |

## Methods

| Method               | Description                     |
| -------------------- | ------------------------------- |
| `router.get()`       | Get the current route state     |
| `router.subscribe(fn)` | Subscribe to route changes    |
| `router.push(path)`  | Navigate to a hash path         |
| `router.destroy()`   | Stop listening to hash changes  |

## Multiple Routers

By default all router instances share the full `location.hash`. When you need
independent routers — for example one for tabs and another for an accordion —
pass a unique `key` to each router. Keyed routers encode their state in the
hash using a `key=value` format separated by `&`.

```ts
import { createRouter } from "@beardcoder/stitch-js";

const tabRouter = createRouter(["tab1", "tab2", "tab3"], { key: "tabs" });
const accordionRouter = createRouter(["section1", "section2"], { key: "accordion" });

tabRouter.push("tab2");
// hash → #tabs=tab2

accordionRouter.push("section1");
// hash → #tabs=tab2&accordion=section1

tabRouter.get().path;       // "tab2"
accordionRouter.get().path; // "section1"
```

Each keyed router reads and writes only its own portion of the hash, so
pushing to one router never affects another. Values are automatically
URI-encoded and decoded for correctness with special characters.
