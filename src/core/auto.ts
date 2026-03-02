import type { ComponentFactory } from "../utils/types.js";
import { enhance } from "./enhance.js";

/** Registry of selector → factory pairs for auto-init. */
const registry: Array<{ selector: string; factory: ComponentFactory }> = [];

/**
 * Register a component for automatic initialization.
 * Registered components are mounted when `init()` is called or on DOMContentLoaded.
 */
export function register<O>(
  selector: string,
  factory: ComponentFactory<O>,
): void {
  registry.push({ selector, factory: factory as ComponentFactory });
}

/**
 * Initialize all registered components.
 * Safe to call multiple times — `enhance` is idempotent.
 */
export function init(root?: ParentNode): void {
  for (const { selector, factory } of registry) {
    enhance(selector, factory, root ? { root } : undefined);
  }
}

/**
 * Set up auto-initialization on DOMContentLoaded.
 * If the document is already interactive/complete, runs immediately.
 */
export function autoInit(): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init(), { once: true });
  } else {
    init();
  }
}
