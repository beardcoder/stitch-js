import { describe, expect, it } from "bun:test";
import { createRouter } from "../src/core/router";

describe("createRouter", () => {
  it("returns the current route state", () => {
    const router = createRouter([""]);
    const state = router.get();
    expect(state).toHaveProperty("path");
    expect(state).toHaveProperty("params");
    expect(state).toHaveProperty("pattern");
    router.destroy();
  });

  it("matches a simple static pattern", () => {
    const router = createRouter(["", "about", "contact"]);
    router.push("about");
    expect(router.get().path).toBe("about");
    expect(router.get().pattern).toBe("about");
    expect(router.get().params).toEqual({});
    router.destroy();
  });

  it("matches a pattern with named params", () => {
    const router = createRouter(["users/:id"]);
    router.push("users/42");
    expect(router.get().path).toBe("users/42");
    expect(router.get().pattern).toBe("users/:id");
    expect(router.get().params).toEqual({ id: "42" });
    router.destroy();
  });

  it("matches multiple named params", () => {
    const router = createRouter(["users/:userId/posts/:postId"]);
    router.push("users/7/posts/99");
    expect(router.get().path).toBe("users/7/posts/99");
    expect(router.get().params).toEqual({ userId: "7", postId: "99" });
    router.destroy();
  });

  it("returns empty pattern when no pattern matches", () => {
    const router = createRouter(["about"]);
    router.push("unknown");
    expect(router.get().pattern).toBe("");
    expect(router.get().params).toEqual({});
    router.destroy();
  });

  it("notifies subscribers on push", () => {
    const router = createRouter(["", "about"]);
    const log: string[] = [];
    router.subscribe((route) => log.push(route.path));

    router.push("about");
    expect(log).toEqual(["about"]);
    router.destroy();
  });

  it("does not notify when pushing the same path", () => {
    const router = createRouter(["about"]);
    router.push("about");
    const log: string[] = [];
    router.subscribe((route) => log.push(route.path));

    router.push("about");
    expect(log).toEqual([]);
    router.destroy();
  });

  it("unsubscribe stops notifications", () => {
    const router = createRouter(["", "a", "b"]);
    const log: string[] = [];
    const unsub = router.subscribe((route) => log.push(route.path));

    router.push("a");
    unsub();
    router.push("b");
    expect(log).toEqual(["a"]);
    router.destroy();
  });

  it("destroy clears all listeners", () => {
    const router = createRouter(["", "x"]);
    const log: string[] = [];
    router.subscribe((route) => log.push(route.path));

    router.destroy();
    router.push("x");
    expect(log).toEqual([]);
  });

  it("works with effect for reactive side-effects", () => {
    const { effect } = require("../src/core/store");
    const router = createRouter(["", "about", "users/:id"]);
    const log: string[] = [];

    const stop = effect([router], (route: { path: string }) => {
      log.push(route.path);
    });

    router.push("about");
    router.push("users/5");
    expect(log.length).toBe(3); // initial + 2 pushes
    expect(log[1]).toBe("about");
    expect(log[2]).toBe("users/5");

    stop();
    router.destroy();
  });

  it("works with no patterns (catches all)", () => {
    const router = createRouter();
    router.push("anything");
    expect(router.get().path).toBe("anything");
    expect(router.get().pattern).toBe("");
    router.destroy();
  });
});
