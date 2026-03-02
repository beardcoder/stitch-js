import { describe, expect, it } from "bun:test";
import { createStore, computed, effect } from "../src/core/store";

describe("createStore", () => {
  it("holds and returns a value", () => {
    const s = createStore(42);
    expect(s.get()).toBe(42);
  });

  it("set updates the value", () => {
    const s = createStore(1);
    s.set(2);
    expect(s.get()).toBe(2);
  });

  it("update transforms the value with a function", () => {
    const s = createStore(10);
    s.update((n) => n + 5);
    expect(s.get()).toBe(15);
  });

  it("notifies subscribers on set", () => {
    const s = createStore(0);
    const log: number[] = [];
    s.subscribe((val) => log.push(val));

    s.set(1);
    s.set(2);
    expect(log).toEqual([1, 2]);
  });

  it("notifies subscribers on update", () => {
    const s = createStore(0);
    const log: number[] = [];
    s.subscribe((val) => log.push(val));

    s.update((n) => n + 1);
    expect(log).toEqual([1]);
  });

  it("does not notify when value is the same (Object.is)", () => {
    const s = createStore(5);
    const log: number[] = [];
    s.subscribe((val) => log.push(val));

    s.set(5);
    s.update((n) => n);
    expect(log).toEqual([]);
  });

  it("unsubscribe stops notifications", () => {
    const s = createStore(0);
    const log: number[] = [];
    const unsub = s.subscribe((val) => log.push(val));

    s.set(1);
    unsub();
    s.set(2);
    expect(log).toEqual([1]);
  });

  it("passes previous value to subscriber", () => {
    const s = createStore("a");
    const prevLog: string[] = [];
    s.subscribe((_val, prev) => prevLog.push(prev));

    s.set("b");
    s.set("c");
    expect(prevLog).toEqual(["a", "b"]);
  });

  it("works with object values", () => {
    const s = createStore({ x: 1 });
    const log: Array<{ x: number }> = [];
    s.subscribe((val) => log.push(val));

    s.set({ x: 2 });
    expect(s.get()).toEqual({ x: 2 });
    expect(log).toEqual([{ x: 2 }]);
  });
});

describe("computed", () => {
  it("derives a value from a single store", () => {
    const count = createStore(3);
    const doubled = computed([count], (n) => n * 2);
    expect(doubled.get()).toBe(6);
  });

  it("updates when source changes", () => {
    const count = createStore(1);
    const doubled = computed([count], (n) => n * 2);

    count.set(5);
    expect(doubled.get()).toBe(10);
  });

  it("derives from multiple stores", () => {
    const first = createStore("Jane");
    const last = createStore("Doe");
    const full = computed([first, last], (f, l) => `${f} ${l}`);

    expect(full.get()).toBe("Jane Doe");
    first.set("John");
    expect(full.get()).toBe("John Doe");
  });

  it("notifies subscribers on change", () => {
    const count = createStore(1);
    const doubled = computed([count], (n) => n * 2);

    const log: number[] = [];
    doubled.subscribe((val) => log.push(val));

    count.set(2);
    count.set(3);
    expect(log).toEqual([4, 6]);
  });

  it("does not notify if derived value is unchanged", () => {
    const count = createStore(2);
    const isEven = computed([count], (n) => n % 2 === 0);

    const log: boolean[] = [];
    isEven.subscribe((val) => log.push(val));

    count.set(4); // still even
    expect(log).toEqual([]); // no notification — same derived value
  });

  it("dispose stops tracking", () => {
    const count = createStore(1);
    const doubled = computed([count], (n) => n * 2);

    const log: number[] = [];
    doubled.subscribe((val) => log.push(val));
    doubled.dispose();

    count.set(10);
    expect(doubled.get()).toBe(2); // stale — no longer updating
    expect(log).toEqual([]);
  });
});

describe("effect", () => {
  it("runs immediately with current values", () => {
    const count = createStore(5);
    const log: number[] = [];

    effect([count], (n) => {
      log.push(n);
    });

    expect(log).toEqual([5]);
  });

  it("re-runs on source changes", () => {
    const count = createStore(0);
    const log: number[] = [];

    effect([count], (n) => {
      log.push(n);
    });

    count.set(1);
    count.set(2);
    expect(log).toEqual([0, 1, 2]);
  });

  it("calls cleanup before re-running and on dispose", () => {
    const count = createStore(0);
    const events: string[] = [];

    const stop = effect([count], (n) => {
      events.push(`run:${n}`);
      return () => {
        events.push(`cleanup:${n}`);
      };
    });

    count.set(1);
    expect(events).toEqual(["run:0", "cleanup:0", "run:1"]);

    stop();
    expect(events).toEqual(["run:0", "cleanup:0", "run:1", "cleanup:1"]);
  });

  it("tracks multiple sources", () => {
    const a = createStore(1);
    const b = createStore(2);
    const log: number[] = [];

    effect([a, b], (aVal, bVal) => {
      log.push(aVal + bVal);
    });

    a.set(10);
    expect(log).toEqual([3, 12]);
  });
});
