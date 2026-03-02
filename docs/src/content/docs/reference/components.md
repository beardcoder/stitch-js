---
title: Components
description: API reference for built-in example components — Tabs, Accordion, Form, and Animate.
---

The built-in components are examples built on `defineComponent`. Use them directly or as reference for your own.

## Tabs

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
import { enhance } from "stitch-js";
import { tabs } from "stitch-js/components/tabs";

enhance("[data-tabs]", tabs({ defaultIndex: 0 }));
```

**Options:**

| Option          | Description                          |
| --------------- | ------------------------------------ |
| `listSelector`  | Selector for the tab list container  |
| `tabSelector`   | Selector for individual tab buttons  |
| `panelSelector` | Selector for tab panels              |
| `defaultIndex`  | Initially active tab index           |

**Keyboard:** Arrow Left/Right, Home, End.

## Accordion

```html
<div data-accordion>
  <div data-accordion-item>
    <button data-accordion-trigger>Section 1</button>
    <div data-accordion-content>Content</div>
  </div>
</div>
```

```ts
import { enhance } from "stitch-js";
import { accordion } from "stitch-js/components/accordion";

enhance("[data-accordion]", accordion({ multiple: false }));
```

**Options:**

| Option             | Description                              |
| ------------------ | ---------------------------------------- |
| `itemSelector`     | Selector for accordion items             |
| `triggerSelector`  | Selector for trigger buttons             |
| `contentSelector`  | Selector for content panels              |
| `multiple`         | Allow multiple panels open simultaneously |

**Keyboard:** Arrow Up/Down, Home, End.

## Form

Progressively enhances a `<form>` to submit via `fetch` (AJAX) instead of a full page reload.

```html
<form data-form action="/api/contact" method="post">
  <input name="email" type="email" required />
  <button type="submit">Send</button>
</form>
```

```ts
import { enhance } from "stitch-js";
import { form } from "stitch-js/components/form";

enhance("[data-form]", form({
  onSuccess: (el, res) => console.log("Sent!", res),
  onError: (el, err) => console.error("Failed", err),
}));
```

## Animate

Triggers a CSS class when the element enters the viewport using `IntersectionObserver`.

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
import { enhance } from "stitch-js";
import { animate } from "stitch-js/components/animate";

enhance("[data-animate]", animate({ once: true }));
```
