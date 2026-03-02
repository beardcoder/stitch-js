import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { createLogger } from "../src/utils/logger";

describe("createLogger", () => {
  const spies: ReturnType<typeof spyOn>[] = [];

  function spy(obj: object, method: string) {
    const s = spyOn(obj as never, method as never).mockImplementation(
      () => {},
    );
    spies.push(s);
    return s;
  }

  afterEach(() => {
    for (const s of spies) s.mockRestore();
    spies.length = 0;
  });

  it("returns a logger with debug, info, warn, error, setLevel", () => {
    const log = createLogger();
    expect(typeof log.debug).toBe("function");
    expect(typeof log.info).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
    expect(typeof log.setLevel).toBe("function");
  });

  it("calls console.log for debug level", () => {
    const s = spy(console, "log");
    const log = createLogger();

    log.debug("test message");

    expect(s).toHaveBeenCalledTimes(1);
    const args = s.mock.calls[0];
    expect(args[0]).toContain("stitch");
    expect(args[0]).toContain("DEBUG");
    expect(args[args.length - 1]).toBe("test message");
  });

  it("calls console.info for info level", () => {
    const s = spy(console, "info");
    const log = createLogger();

    log.info("hello");

    expect(s).toHaveBeenCalledTimes(1);
    const args = s.mock.calls[0];
    expect(args[0]).toContain("INFO");
    expect(args[args.length - 1]).toBe("hello");
  });

  it("calls console.warn for warn level", () => {
    const s = spy(console, "warn");
    const log = createLogger();

    log.warn("careful");

    expect(s).toHaveBeenCalledTimes(1);
    const args = s.mock.calls[0];
    expect(args[0]).toContain("WARN");
    expect(args[args.length - 1]).toBe("careful");
  });

  it("calls console.error for error level", () => {
    const s = spy(console, "error");
    const log = createLogger();

    log.error("failure");

    expect(s).toHaveBeenCalledTimes(1);
    const args = s.mock.calls[0];
    expect(args[0]).toContain("ERROR");
    expect(args[args.length - 1]).toBe("failure");
  });

  it("respects minimum log level", () => {
    const logSpy = spy(console, "log");
    const infoSpy = spy(console, "info");
    const warnSpy = spy(console, "warn");
    const errorSpy = spy(console, "error");

    const log = createLogger({ level: "warn" });

    log.debug("skip");
    log.info("skip");
    log.warn("show");
    log.error("show");

    expect(logSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("setLevel changes the minimum level at runtime", () => {
    const logSpy = spy(console, "log");

    const log = createLogger({ level: "info" });

    log.debug("skip");
    expect(logSpy).not.toHaveBeenCalled();

    log.setLevel("debug");
    log.debug("now visible");
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it("uses custom prefix", () => {
    const s = spy(console, "info");
    const log = createLogger({ prefix: "myapp" });

    log.info("test");

    const args = s.mock.calls[0];
    expect(args[0]).toContain("myapp");
  });

  it("passes multiple arguments through", () => {
    const s = spy(console, "info");
    const log = createLogger();

    log.info("count:", 42, { key: "val" });

    const args = s.mock.calls[0];
    // first 4 args are format string + styles, then the user args
    expect(args.slice(-3)).toEqual(["count:", 42, { key: "val" }]);
  });

  it("defaults to debug level when no level specified", () => {
    const s = spy(console, "log");
    const log = createLogger();

    log.debug("visible");
    expect(s).toHaveBeenCalledTimes(1);
  });
});
