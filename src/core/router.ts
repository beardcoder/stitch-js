import type { CleanupFn } from "../utils/types.js";
import type { Listener } from "./store.js";

/** Params extracted from the current route pattern. */
export type RouteParams = Record<string, string>;

/** A matched route object exposed by the router store. */
export interface RouteState {
  /** The full hash path (without the leading `#`). */
  path: string;
  /** Named params extracted from the matched pattern (e.g. `:id`). */
  params: RouteParams;
  /** The pattern that matched, or `""` if no pattern matched. */
  pattern: string;
}

/** A read-only store for the current route, plus a navigation helper. */
export interface Router {
  /** Get the current route state. */
  get(): RouteState;
  /** Subscribe to route changes. Returns an unsubscribe function. */
  subscribe(listener: Listener<RouteState>): CleanupFn;
  /** Programmatically navigate to a hash path. */
  push(path: string): void;
  /** Stop listening to hash changes and free resources. */
  destroy(): void;
}

/**
 * Create a simple hash-based router.
 *
 * The router exposes a store-compatible interface so it works
 * seamlessly with `effect`, `computed`, and `ctx.sync`.
 *
 * @example
 * ```ts
 * const router = createRouter(["", "about", "users/:id"]);
 *
 * effect([router], (route) => {
 *   console.log(route.path, route.params);
 * });
 *
 * router.push("users/42"); // logs "users/42" { id: "42" }
 * ```
 */
export function createRouter(patterns: string[] = []): Router {
  const listeners = new Set<Listener<RouteState>>();

  /** Turn a pattern like `users/:id/posts/:postId` into a regex + param names. */
  function compile(pattern: string): { regex: RegExp; keys: string[] } {
    const keys: string[] = [];
    const src = pattern.replace(/:([^/]+)/g, (_m, name: string) => {
      keys.push(name);
      return "([^/]+)";
    });
    return { regex: new RegExp(`^${src}$`), keys };
  }

  const compiled = patterns.map((p) => ({ pattern: p, ...compile(p) }));

  function resolve(path: string): RouteState {
    for (const { pattern, regex, keys } of compiled) {
      const match = regex.exec(path);
      if (match) {
        const params: RouteParams = {};
        keys.forEach((k, i) => {
          params[k] = match[i + 1];
        });
        return { path, params, pattern };
      }
    }
    return { path, params: {}, pattern: "" };
  }

  function currentPath(): string {
    return (globalThis.location?.hash ?? "#").slice(1);
  }

  let value: RouteState = resolve(currentPath());

  function notify(prev: RouteState) {
    for (const fn of listeners) {
      fn(value, prev);
    }
  }

  function onHashChange() {
    const prev = value;
    value = resolve(currentPath());
    if (prev.path !== value.path) notify(prev);
  }

  if (typeof globalThis.addEventListener === "function") {
    globalThis.addEventListener("hashchange", onHashChange);
  }

  return {
    get() {
      return value;
    },

    subscribe(listener: Listener<RouteState>): CleanupFn {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    push(path: string) {
      if (typeof globalThis.location !== "undefined") {
        globalThis.location.hash = path;
      }
      // In environments without hashchange events, resolve manually.
      const prev = value;
      value = resolve(path);
      if (prev.path !== value.path) notify(prev);
    },

    destroy() {
      if (typeof globalThis.removeEventListener === "function") {
        globalThis.removeEventListener("hashchange", onHashChange);
      }
      listeners.clear();
    },
  };
}
