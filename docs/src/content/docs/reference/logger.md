---
title: Logger
description: API reference for createLogger — a styled, tree-shakeable console logger with colored badges and level filtering.
---

A lightweight console logger that adds **colored badges**, **level labels**, and **level filtering** on top of the native `console` API. Because it lives in its own module, bundlers tree-shake it out of production builds when you don't import it.

## Quick start

```ts
import { createLogger } from "stitch-js/utils/logger";

const log = createLogger({ prefix: "app" });

log.debug("boot sequence");       // grey  — DEBUG
log.info("server listening");     // blue  — INFO
log.warn("deprecated API used");  // amber — WARN
log.error("connection refused");  // red   — ERROR
```

Each call produces a styled badge (your prefix) followed by a colored level label in the browser console.

## `createLogger(options?)`

Create a new logger instance.

```ts
import { createLogger } from "stitch-js/utils/logger";

const log = createLogger({
  prefix: "myapp",   // badge text (default: "stitch")
  level: "info",     // minimum level to output (default: "debug")
  color: "#059669",  // badge background color (default: "#6d28d9")
});
```

**Options:**

| Option   | Default     | Description                                           |
| -------- | ----------- | ----------------------------------------------------- |
| `prefix` | `"stitch"`  | Text shown in the colored badge                       |
| `level`  | `"debug"`   | Minimum log level — messages below this are silenced  |
| `color`  | `"#6d28d9"` | CSS background color for the badge                    |

**Returns:** a `Logger` object with `debug`, `info`, `warn`, `error`, and `setLevel` methods.

## Log levels

Messages are only output when their severity meets or exceeds the configured minimum level.

| Level   | Severity | Console method | Badge color |
| ------- | -------- | -------------- | ----------- |
| `debug` | 0        | `console.log`  | Grey        |
| `info`  | 1        | `console.info` | Blue        |
| `warn`  | 2        | `console.warn` | Amber       |
| `error` | 3        | `console.error`| Red         |

```ts
const log = createLogger({ level: "warn" });

log.debug("ignored");  // ✗ below threshold
log.info("ignored");   // ✗ below threshold
log.warn("shown");     // ✓
log.error("shown");    // ✓
```

## `logger.setLevel(level)`

Change the minimum log level at runtime — useful for toggling verbose output during development.

```ts
const log = createLogger({ level: "error" });

log.info("hidden");        // silent

log.setLevel("debug");
log.info("now visible");   // outputs
```

## Tree-shaking

The logger is a standalone module. If you only import it where needed, bundlers will drop it from pages that don't use it:

```ts
// ✅ Tree-shakeable — only pulled in when imported
import { createLogger } from "stitch-js/utils/logger";
```

You can also import it from the main entry point:

```ts
import { createLogger } from "stitch-js";
```

## Using with components

```ts
import { defineComponent, enhance } from "stitch-js";
import { createLogger } from "stitch-js/utils/logger";

const log = createLogger({ prefix: "widget" });

const widget = defineComponent({}, (ctx) => {
  log.info("mounted", ctx.el);

  ctx.on("click", () => {
    log.debug("clicked", ctx.el);
  });

  ctx.onDestroy(() => {
    log.info("destroyed");
  });
});

enhance("[data-widget]", widget());
```
