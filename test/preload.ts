import { parseHTML } from "linkedom";

const { document, HTMLElement, Event, KeyboardEvent, MutationObserver } =
  parseHTML("<!DOCTYPE html><html><body></body></html>");

Object.assign(globalThis, {
  document,
  HTMLElement,
  Event,
  KeyboardEvent,
  MutationObserver,
  // linkedom doesn't have IntersectionObserver — provide a minimal stub for tests
  IntersectionObserver: class IntersectionObserver {
    private callback: IntersectionObserverCallback;
    private targets = new Set<Element>();
    constructor(
      callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit,
    ) {
      this.callback = callback;
    }
    observe(target: Element) {
      this.targets.add(target);
    }
    unobserve(target: Element) {
      this.targets.delete(target);
    }
    disconnect() {
      this.targets.clear();
    }
  },
});
