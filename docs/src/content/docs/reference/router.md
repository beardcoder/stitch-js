---
title: Router
description: API reference for the hash-based client-side router.
---

A simple hash-based client-side router. Exposes a store-compatible interface so it works with `effect`, `computed`, and `ctx.sync`.

## `createRouter(patterns?)`

```ts
import { createRouter, effect } from "stitch-js";

const router = createRouter(["", "about", "users/:id"]);

effect([router], (route) => {
  console.log(route.path, route.params);
});

router.push("users/42"); // logs "users/42" { id: "42" }
```

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
