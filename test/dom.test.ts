import { describe, expect, it } from "bun:test";
import { queryAll, setAria, uid } from "../src/utils/dom";

describe("queryAll", () => {
  it("returns array of matching elements", () => {
    const root = document.createElement("div");
    root.innerHTML = `<span class="a"></span><span class="a"></span><p></p>`;
    const result = queryAll(".a", root);
    expect(result).toHaveLength(2);
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns empty array when nothing matches", () => {
    const root = document.createElement("div");
    expect(queryAll(".nope", root)).toHaveLength(0);
  });
});

describe("setAria", () => {
  it("sets aria- prefixed attributes", () => {
    const el = document.createElement("div");
    setAria(el, { expanded: true, controls: "panel-1" });
    expect(el.getAttribute("aria-expanded")).toBe("true");
    expect(el.getAttribute("aria-controls")).toBe("panel-1");
  });
});

describe("uid", () => {
  it("generates unique IDs", () => {
    const a = uid("test");
    const b = uid("test");
    expect(a).not.toBe(b);
  });

  it("uses provided prefix", () => {
    const id = uid("my-prefix");
    expect(id.startsWith("my-prefix-")).toBe(true);
  });
});
