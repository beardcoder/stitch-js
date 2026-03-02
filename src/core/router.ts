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

/** Options accepted by {@link createRouter}. */
export interface RouterOptions {
  /**
   * Optional namespace key for multi-router support.
   *
   * When set, the router reads/writes only its own portion of the hash
   * using a `key=value` encoding (e.g. `#tabs=tab1&accordion=section1`).
   * This lets multiple routers coexist without interfering with each other.
   */
  key?: string;
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
 *
 * @example Multiple routers with namespaced keys
 * ```ts
 * const tabRouter = createRouter(["tab1", "tab2"], { key: "tabs" });
 * const accordionRouter = createRouter(["section1", "section2"], { key: "accordion" });
 *
 * tabRouter.push("tab1");           // hash → #tabs=tab1
 * accordionRouter.push("section1"); // hash → #tabs=tab1&accordion=section1
 * ```
 */
export function createRouter(
  patterns: string[] = [],
  options: RouterOptions = {},
): Router {
  const { key } = options;
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

  function rawHash(): string {
    return (globalThis.location?.hash ?? "#").slice(1);
  }

  /** Parse a keyed hash like `key1=value1&key2=value2` into a Map. */
  function parseKeyedHash(hash: string): Map<string, string> {
    const map = new Map<string, string>();
    if (!hash) return map;
    for (const part of hash.split("&")) {
      const eq = part.indexOf("=");
      if (eq !== -1) map.set(part.slice(0, eq), part.slice(eq + 1));
    }
    return map;
  }

  function currentPath(): string {
    const raw = rawHash();
    if (!key) return raw;
    return parseKeyedHash(raw).get(key) ?? "";
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
        if (key) {
          const map = parseKeyedHash(rawHash());
          map.set(key, path);
          const parts: string[] = [];
          for (const [k, v] of map) parts.push(`${k}=${v}`);
          globalThis.location.hash = parts.join("&");
        } else {
          globalThis.location.hash = path;
        }
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
