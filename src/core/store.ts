import type { CleanupFn } from "../utils/types.js";

/** Listener callback for store subscriptions. */
export type Listener<T> = (value: T, prev: T) => void;

/** A minimal reactive store. */
export interface Store<T> {
  /** Get the current value. */
  get(): T;
  /** Replace the value and notify subscribers. */
  set(value: T): void;
  /** Update the value with a function and notify subscribers. */
  update(fn: (current: T) => T): void;
  /** Subscribe to value changes. Returns an unsubscribe function. */
  subscribe(listener: Listener<T>): CleanupFn;
}

/**
 * Create a minimal reactive store.
 *
 * @example
 * ```ts
 * const count = createStore(0);
 *
 * count.subscribe((val) => console.log("count:", val));
 * count.set(1);        // logs "count: 1"
 * count.update(n => n + 1); // logs "count: 2"
 * count.get();         // 2
 * ```
 */
export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<Listener<T>>();

  function notify(prev: T) {
    for (const fn of listeners) {
      fn(value, prev);
    }
  }

  return {
    get() {
      return value;
    },

    set(next: T) {
      const prev = value;
      if (Object.is(prev, next)) return;
      value = next;
      notify(prev);
    },

    update(fn: (current: T) => T) {
      const prev = value;
      const next = fn(prev);
      if (Object.is(prev, next)) return;
      value = next;
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

/** A read-only derived store. */
export interface Computed<T> {
  /** Get the current derived value. */
  get(): T;
  /** Subscribe to value changes. Returns an unsubscribe function. */
  subscribe(listener: Listener<T>): CleanupFn;
  /** Stop listening to source stores and free resources. */
  dispose(): void;
}

/**
 * Create a derived (computed) store from one or more source stores.
 *
 * @example
 * ```ts
 * const firstName = createStore("Jane");
 * const lastName = createStore("Doe");
 *
 * const fullName = computed(
 *   [firstName, lastName],
 *   (first, last) => `${first} ${last}`,
 * );
 *
 * fullName.get(); // "Jane Doe"
 * firstName.set("John");
 * fullName.get(); // "John Doe"
 * ```
 */
export function computed<S extends Store<unknown>[], T>(
  sources: [...S],
  derive: (...values: { [K in keyof S]: S[K] extends Store<infer V> ? V : never }) => T,
): Computed<T> {
  const listeners = new Set<Listener<T>>();

  function getValues() {
    return sources.map((s) => s.get()) as {
      [K in keyof S]: S[K] extends Store<infer V> ? V : never;
    };
  }

  let value = derive(...getValues());

  function recompute() {
    const prev = value;
    value = derive(...getValues());
    if (Object.is(prev, value)) return;
    for (const fn of listeners) {
      fn(value, prev);
    }
  }

  // Subscribe to all sources
  const unsubs = sources.map((s) => s.subscribe(recompute));

  return {
    get() {
      return value;
    },

    subscribe(listener: Listener<T>): CleanupFn {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    dispose() {
      for (const unsub of unsubs) unsub();
      unsubs.length = 0;
      listeners.clear();
    },
  };
}

/**
 * Run a side-effect whenever any of the given stores change.
 * Returns an unsubscribe function.
 *
 * @example
 * ```ts
 * const count = createStore(0);
 * const stop = effect([count], (val) => {
 *   document.title = `Count: ${val}`;
 * });
 *
 * count.set(5); // document.title → "Count: 5"
 * stop();       // no more updates
 * ```
 */
export function effect<S extends Store<unknown>[]>(
  sources: [...S],
  fn: (...values: { [K in keyof S]: S[K] extends Store<infer V> ? V : never }) => void | CleanupFn,
): CleanupFn {
  let cleanup: CleanupFn | void;

  function run() {
    if (cleanup) cleanup();
    const values = sources.map((s) => s.get()) as {
      [K in keyof S]: S[K] extends Store<infer V> ? V : never;
    };
    cleanup = fn(...values);
  }

  // Run immediately
  run();

  // Re-run on changes
  const unsubs = sources.map((s) => s.subscribe(run));

  return () => {
    if (cleanup) cleanup();
    for (const unsub of unsubs) unsub();
  };
}
