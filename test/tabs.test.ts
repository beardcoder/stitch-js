import { describe, expect, it } from "bun:test";
import { enhance } from "../src/core/enhance";
import { tabs } from "../src/components/tabs";

function makeTabsHtml() {
  const div = document.createElement("div");
  div.innerHTML = `
    <div data-tabs>
      <div data-tab-list>
        <button data-tab>Tab 1</button>
        <button data-tab>Tab 2</button>
        <button data-tab>Tab 3</button>
      </div>
      <div data-tab-panel>Panel 1</div>
      <div data-tab-panel>Panel 2</div>
      <div data-tab-panel>Panel 3</div>
    </div>
  `;
  return div;
}

describe("tabs", () => {
  it("sets ARIA roles on mount", () => {
    const root = makeTabsHtml();
    enhance("[data-tabs]", tabs(), { root });

    const tabList = root.querySelector("[data-tab-list]")!;
    expect(tabList.getAttribute("role")).toBe("tablist");

    const tabEls = root.querySelectorAll("[data-tab]");
    tabEls.forEach((tab) => {
      expect(tab.getAttribute("role")).toBe("tab");
    });

    const panels = root.querySelectorAll("[data-tab-panel]");
    panels.forEach((panel) => {
      expect(panel.getAttribute("role")).toBe("tabpanel");
    });
  });

  it("activates first tab by default", () => {
    const root = makeTabsHtml();
    enhance("[data-tabs]", tabs(), { root });

    const tabEls = root.querySelectorAll("[data-tab]");
    expect(tabEls[0].getAttribute("aria-selected")).toBe("true");
    expect(tabEls[1].getAttribute("aria-selected")).toBe("false");

    const panels = root.querySelectorAll<HTMLElement>("[data-tab-panel]");
    expect(panels[0].hidden).toBe(false);
    expect(panels[1].hidden).toBe(true);
  });

  it("switches tab on click", () => {
    const root = makeTabsHtml();
    enhance("[data-tabs]", tabs(), { root });

    const tabEls = root.querySelectorAll<HTMLElement>("[data-tab]");
    tabEls[1].click();

    expect(tabEls[0].getAttribute("aria-selected")).toBe("false");
    expect(tabEls[1].getAttribute("aria-selected")).toBe("true");

    const panels = root.querySelectorAll<HTMLElement>("[data-tab-panel]");
    expect(panels[0].hidden).toBe(true);
    expect(panels[1].hidden).toBe(false);
  });

  it("supports custom defaultIndex", () => {
    const root = makeTabsHtml();
    enhance("[data-tabs]", tabs({ defaultIndex: 2 }), { root });

    const tabEls = root.querySelectorAll("[data-tab]");
    expect(tabEls[2].getAttribute("aria-selected")).toBe("true");

    const panels = root.querySelectorAll<HTMLElement>("[data-tab-panel]");
    expect(panels[2].hidden).toBe(false);
  });

  it("links tabs and panels via aria-controls / aria-labelledby", () => {
    const root = makeTabsHtml();
    enhance("[data-tabs]", tabs(), { root });

    const tabEls = root.querySelectorAll("[data-tab]");
    const panels = root.querySelectorAll("[data-tab-panel]");

    const controlsId = tabEls[0].getAttribute("aria-controls")!;
    expect(panels[0].id).toBe(controlsId);

    const labelledBy = panels[0].getAttribute("aria-labelledby")!;
    expect(tabEls[0].id).toBe(labelledBy);
  });
});
