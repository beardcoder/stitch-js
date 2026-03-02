import { describe, expect, it } from "bun:test";
import { enhance, destroyAll } from "../src/core/enhance";
import type { ComponentFactory, ComponentInstance } from "../src/utils/types";

function makeDoc(html: string): HTMLElement {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div;
}

describe("enhance", () => {
  it("calls factory for each matched element", () => {
    const root = makeDoc(`
      <div data-widget>A</div>
      <div data-widget>B</div>
      <span>C</span>
    `);

    let mountCount = 0;
    const factory: ComponentFactory = () => {
      mountCount++;
      return { destroy() {} };
    };

    const results = enhance("[data-widget]", factory, { root });
    expect(results).toHaveLength(2);
    expect(mountCount).toBe(2);
  });

  it("is idempotent — does not double-enhance", () => {
    const root = makeDoc(`<div data-widget></div>`);

    let mountCount = 0;
    const factory: ComponentFactory = () => {
      mountCount++;
      return { destroy() {} };
    };

    enhance("[data-widget]", factory, { root });
    enhance("[data-widget]", factory, { root });
    expect(mountCount).toBe(1);
  });

  it("sets data-stitch-enhanced attribute", () => {
    const root = makeDoc(`<div data-widget></div>`);
    const factory: ComponentFactory = () => ({ destroy() {} });

    enhance("[data-widget]", factory, { root });
    const el = root.querySelector("[data-widget]")!;
    expect(el.hasAttribute("data-stitch-enhanced")).toBe(true);
  });

  it("destroy removes tracking and attribute", () => {
    const root = makeDoc(`<div data-widget></div>`);
    const factory: ComponentFactory = () => ({ destroy() {} });

    const [instance] = enhance("[data-widget]", factory, { root });
    instance.destroy();

    const el = root.querySelector("[data-widget]")!;
    expect(el.hasAttribute("data-stitch-enhanced")).toBe(false);
  });

  it("allows different factories on same element", () => {
    const root = makeDoc(`<div data-widget></div>`);

    let countA = 0;
    let countB = 0;
    const factoryA: ComponentFactory = () => {
      countA++;
      return { destroy() {} };
    };
    const factoryB: ComponentFactory = () => {
      countB++;
      return { destroy() {} };
    };

    enhance("[data-widget]", factoryA, { root });
    enhance("[data-widget]", factoryB, { root });
    expect(countA).toBe(1);
    expect(countB).toBe(1);
  });
});

describe("destroyAll", () => {
  it("destroys all instances on matching elements", () => {
    const root = makeDoc(`<div data-widget></div>`);

    let destroyed = false;
    const factory: ComponentFactory = () => ({
      destroy() {
        destroyed = true;
      },
    });

    enhance("[data-widget]", factory, { root });
    destroyAll("[data-widget]", undefined, root);
    expect(destroyed).toBe(true);
  });

  it("destroys only specified factory", () => {
    const root = makeDoc(`<div data-widget></div>`);

    let destroyedA = false;
    let destroyedB = false;
    const factoryA: ComponentFactory = () => ({
      destroy() {
        destroyedA = true;
      },
    });
    const factoryB: ComponentFactory = () => ({
      destroy() {
        destroyedB = true;
      },
    });

    enhance("[data-widget]", factoryA, { root });
    enhance("[data-widget]", factoryB, { root });
    destroyAll("[data-widget]", factoryA, root);

    expect(destroyedA).toBe(true);
    expect(destroyedB).toBe(false);
  });
});
