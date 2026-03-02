# stitch-js

A tiny, composable progressive enhancement framework for the browser.

Enhance existing HTML with interactive behavior — tabs, accordions, forms, animations — without a virtual DOM, SPA framework, or build step requirement.

## Features

- **Progressive enhancement first** — HTML works without JS
- **Tree-shakeable** — import only what you use
- **Accessible** — ARIA roles and keyboard navigation built in
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

## API

### `enhance(selector, factory, options?)`

Find all elements matching `selector` and attach the component `factory` to each.

```ts
import { enhance } from "stitch-js";
import { accordion } from "stitch-js/components/accordion";

const instances = enhance("[data-accordion]", accordion({ multiple: true }));

// Tear down later
instances.forEach((i) => i.destroy());
```

Returns an array of `ComponentInstance` objects with a `destroy()` method.

**Options:**
- `root` — scope the query to a subtree (default: `document`)
- `options` — override the default options passed to the factory

### `destroyAll(selector, factory?, root?)`

Destroy all enhanced instances on matching elements. Pass a specific `factory` to only remove that behavior.

### `register(selector, factory)` / `init()` / `autoInit()`

For declarative, auto-initialization workflows:

```ts
import { register, autoInit, tabs, accordion } from "stitch-js";

register("[data-tabs]", tabs());
register("[data-accordion]", accordion());
autoInit(); // runs on DOMContentLoaded (or immediately if already loaded)
```

## Components

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
import { enhance, tabs } from "stitch-js";
enhance("[data-tabs]", tabs({ defaultIndex: 0 }));
```

**Options:** `listSelector`, `tabSelector`, `panelSelector`, `defaultIndex`

Keyboard: Arrow Left/Right, Home, End.

### Accordion

```html
<div data-accordion>
  <div data-accordion-item>
    <button data-accordion-trigger>Section 1</button>
    <div data-accordion-content>Content 1</div>
  </div>
  <div data-accordion-item>
    <button data-accordion-trigger>Section 2</button>
    <div data-accordion-content>Content 2</div>
  </div>
</div>
```

```ts
import { enhance, accordion } from "stitch-js";
enhance("[data-accordion]", accordion({ multiple: false }));
```

**Options:** `itemSelector`, `triggerSelector`, `contentSelector`, `multiple`

Keyboard: Arrow Up/Down, Home, End.

### Form

Progressive AJAX form submission with fallback to native submit.

```html
<form data-form action="/api/contact" method="post">
  <input name="email" type="email" required />
  <button type="submit">Send</button>
</form>
```

```ts
import { enhance, form } from "stitch-js";
enhance(
  "[data-form]",
  form({
    onSuccess: (el, res) => console.log("Sent!", res),
    onError: (el, err) => console.error("Failed", err),
  }),
);
```

**Options:** `fetchOptions`, `onBefore`, `onSuccess`, `onError`, `onComplete`, `submittingClass`

### Animate

CSS-class-based scroll animation via IntersectionObserver.

```html
<div data-animate class="fade-in">Appears on scroll</div>
```

```css
.fade-in {
  opacity: 0;
  transition: opacity 0.4s ease;
}
.fade-in.is-visible {
  opacity: 1;
}
```

```ts
import { enhance, animate } from "stitch-js";
enhance("[data-animate]", animate({ once: true, threshold: 0.1 }));
```

**Options:** `activeClass`, `threshold`, `rootMargin`, `once`

## Custom Components

Write your own component factory:

```ts
import type { ComponentFactory } from "stitch-js";

interface TooltipOptions {
  position?: "top" | "bottom";
}

function tooltip(opts?: TooltipOptions): ComponentFactory<TooltipOptions> {
  return (el) => {
    const tip = document.createElement("span");
    tip.textContent = el.getAttribute("data-tooltip") ?? "";
    tip.className = `tooltip tooltip--${opts?.position ?? "top"}`;

    const show = () => el.appendChild(tip);
    const hide = () => tip.remove();

    el.addEventListener("mouseenter", show);
    el.addEventListener("mouseleave", hide);

    return {
      destroy() {
        el.removeEventListener("mouseenter", show);
        el.removeEventListener("mouseleave", hide);
        tip.remove();
      },
    };
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
