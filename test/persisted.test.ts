import { describe, expect, it } from "bun:test";
import { persistedStore } from "../src/core/persisted";

// Minimal in-memory Storage implementation for testing.
function createMockStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

describe("persistedStore", () => {
  it("holds and returns the initial value", () => {
    const storage = createMockStorage();
    const s = persistedStore("count", 0, { storage });
    expect(s.get()).toBe(0);
  });

  it("persists the initial value to storage", () => {
    const storage = createMockStorage();
    persistedStore("count", 42, { storage });
    expect(storage.getItem("count")).toBe("42");
  });

  it("hydrates from existing storage value", () => {
    const storage = createMockStorage();
    storage.setItem("theme", '"dark"');
    const s = persistedStore("theme", "light", { storage });
    expect(s.get()).toBe("dark");
  });

  it("set updates both value and storage", () => {
    const storage = createMockStorage();
    const s = persistedStore("count", 0, { storage });
    s.set(5);
    expect(s.get()).toBe(5);
    expect(storage.getItem("count")).toBe("5");
  });

  it("update transforms and persists", () => {
    const storage = createMockStorage();
    const s = persistedStore("count", 10, { storage });
    s.update((n) => n + 5);
    expect(s.get()).toBe(15);
    expect(storage.getItem("count")).toBe("15");
  });

  it("notifies subscribers on set", () => {
    const storage = createMockStorage();
    const s = persistedStore("count", 0, { storage });
    const log: number[] = [];
    s.subscribe((val) => log.push(val));

    s.set(1);
    s.set(2);
    expect(log).toEqual([1, 2]);
  });

  it("does not notify when value is the same", () => {
    const storage = createMockStorage();
    const s = persistedStore("count", 5, { storage });
    const log: number[] = [];
    s.subscribe((val) => log.push(val));

    s.set(5);
    expect(log).toEqual([]);
  });

  it("unsubscribe stops notifications", () => {
    const storage = createMockStorage();
    const s = persistedStore("count", 0, { storage });
    const log: number[] = [];
    const unsub = s.subscribe((val) => log.push(val));

    s.set(1);
    unsub();
    s.set(2);
    expect(log).toEqual([1]);
  });

  it("works with object values", () => {
    const storage = createMockStorage();
    const s = persistedStore("user", { name: "Alice" }, { storage });
    s.set({ name: "Bob" });
    expect(s.get()).toEqual({ name: "Bob" });
    expect(storage.getItem("user")).toBe('{"name":"Bob"}');
  });

  it("accepts custom serialize / deserialize", () => {
    const storage = createMockStorage();
    const s = persistedStore("val", 0, {
      storage,
      serialize: (v) => `custom:${v}`,
      deserialize: (raw) => Number(raw.replace("custom:", "")),
    });
    s.set(7);
    expect(storage.getItem("val")).toBe("custom:7");

    // New store with same key should hydrate through custom deserialize
    const s2 = persistedStore("val", 0, {
      storage,
      serialize: (v) => `custom:${v}`,
      deserialize: (raw) => Number(raw.replace("custom:", "")),
    });
    expect(s2.get()).toBe(7);
  });

  it("is compatible with effect and computed", () => {
    // Import the existing store utilities to demonstrate compatibility
    const { effect, computed, createStore } = require("../src/core/store");
    const storage = createMockStorage();
    const s = persistedStore("count", 0, { storage });

    // Works with effect
    const log: number[] = [];
    const stop = effect([s], (n: number) => {
      log.push(n);
    });

    s.set(3);
    expect(log).toEqual([0, 3]);
    stop();

    // Works with computed alongside a regular store
    const other = createStore(10);
    const sum = computed([s, other], (a: number, b: number) => a + b);
    expect(sum.get()).toBe(13);

    s.set(7);
    expect(sum.get()).toBe(17);
    sum.dispose();
  });
});
