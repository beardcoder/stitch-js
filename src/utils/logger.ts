/** Log level severity. */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** Options for `createLogger`. */
export interface LoggerOptions {
  /** Prefix shown as a colored badge. Default: `"stitch"` */
  prefix?: string;
  /** Minimum level to output. Default: `"debug"` */
  level?: LogLevel;
  /** Badge background color (CSS). Default: `"#6d28d9"` */
  color?: string;
}

/** A styled console logger. */
export interface Logger {
  /** Log a debug message (grey badge). */
  debug(...args: unknown[]): void;
  /** Log an info message (blue badge). */
  info(...args: unknown[]): void;
  /** Log a warning message (amber badge). */
  warn(...args: unknown[]): void;
  /** Log an error message (red badge). */
  error(...args: unknown[]): void;
  /** Set the minimum log level at runtime. */
  setLevel(level: LogLevel): void;
}

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "#6b7280",
  info: "#2563eb",
  warn: "#d97706",
  error: "#dc2626",
};

const BADGE_STYLE = (bg: string) =>
  `background:${bg};color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold`;

const LABEL_STYLE = (color: string) =>
  `color:${color};font-weight:bold`;

/**
 * Create a styled console logger with colored badges and level filtering.
 *
 * The logger is a standalone utility — import it only when needed
 * so bundlers can tree-shake it away from production builds.
 *
 * @example
 * ```ts
 * import { createLogger } from "stitch-js/utils/logger";
 *
 * const log = createLogger({ prefix: "app", level: "info" });
 *
 * log.info("ready");          // [app] ℹ ready  (blue)
 * log.warn("deprecated API"); // [app] ⚠ deprecated API  (amber)
 * log.debug("skip me");       // (silent — below "info" level)
 * log.setLevel("debug");
 * log.debug("now visible");   // [app] 🐛 now visible  (grey)
 * ```
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const {
    prefix = "stitch",
    level: initialLevel = "debug",
    color = "#6d28d9",
  } = options;

  let minLevel = LEVELS[initialLevel];

  function log(level: LogLevel, args: unknown[]) {
    if (LEVELS[level] < minLevel) return;

    const levelColor = LEVEL_COLORS[level];
    const method = level === "debug" ? "log" : level;

    console[method](
      `%c${prefix}%c %c${level.toUpperCase()}`,
      BADGE_STYLE(color),
      "",
      LABEL_STYLE(levelColor),
      ...args,
    );
  }

  return {
    debug(...args: unknown[]) {
      log("debug", args);
    },
    info(...args: unknown[]) {
      log("info", args);
    },
    warn(...args: unknown[]) {
      log("warn", args);
    },
    error(...args: unknown[]) {
      log("error", args);
    },
    setLevel(level: LogLevel) {
      minLevel = LEVELS[level];
    },
  };
}
