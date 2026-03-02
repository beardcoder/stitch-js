import { describe, expect, it } from "bun:test";
import { defineComponent } from "../src/core/component";
import { enhance } from "../src/core/enhance";
import { createStore } from "../src/core/store";

describe("ctx.sync", () => {
  it("fires the listener immediately with the current store value", () => {
    const count = createStore(42);
    const log: number[] = [];

    const widget = defineComponent({}, (ctx) => {
      ctx.sync(count, (val) => log.push(val));
    });

    const root = document.createElement("div");
    root.innerHTML = `<div data-w></div>`;
    enhance("[data-w]", widget(), { root });

    expect(log).toEqual([42]);
  });

  it("re-fires when the store value changes", () => {
    const count = createStore(0);
    const log: number[] = [];

    const widget = defineComponent({}, (ctx) => {
      ctx.sync(count, (val) => log.push(val));
    });

    const root = document.createElement("div");
    root.innerHTML = `<div data-w></div>`;
    enhance("[data-w]", widget(), { root });

    count.set(1);
    count.set(2);
    expect(log).toEqual([0, 1, 2]);
  });

  it("unsubscribes automatically on destroy", () => {
    const count = createStore(0);
    const log: number[] = [];

    const widget = defineComponent({}, (ctx) => {
      ctx.sync(count, (val) => log.push(val));
    });

    const root = document.createElement("div");
    root.innerHTML = `<div data-w></div>`;
    const instances = enhance("[data-w]", widget(), { root });

    count.set(1);
    instances.forEach((i) => i.destroy());
    count.set(2);

    // Should not see 2 — subscription was cleaned up
    expect(log).toEqual([0, 1]);
  });

  it("can sync multiple stores in one component", () => {
    const a = createStore("hello");
    const b = createStore(10);
    const logA: string[] = [];
    const logB: number[] = [];

    const widget = defineComponent({}, (ctx) => {
      ctx.sync(a, (val) => logA.push(val));
      ctx.sync(b, (val) => logB.push(val));
    });

    const root = document.createElement("div");
    root.innerHTML = `<div data-w></div>`;
    enhance("[data-w]", widget(), { root });

    a.set("world");
    b.set(20);
    expect(logA).toEqual(["hello", "world"]);
    expect(logB).toEqual([10, 20]);
  });
});
