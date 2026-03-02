import type { CleanupFn } from "../utils/types.js";
import type { Store, Listener } from "./store.js";

/** Options for `persistedStore`. */
export interface PersistedStoreOptions {
  /** Storage backend — defaults to `localStorage`. */
  storage?: Storage;
  /** Custom serializer — defaults to `JSON.stringify`. */
  serialize?: (value: unknown) => string;
  /** Custom deserializer — defaults to `JSON.parse`. */
  deserialize?: (raw: string) => unknown;
}

/**
 * Create a reactive store that persists its value to `localStorage`
 * (or `sessionStorage`) and syncs across browser tabs via the
 * `storage` event.
 *
 * @example
 * ```ts
 * const theme = persistedStore("theme", "light");
 *
 * theme.get();       // reads from localStorage or falls back to "light"
 * theme.set("dark"); // updates localStorage + notifies subscribers
 * ```
 */
export function persistedStore<T>(
  key: string,
  initial: T,
  options: PersistedStoreOptions = {},
): Store<T> {
  const {
    storage = globalThis.localStorage,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;

  const listeners = new Set<Listener<T>>();

  // Hydrate from storage, falling back to `initial`.
  function hydrate(): T {
    try {
      const raw = storage.getItem(key);
      if (raw != null) return deserialize(raw) as T;
    } catch {
      // storage unavailable / corrupt — use initial
    }
    return initial;
  }

  let value: T = hydrate();

  function persist() {
    try {
      storage.setItem(key, serialize(value));
    } catch {
      // quota exceeded or unavailable — silently skip
    }
  }

  function notify(prev: T) {
    for (const fn of listeners) {
      fn(value, prev);
    }
  }

  // Cross-tab sync
  function onStorage(e: StorageEvent) {
    if (e.key !== key || e.storageArea !== storage) return;
    const prev = value;
    value = e.newValue != null ? (deserialize(e.newValue) as T) : initial;
    if (!Object.is(prev, value)) notify(prev);
  }

  if (typeof globalThis.addEventListener === "function") {
    globalThis.addEventListener("storage", onStorage);
  }

  // Write the initial value so storage is seeded
  persist();

  return {
    get() {
      return value;
    },

    set(next: T) {
      const prev = value;
      if (Object.is(prev, next)) return;
      value = next;
      persist();
      notify(prev);
    },

    update(fn: (current: T) => T) {
      const prev = value;
      const next = fn(prev);
      if (Object.is(prev, next)) return;
      value = next;
      persist();
      notify(prev);
    },

    subscribe(listener: Listener<T>): CleanupFn {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
