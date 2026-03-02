import type { ComponentFactory, ComponentInstance } from "../utils/types.js";
import { queryAll, setAria, uid } from "../utils/dom.js";

export interface AccordionOptions {
  /** Selector for accordion item containers. Default: `[data-accordion-item]` */
  itemSelector?: string;
  /** Selector for the trigger button within an item. Default: `[data-accordion-trigger]` */
  triggerSelector?: string;
  /** Selector for the collapsible content within an item. Default: `[data-accordion-content]` */
  contentSelector?: string;
  /** Allow multiple panels open simultaneously. Default: `false` */
  multiple?: boolean;
}

const DEFAULTS: Required<AccordionOptions> = {
  itemSelector: "[data-accordion-item]",
  triggerSelector: "[data-accordion-trigger]",
  contentSelector: "[data-accordion-content]",
  multiple: false,
};

/**
 * Accessible accordion component.
 *
 * Expected HTML:
 * ```html
 * <div data-accordion>
 *   <div data-accordion-item>
 *     <button data-accordion-trigger>Section 1</button>
 *     <div data-accordion-content>Content 1</div>
 *   </div>
 *   <div data-accordion-item>
 *     <button data-accordion-trigger>Section 2</button>
 *     <div data-accordion-content>Content 2</div>
 *   </div>
 * </div>
 * ```
 */
export function accordion(
  opts?: AccordionOptions,
): ComponentFactory<AccordionOptions> {
  const merged = { ...DEFAULTS, ...opts };

  return (el: HTMLElement): ComponentInstance => {
    const config = { ...merged };
    const items = queryAll(config.itemSelector, el);
    const groupId = uid("accordion");

    const triggers: HTMLElement[] = [];
    const contents: HTMLElement[] = [];

    items.forEach((item, i) => {
      const trigger = item.querySelector<HTMLElement>(config.triggerSelector);
      const content = item.querySelector<HTMLElement>(config.contentSelector);
      if (!trigger || !content) return;

      const triggerId = `${groupId}-trigger-${i}`;
      const contentId = `${groupId}-content-${i}`;

      trigger.id = triggerId;
      content.id = contentId;
      setAria(trigger, { expanded: false, controls: contentId });
      setAria(content, { labelledby: triggerId });
      content.setAttribute("role", "region");
      content.hidden = true;

      triggers.push(trigger);
      contents.push(content);
    });

    function toggle(index: number) {
      const trigger = triggers[index];
      const content = contents[index];
      if (!trigger || !content) return;

      const isOpen = trigger.getAttribute("aria-expanded") === "true";

      if (!config.multiple && !isOpen) {
        // Close all others
        triggers.forEach((t, i) => {
          setAria(t, { expanded: false });
          contents[i].hidden = true;
        });
      }

      setAria(trigger, { expanded: !isOpen });
      content.hidden = isOpen;
    }

    function onClick(e: Event) {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        config.triggerSelector,
      );
      if (!target) return;
      const index = triggers.indexOf(target);
      if (index !== -1) toggle(index);
    }

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const index = triggers.indexOf(target);
      if (index === -1) return;

      let next = index;
      if (e.key === "ArrowDown") next = (index + 1) % triggers.length;
      else if (e.key === "ArrowUp")
        next = (index - 1 + triggers.length) % triggers.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = triggers.length - 1;
      else return;

      e.preventDefault();
      triggers[next].focus();
    }

    el.addEventListener("click", onClick);
    el.addEventListener("keydown", onKeyDown);

    return {
      destroy() {
        el.removeEventListener("click", onClick);
        el.removeEventListener("keydown", onKeyDown);
      },
    };
  };
}
