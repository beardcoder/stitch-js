import { defineComponent } from "../core/component.js";

export interface TabsOptions {
  /** Selector for the tab list container. Default: `[data-tab-list]` */
  listSelector: string;
  /** Selector for individual tab triggers. Default: `[data-tab]` */
  tabSelector: string;
  /** Selector for tab panels. Default: `[data-tab-panel]` */
  panelSelector: string;
  /** Index of the initially active tab (0-based). Default: `0` */
  defaultIndex: number;
}

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
export const tabs = defineComponent<TabsOptions>(
  {
    listSelector: "[data-tab-list]",
    tabSelector: "[data-tab]",
    panelSelector: "[data-tab-panel]",
    defaultIndex: 0,
  },
  (ctx) => {
    const { options: o } = ctx;
    const tabList = ctx.query(o.listSelector);
    const tabEls = ctx.queryAll(o.tabSelector);
    const panelEls = ctx.queryAll(o.panelSelector);

    if (!tabList || tabEls.length === 0 || panelEls.length === 0) return;

    const groupId = ctx.uid("tabs");

    // Set ARIA roles
    tabList.setAttribute("role", "tablist");
    tabEls.forEach((tab, i) => {
      const tabId = `${groupId}-tab-${i}`;
      const panelId = `${groupId}-panel-${i}`;
      tab.setAttribute("role", "tab");
      tab.id = tabId;
      ctx.aria(tab, { controls: panelId });

      const panel = panelEls[i];
      if (panel) {
        panel.setAttribute("role", "tabpanel");
        panel.id = panelId;
        ctx.aria(panel, { labelledby: tabId });
      }
    });

    let activeIndex = o.defaultIndex;

    function activate(index: number) {
      if (index < 0 || index >= tabEls.length) return;
      activeIndex = index;
      tabEls.forEach((tab, i) => {
        const active = i === index;
        tab.setAttribute("tabindex", active ? "0" : "-1");
        ctx.aria(tab, { selected: active });
      });
      panelEls.forEach((panel, i) => {
        panel.hidden = i !== index;
      });
    }

    activate(activeIndex);

    ctx.on("click", o.tabSelector, (_e, delegate) => {
      const index = tabEls.indexOf(delegate);
      if (index !== -1) {
        activate(index);
        delegate.focus();
      }
    });

    ctx.on("keydown", o.tabSelector, (e, _delegate) => {
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
    });
  },
);
