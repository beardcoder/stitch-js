import { describe, expect, it } from "bun:test";
import { enhance } from "../src/core/enhance";
import { accordion } from "../src/components/accordion";

function makeAccordionHtml() {
  const div = document.createElement("div");
  div.innerHTML = `
    <div data-accordion>
      <div data-accordion-item>
        <button data-accordion-trigger>Section 1</button>
        <div data-accordion-content>Content 1</div>
      </div>
      <div data-accordion-item>
        <button data-accordion-trigger>Section 2</button>
        <div data-accordion-content>Content 2</div>
      </div>
    </div>
  `;
  return div;
}

describe("accordion", () => {
  it("all panels start closed", () => {
    const root = makeAccordionHtml();
    enhance("[data-accordion]", accordion(), { root });

    const contents = root.querySelectorAll<HTMLElement>(
      "[data-accordion-content]",
    );
    contents.forEach((c) => expect(c.hidden).toBe(true));
  });

  it("sets ARIA attributes", () => {
    const root = makeAccordionHtml();
    enhance("[data-accordion]", accordion(), { root });

    const triggers = root.querySelectorAll("[data-accordion-trigger]");
    triggers.forEach((t) => {
      expect(t.getAttribute("aria-expanded")).toBe("false");
      expect(t.getAttribute("aria-controls")).toBeTruthy();
    });

    const contents = root.querySelectorAll("[data-accordion-content]");
    contents.forEach((c) => {
      expect(c.getAttribute("role")).toBe("region");
      expect(c.getAttribute("aria-labelledby")).toBeTruthy();
    });
  });

  it("opens panel on trigger click", () => {
    const root = makeAccordionHtml();
    enhance("[data-accordion]", accordion(), { root });

    const triggers = root.querySelectorAll<HTMLElement>(
      "[data-accordion-trigger]",
    );
    triggers[0].click();

    expect(triggers[0].getAttribute("aria-expanded")).toBe("true");
    const contents = root.querySelectorAll<HTMLElement>(
      "[data-accordion-content]",
    );
    expect(contents[0].hidden).toBe(false);
  });

  it("single mode: opening one closes another", () => {
    const root = makeAccordionHtml();
    enhance("[data-accordion]", accordion(), { root });

    const triggers = root.querySelectorAll<HTMLElement>(
      "[data-accordion-trigger]",
    );
    triggers[0].click();
    triggers[1].click();

    expect(triggers[0].getAttribute("aria-expanded")).toBe("false");
    expect(triggers[1].getAttribute("aria-expanded")).toBe("true");
  });

  it("multiple mode: allows both open", () => {
    const root = makeAccordionHtml();
    enhance("[data-accordion]", accordion({ multiple: true }), { root });

    const triggers = root.querySelectorAll<HTMLElement>(
      "[data-accordion-trigger]",
    );
    triggers[0].click();
    triggers[1].click();

    expect(triggers[0].getAttribute("aria-expanded")).toBe("true");
    expect(triggers[1].getAttribute("aria-expanded")).toBe("true");
  });
});
