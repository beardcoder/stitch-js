import { defineComponent } from "../core/component.js";

export interface AnimateOptions {
  /** CSS class to add when the element enters the viewport. Default: `is-visible` */
  activeClass: string;
  /** IntersectionObserver threshold (0–1). Default: `0.1` */
  threshold: number;
  /** Root margin for the observer. Default: `"0px"` */
  rootMargin: string;
  /** Only trigger once, then disconnect. Default: `true` */
  once: boolean;
}

/**
 * CSS-class-based scroll animation helper.
 * Adds a class when the element enters the viewport via IntersectionObserver.
 *
 * Pair with CSS:
 * ```css
 * .fade-in { opacity: 0; transition: opacity 0.4s; }
 * .fade-in.is-visible { opacity: 1; }
 * ```
 */
export const animate = defineComponent<AnimateOptions>(
  {
    activeClass: "is-visible",
    threshold: 0.1,
    rootMargin: "0px",
    once: true,
  },
  (ctx) => {
    const { options: o } = ctx;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            ctx.el.classList.add(o.activeClass);
            if (o.once) observer.disconnect();
          } else if (!o.once) {
            ctx.el.classList.remove(o.activeClass);
          }
        }
      },
      { threshold: o.threshold, rootMargin: o.rootMargin },
    );

    observer.observe(ctx.el);
    ctx.onDestroy(() => {
      observer.disconnect();
      ctx.el.classList.remove(o.activeClass);
    });
  },
);
