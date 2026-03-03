import type {
  ComponentFactory,
  ComponentInstance,
  EnhanceOptions,
} from "../utils/types.js";
import { queryAll } from "../utils/dom.js";

/** Marker attribute so we never double-enhance the same element+factory pair. */
const ENHANCED = "data-stitch-enhanced";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFactory = ComponentFactory<any>;

/** WeakMap tracking active instances per element. */
const instances = new WeakMap<HTMLElement, Map<AnyFactory, ComponentInstance>>();

/**
 * Enhance all elements matching `selector` with the given component `factory`.
 *
 * - Idempotent: calling twice on the same element is a no-op.
 * - Returns an array of `ComponentInstance` handles (with `destroy()`).
 *
 * @example
 * ```ts
 * import { enhance } from "@beardcoder/stitch-js";
 * import { tabs } from "@beardcoder/stitch-js/components/tabs";
 *
 * const handles = enhance("[data-tabs]", tabs());
 * // Later: handles.forEach(h => h.destroy());
 * ```
 */
export function enhance<O>(
  selector: string,
  factory: ComponentFactory<O>,
  opts?: EnhanceOptions<O>,
): ComponentInstance[] {
  const root = opts?.root ?? document;
  const elements = queryAll(selector, root);
  const results: ComponentInstance[] = [];

  for (const el of elements) {
    // Skip if already enhanced with this exact factory
    let map = instances.get(el);
    if (map?.has(factory)) continue;

    const instance = factory(el, opts?.options);

    // Track the instance
    if (!map) {
      map = new Map();
      instances.set(el, map);
    }
    map.set(factory, instance);

    // Mark the element so CSS / debugging can see it
    el.setAttribute(ENHANCED, "");

    // Wrap destroy to also clean up tracking
    const originalDestroy = instance.destroy;
    instance.destroy = () => {
      originalDestroy();
      map!.delete(factory);
      if (map!.size === 0) {
        instances.delete(el);
        el.removeAttribute(ENHANCED);
      }
    };

    results.push(instance);
  }

  return results;
}

/**
 * Destroy all stitch instances on elements matching `selector`.
 * If `factory` is provided, only that behavior is removed.
 */
export function destroyAll(
  selector: string,
  factory?: ComponentFactory,
  root: ParentNode = document,
): void {
  const elements = queryAll(selector, root);
  for (const el of elements) {
    const map = instances.get(el);
    if (!map) continue;

    if (factory) {
      map.get(factory)?.destroy();
    } else {
      for (const instance of map.values()) {
        instance.destroy();
      }
    }
  }
}
