---
title: Getting Started
description: Install stitch-js and enhance your first HTML element.
---

## Installation

```bash
bun add @beardcoder/stitch-js
# or
npm install @beardcoder/stitch-js
```

## Quick Start

Add interactive behavior to your HTML with just a few lines of JavaScript:

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
  import { enhance, tabs } from "@beardcoder/stitch-js";
  enhance("[data-tabs]", tabs());
</script>
```

## Bundle Size

All sizes are minified + gzipped. Tree-shaking ensures you only pay for what you import.

| Import                                            |    min | min+gz      |
| ------------------------------------------------- | -----: | :---------- |
| Full bundle (everything)                          | 6,284 B | **2,709 B** |
| Core only (`enhance`, `defineComponent`, etc.)    | 2,130 B | **1,116 B** |
| Store only (`createStore`, `computed`, `effect`)  |   748 B | **361 B**   |
| Core + Tabs                                       | 2,789 B | **1,387 B** |
| Core + Accordion                                  | 2,841 B | **1,393 B** |
| Core + Form                                       | 2,571 B | **1,352 B** |
| Core + Animate                                    | 2,156 B | **1,131 B** |

## Auto-Initialization

For a declarative setup, use `register` and `autoInit`:

```ts
import { register, autoInit, tabs, accordion } from "@beardcoder/stitch-js";

register("[data-tabs]", tabs());
register("[data-accordion]", accordion());
autoInit(); // runs on DOMContentLoaded
```
