import type { ComponentFactory, ComponentInstance, CleanupFn } from "../utils/types.js";
import { queryAll, setAria, uid } from "../utils/dom.js";

/**
 * Scoped context passed to every `defineComponent` setup function.
 * Provides DOM utilities, event delegation, attribute parsing,
 * and automatic cleanup — all scoped to the component's root element.
 */
export interface ComponentContext<O> {
  /** The root element this component is attached to. */
  readonly el: HTMLElement;

  /** Resolved options (defaults merged with user-provided). */
  readonly options: Readonly<O>;

  /** Query a single element within the component root. */
  query<E extends HTMLElement = HTMLElement>(selector: string): E | null;

  /** Query all matching elements within the component root. */
  queryAll(selector: string): HTMLElement[];

  /**
   * Read a `data-*` attribute from the root element.
   * Returns the attribute value, or `fallback` if not present.
   */
  attr(name: string, fallback?: string): string | undefined;

  /** Read a `data-*` attribute and parse it as JSON. */
  attrJson<T = unknown>(name: string): T | undefined;

  /**
   * Attach a delegated event listener scoped to the root element.
   * If `selector` is provided, the handler only fires when
   * the event target matches (via `closest`).
   * Automatically cleaned up on destroy.
   */
  on<K extends keyof HTMLElementEventMap>(
    event: K,
    handler: (e: HTMLElementEventMap[K], delegate: HTMLElement) => void,
  ): void;
  on<K extends keyof HTMLElementEventMap>(
    event: K,
    selector: string,
    handler: (e: HTMLElementEventMap[K], delegate: HTMLElement) => void,
  ): void;

  /** Set multiple `aria-*` attributes on an element. */
  aria(el: Element, attrs: Record<string, string | boolean>): void;

  /** Generate a unique ID (for ARIA linkage etc.). */
  uid(prefix?: string): string;

  /** Register a cleanup function that runs on destroy. */
  onDestroy(fn: CleanupFn): void;

  /** Emit a custom event from the root element. */
  emit(name: string, detail?: unknown): void;
}

/** Setup function signature for `defineComponent`. */
export type SetupFn<O> = (ctx: ComponentContext<O>) => void | CleanupFn;

/**
 * Define a reusable, tree-shakeable component.
 *
 * `defineComponent` provides a scoped `ComponentContext` with DOM queries,
 * delegated events, attribute parsing, and automatic cleanup — so each
 * component stays focused on its behavior.
 *
 * @example
 * ```ts
 * const toggle = defineComponent<{ activeClass?: string }>(
 *   { activeClass: "is-active" },
 *   (ctx) => {
 *     ctx.on("click", () => {
 *       ctx.el.classList.toggle(ctx.options.activeClass);
 *     });
 *   },
 * );
 *
 * enhance("[data-toggle]", toggle());
 * enhance("[data-toggle]", toggle({ activeClass: "open" }));
 * ```
 */
export function defineComponent<O extends object = Record<string, never>>(
  defaults: O,
  setup: SetupFn<O>,
): (overrides?: Partial<O>) => ComponentFactory<Partial<O>> {
  return (overrides?: Partial<O>): ComponentFactory<Partial<O>> => {
    return (el: HTMLElement): ComponentInstance => {
      const options = { ...defaults, ...overrides } as O;
      const cleanups: CleanupFn[] = [];

      const ctx: ComponentContext<O> = {
        el,
        options,

        query<E extends HTMLElement = HTMLElement>(selector: string): E | null {
          return el.querySelector<E>(selector);
        },

        queryAll(selector: string): HTMLElement[] {
          return queryAll(selector, el);
        },

        attr(name: string, fallback?: string): string | undefined {
          return el.getAttribute(`data-${name}`) ?? fallback;
        },

        attrJson<T = unknown>(name: string): T | undefined {
          const raw = el.getAttribute(`data-${name}`);
          if (raw == null) return undefined;
          try {
            return JSON.parse(raw) as T;
          } catch {
            return undefined;
          }
        },

        on<K extends keyof HTMLElementEventMap>(
          event: K,
          selectorOrHandler:
            | string
            | ((e: HTMLElementEventMap[K], delegate: HTMLElement) => void),
          maybeHandler?: (
            e: HTMLElementEventMap[K],
            delegate: HTMLElement,
          ) => void,
        ): void {
          let selector: string | null = null;
          let handler: (
            e: HTMLElementEventMap[K],
            delegate: HTMLElement,
          ) => void;

          if (typeof selectorOrHandler === "string") {
            selector = selectorOrHandler;
            handler = maybeHandler!;
          } else {
            handler = selectorOrHandler;
          }

          const listener = (e: HTMLElementEventMap[K]) => {
            if (selector) {
              const delegate = (e.target as HTMLElement).closest?.<HTMLElement>(
                selector,
              );
              if (delegate && el.contains(delegate)) {
                handler(e, delegate);
              }
            } else {
              handler(e, el);
            }
          };

          el.addEventListener(event, listener as EventListener);
          cleanups.push(() =>
            el.removeEventListener(event, listener as EventListener),
          );
        },

        aria: setAria,
        uid,

        onDestroy(fn: CleanupFn) {
          cleanups.push(fn);
        },

        emit(name: string, detail?: unknown) {
          el.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
        },
      };

      const teardown = setup(ctx);
      if (teardown) cleanups.push(teardown);

      return {
        destroy() {
          for (let i = cleanups.length - 1; i >= 0; i--) {
            cleanups[i]();
          }
          cleanups.length = 0;
        },
      };
    };
  };
}
