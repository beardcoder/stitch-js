import type { ComponentFactory, ComponentInstance } from "../utils/types.js";

export interface AnimateOptions {
  /** CSS class to add when the element enters the viewport. Default: `is-visible` */
  activeClass?: string;
  /** IntersectionObserver threshold (0–1). Default: `0.1` */
  threshold?: number;
  /** Root margin for the observer. Default: `"0px"` */
  rootMargin?: string;
  /** Only trigger once, then disconnect. Default: `true` */
  once?: boolean;
}

const DEFAULTS: Required<AnimateOptions> = {
  activeClass: "is-visible",
  threshold: 0.1,
  rootMargin: "0px",
  once: true,
};

/**
 * CSS-class-based scroll animation helper.
 * Adds a class when the element enters the viewport via IntersectionObserver.
 *
 * Expected HTML:
 * ```html
 * <div data-animate class="fade-in">
 *   Content that animates in on scroll
 * </div>
 * ```
 *
 * Pair with CSS:
 * ```css
 * .fade-in { opacity: 0; transition: opacity 0.4s; }
 * .fade-in.is-visible { opacity: 1; }
 * ```
 */
export function animate(
  opts?: AnimateOptions,
): ComponentFactory<AnimateOptions> {
  const merged = { ...DEFAULTS, ...opts };

  return (el: HTMLElement): ComponentInstance => {
    const config = { ...merged };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add(config.activeClass);
            if (config.once) observer.disconnect();
          } else if (!config.once) {
            el.classList.remove(config.activeClass);
          }
        }
      },
      {
        threshold: config.threshold,
        rootMargin: config.rootMargin,
      },
    );

    observer.observe(el);

    return {
      destroy() {
        observer.disconnect();
        el.classList.remove(config.activeClass);
      },
    };
  };
}
