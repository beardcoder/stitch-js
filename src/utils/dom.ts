/** Query all matching elements within a root, returned as a plain array. */
export function queryAll(
  selector: string,
  root: ParentNode = document,
): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector));
}

/** Set multiple ARIA attributes at once. */
export function setAria(
  el: Element,
  attrs: Record<string, string | boolean>,
): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === "boolean") {
      el.setAttribute(`aria-${key}`, String(value));
    } else {
      el.setAttribute(`aria-${key}`, value);
    }
  }
}

/** Generate a short unique ID for ARIA linkage. */
let counter = 0;
export function uid(prefix = "stitch"): string {
  return `${prefix}-${++counter}`;
}
