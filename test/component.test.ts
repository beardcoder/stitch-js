import { describe, expect, it } from "bun:test";
import { defineComponent } from "../src/core/component";
import { enhance } from "../src/core/enhance";

describe("defineComponent", () => {
  it("creates a factory that receives the root element", () => {
    let receivedEl: HTMLElement | null = null;

    const widget = defineComponent({}, (ctx) => {
      receivedEl = ctx.el;
    });

    const root = document.createElement("div");
    root.innerHTML = `<div data-widget></div>`;
    enhance("[data-widget]", widget(), { root });

    expect(receivedEl).toBe(root.querySelector("[data-widget]"));
  });

  it("merges default options with overrides", () => {
    let receivedColor = "";

    const widget = defineComponent({ color: "red", size: 10 }, (ctx) => {
      receivedColor = ctx.options.color;
    });

    const root = document.createElement("div");
    root.innerHTML = `<div data-w></div>`;
    enhance("[data-w]", widget({ color: "blue" }), { root });

    expect(receivedColor).toBe("blue");
  });

  it("ctx.query and ctx.queryAll scope to the root element", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <div data-w>
        <span class="inner">A</span>
        <span class="inner">B</span>
      </div>
      <span class="inner">C</span>
    `;

    let count = 0;
    let single: HTMLElement | null = null;

    const widget = defineComponent({}, (ctx) => {
      count = ctx.queryAll(".inner").length;
      single = ctx.query(".inner");
    });

    enhance("[data-w]", widget(), { root });
    expect(count).toBe(2);
    expect(single).not.toBeNull();
  });

  it("ctx.attr reads data-* attributes", () => {
    const root = document.createElement("div");
    root.innerHTML = `<div data-w data-color="green" data-size="42"></div>`;

    let color = "";
    let missing: string | undefined;

    const widget = defineComponent({}, (ctx) => {
      color = ctx.attr("color", "red")!;
      missing = ctx.attr("nope");
    });

    enhance("[data-w]", widget(), { root });
    expect(color).toBe("green");
    expect(missing).toBeUndefined();
  });

  it("ctx.attrJson parses JSON from data attributes", () => {
    const root = document.createElement("div");
    root.innerHTML = `<div data-w data-config='{"a":1,"b":true}'></div>`;

    let parsed: unknown;

    const widget = defineComponent({}, (ctx) => {
      parsed = ctx.attrJson("config");
    });

    enhance("[data-w]", widget(), { root });
    expect(parsed).toEqual({ a: 1, b: true });
  });

  it("ctx.on attaches events that fire and auto-cleanup on destroy", () => {
    const root = document.createElement("div");
    root.innerHTML = `<div data-w></div>`;

    let clicked = 0;

    const widget = defineComponent({}, (ctx) => {
      ctx.on("click", () => {
        clicked++;
      });
    });

    const [instance] = enhance("[data-w]", widget(), { root });
    const el = root.querySelector<HTMLElement>("[data-w]")!;

    el.click();
    expect(clicked).toBe(1);

    instance.destroy();
    el.click();
    expect(clicked).toBe(1); // listener removed
  });

  it("ctx.on with selector delegates to matching children", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <div data-w>
        <button class="btn">Click</button>
        <span class="other">Nope</span>
      </div>
    `;

    let delegateTag = "";

    const widget = defineComponent({}, (ctx) => {
      ctx.on("click", ".btn", (_e, delegate) => {
        delegateTag = delegate.tagName;
      });
    });

    enhance("[data-w]", widget(), { root });
    root.querySelector<HTMLElement>(".btn")!.click();
    expect(delegateTag).toBe("BUTTON");
  });

  it("ctx.onDestroy registers additional cleanup", () => {
    const root = document.createElement("div");
    root.innerHTML = `<div data-w></div>`;

    let cleaned = false;

    const widget = defineComponent({}, (ctx) => {
      ctx.onDestroy(() => {
        cleaned = true;
      });
    });

    const [instance] = enhance("[data-w]", widget(), { root });
    expect(cleaned).toBe(false);
    instance.destroy();
    expect(cleaned).toBe(true);
  });

  it("ctx.emit creates a CustomEvent with correct detail", () => {
    // linkedom's dispatchEvent has limitations with CustomEvent,
    // so we verify emit constructs the right event by spying on dispatchEvent
    const root = document.createElement("div");
    root.innerHTML = `<div data-w></div>`;

    let dispatched: CustomEvent | null = null;

    const widget = defineComponent({}, (ctx) => {
      const original = ctx.el.dispatchEvent.bind(ctx.el);
      ctx.el.dispatchEvent = (event: Event) => {
        dispatched = event as CustomEvent;
        return true;
      };
      ctx.emit("my-event", { value: 42 });
      ctx.el.dispatchEvent = original;
    });

    enhance("[data-w]", widget(), { root });
    expect(dispatched).not.toBeNull();
    expect(dispatched!.type).toBe("my-event");
    expect(dispatched!.detail).toEqual({ value: 42 });
    expect(dispatched!.bubbles).toBe(true);
  });

  it("setup return value is called on destroy", () => {
    const root = document.createElement("div");
    root.innerHTML = `<div data-w></div>`;

    let tornDown = false;

    const widget = defineComponent({}, (_ctx) => {
      return () => {
        tornDown = true;
      };
    });

    const [instance] = enhance("[data-w]", widget(), { root });
    instance.destroy();
    expect(tornDown).toBe(true);
  });
});
