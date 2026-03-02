import { describe, expect, it } from "bun:test";
import { animate } from "../src/components/animate";

describe("animate", () => {
  it("returns a factory function", () => {
    const factory = animate();
    expect(typeof factory).toBe("function");
  });

  it("factory returns instance with destroy method", () => {
    const factory = animate();
    const el = document.createElement("div");
    const instance = factory(el);
    expect(typeof instance.destroy).toBe("function");
  });

  it("destroy removes activeClass", () => {
    const factory = animate({ activeClass: "visible" });
    const el = document.createElement("div");
    el.classList.add("visible");
    const instance = factory(el);
    instance.destroy();
    expect(el.classList.contains("visible")).toBe(false);
  });
});
