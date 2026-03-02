import type { ComponentFactory, ComponentInstance } from "../utils/types.js";
import { queryAll, setAria, uid } from "../utils/dom.js";

export interface TabsOptions {
  /** Selector for the tab list container. Default: `[data-tab-list]` */
  listSelector?: string;
  /** Selector for individual tab triggers. Default: `[data-tab]` */
  tabSelector?: string;
  /** Selector for tab panels. Default: `[data-tab-panel]` */
  panelSelector?: string;
  /** Index of the initially active tab (0-based). Default: `0` */
  defaultIndex?: number;
}

const DEFAULTS: Required<TabsOptions> = {
  listSelector: "[data-tab-list]",
  tabSelector: "[data-tab]",
  panelSelector: "[data-tab-panel]",
  defaultIndex: 0,
};

/**
 * Accessible tabs component.
 *
 * Expected HTML:
 * ```html
 * <div data-tabs>
 *   <div data-tab-list>
 *     <button data-tab>Tab 1</button>
 *     <button data-tab>Tab 2</button>
 *   </div>
 *   <div data-tab-panel>Content 1</div>
 *   <div data-tab-panel>Content 2</div>
 * </div>
 * ```
 */
export function tabs(opts?: TabsOptions): ComponentFactory<TabsOptions> {
  const merged = { ...DEFAULTS, ...opts };

  return (el: HTMLElement): ComponentInstance => {
    const config = { ...merged };
    const tabList = el.querySelector<HTMLElement>(config.listSelector);
    const tabEls = queryAll(config.tabSelector, el);
    const panelEls = queryAll(config.panelSelector, el);

    if (!tabList || tabEls.length === 0 || panelEls.length === 0) {
      return { destroy() {} };
    }

    const groupId = uid("tabs");

    // Set ARIA roles
    tabList.setAttribute("role", "tablist");

    tabEls.forEach((tab, i) => {
      const tabId = `${groupId}-tab-${i}`;
      const panelId = `${groupId}-panel-${i}`;
      const panel = panelEls[i];

      tab.setAttribute("role", "tab");
      tab.id = tabId;
      setAria(tab, { controls: panelId });

      if (panel) {
        panel.setAttribute("role", "tabpanel");
        panel.id = panelId;
        setAria(panel, { labelledby: tabId });
      }
    });

    let activeIndex = config.defaultIndex;

    function activate(index: number) {
      if (index < 0 || index >= tabEls.length) return;
      activeIndex = index;

      tabEls.forEach((tab, i) => {
        const isActive = i === index;
        tab.setAttribute("tabindex", isActive ? "0" : "-1");
        setAria(tab, { selected: isActive });
      });

      panelEls.forEach((panel, i) => {
        panel.hidden = i !== index;
      });
    }

    function onTabClick(e: Event) {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        config.tabSelector,
      );
      if (!target) return;
      const index = tabEls.indexOf(target);
      if (index !== -1) {
        activate(index);
        target.focus();
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      let next = activeIndex;
      if (e.key === "ArrowRight") next = (activeIndex + 1) % tabEls.length;
      else if (e.key === "ArrowLeft")
        next = (activeIndex - 1 + tabEls.length) % tabEls.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = tabEls.length - 1;
      else return;

      e.preventDefault();
      activate(next);
      tabEls[next].focus();
    }

    // Initialize
    activate(activeIndex);
    tabList.addEventListener("click", onTabClick);
    tabList.addEventListener("keydown", onKeyDown);

    return {
      destroy() {
        tabList.removeEventListener("click", onTabClick);
        tabList.removeEventListener("keydown", onKeyDown);
      },
    };
  };
}
