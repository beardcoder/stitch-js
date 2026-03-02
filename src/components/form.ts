import type { ComponentFactory, ComponentInstance } from "../utils/types.js";

export interface FormOptions {
  /** Custom fetch options merged into the request. */
  fetchOptions?: RequestInit;
  /**
   * Called before the request is sent. Return `false` to cancel.
   * Receives the form element and the `FormData`.
   */
  onBefore?: (el: HTMLFormElement, data: FormData) => boolean | void;
  /** Called on successful response. */
  onSuccess?: (el: HTMLFormElement, response: Response) => void;
  /** Called on network or HTTP error. */
  onError?: (el: HTMLFormElement, error: unknown) => void;
  /** Called after the request completes (success or error). */
  onComplete?: (el: HTMLFormElement) => void;
  /** CSS class added to the form while submitting. Default: `is-submitting` */
  submittingClass?: string;
}

const DEFAULTS: Required<
  Pick<FormOptions, "submittingClass">
> = {
  submittingClass: "is-submitting",
};

/**
 * Progressive form enhancement: intercepts submit, sends via `fetch`,
 * and provides lifecycle hooks. Falls back to normal submit if JS fails.
 *
 * Expected HTML:
 * ```html
 * <form data-form action="/api/contact" method="post">
 *   <input name="email" type="email" required />
 *   <button type="submit">Send</button>
 * </form>
 * ```
 */
export function form(opts?: FormOptions): ComponentFactory<FormOptions> {
  const merged = { ...DEFAULTS, ...opts };

  return (el: HTMLElement): ComponentInstance => {
    const formEl = el as HTMLFormElement;
    if (formEl.tagName !== "FORM") {
      return { destroy() {} };
    }

    const config = { ...merged };
    const controller = new AbortController();

    async function onSubmit(e: SubmitEvent) {
      e.preventDefault();

      // Native validation
      if (!formEl.checkValidity()) {
        formEl.reportValidity();
        return;
      }

      const data = new FormData(formEl);

      if (config.onBefore?.(formEl, data) === false) return;

      const action = formEl.action;
      const method = (formEl.method || "POST").toUpperCase();

      formEl.classList.add(config.submittingClass);
      const submitter = formEl.querySelector<HTMLButtonElement>(
        '[type="submit"]',
      );
      if (submitter) submitter.disabled = true;

      try {
        const fetchOpts: RequestInit = {
          method,
          signal: controller.signal,
          ...config.fetchOptions,
        };

        if (method !== "GET" && method !== "HEAD") {
          fetchOpts.body = data;
        }

        const response = await fetch(action, fetchOpts);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        config.onSuccess?.(formEl, response);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          config.onError?.(formEl, err);
        }
      } finally {
        formEl.classList.remove(config.submittingClass);
        if (submitter) submitter.disabled = false;
        config.onComplete?.(formEl);
      }
    }

    formEl.addEventListener("submit", onSubmit);

    return {
      destroy() {
        controller.abort();
        formEl.removeEventListener("submit", onSubmit);
      },
    };
  };
}
