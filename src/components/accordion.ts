import { defineComponent } from "../core/component.js";

export interface AccordionOptions {
  /** Selector for accordion item containers. Default: `[data-accordion-item]` */
  itemSelector: string;
  /** Selector for the trigger button within an item. Default: `[data-accordion-trigger]` */
  triggerSelector: string;
  /** Selector for the collapsible content within an item. Default: `[data-accordion-content]` */
  contentSelector: string;
  /** Allow multiple panels open simultaneously. Default: `false` */
  multiple: boolean;
}

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
 * </div>
 * ```
 */
export const accordion = defineComponent<AccordionOptions>(
  {
    itemSelector: "[data-accordion-item]",
    triggerSelector: "[data-accordion-trigger]",
    contentSelector: "[data-accordion-content]",
    multiple: false,
  },
  (ctx) => {
    const { options: o } = ctx;
    const items = ctx.queryAll(o.itemSelector);
    const groupId = ctx.uid("accordion");

    const triggers: HTMLElement[] = [];
    const contents: HTMLElement[] = [];

    items.forEach((item, i) => {
      const trigger = item.querySelector<HTMLElement>(o.triggerSelector);
      const content = item.querySelector<HTMLElement>(o.contentSelector);
      if (!trigger || !content) return;

      const triggerId = `${groupId}-trigger-${i}`;
      const contentId = `${groupId}-content-${i}`;

      trigger.id = triggerId;
      content.id = contentId;
      ctx.aria(trigger, { expanded: false, controls: contentId });
      ctx.aria(content, { labelledby: triggerId });
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

      if (!o.multiple && !isOpen) {
        triggers.forEach((t, i) => {
          ctx.aria(t, { expanded: false });
          contents[i].hidden = true;
        });
      }

      ctx.aria(trigger, { expanded: !isOpen });
      content.hidden = isOpen;
    }

    ctx.on("click", o.triggerSelector, (_e, delegate) => {
      const index = triggers.indexOf(delegate);
      if (index !== -1) toggle(index);
    });

    ctx.on("keydown", o.triggerSelector, (e, delegate) => {
      const index = triggers.indexOf(delegate);
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
    });
  },
);
