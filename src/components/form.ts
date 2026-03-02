import { defineComponent } from "../core/component.js";

export interface FormOptions {
  /** Custom fetch options merged into the request. */
  fetchOptions: RequestInit;
  /** CSS class added to the form while submitting. Default: `is-submitting` */
  submittingClass: string;
  /** Called before the request is sent. Return `false` to cancel. */
  onBefore: ((el: HTMLFormElement, data: FormData) => boolean | void) | null;
  /** Called on successful response. */
  onSuccess: ((el: HTMLFormElement, response: Response) => void) | null;
  /** Called on network or HTTP error. */
  onError: ((el: HTMLFormElement, error: unknown) => void) | null;
  /** Called after the request completes (success or error). */
  onComplete: ((el: HTMLFormElement) => void) | null;
}

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
export const form = defineComponent<FormOptions>(
  {
    fetchOptions: {},
    submittingClass: "is-submitting",
    onBefore: null,
    onSuccess: null,
    onError: null,
    onComplete: null,
  },
  (ctx) => {
    const formEl = ctx.el as HTMLFormElement;
    if (formEl.tagName !== "FORM") return;

    const { options: o } = ctx;
    const controller = new AbortController();
    ctx.onDestroy(() => controller.abort());

    ctx.on("submit", (e) => {
      e.preventDefault();

      if (!formEl.checkValidity()) {
        formEl.reportValidity();
        return;
      }

      const data = new FormData(formEl);
      if (o.onBefore?.(formEl, data) === false) return;

      const action = formEl.action;
      const method = (formEl.method || "POST").toUpperCase();

      formEl.classList.add(o.submittingClass);
      const submitter = formEl.querySelector<HTMLButtonElement>(
        '[type="submit"]',
      );
      if (submitter) submitter.disabled = true;

      const fetchOpts: RequestInit = {
        method,
        signal: controller.signal,
        ...o.fetchOptions,
      };
      if (method !== "GET" && method !== "HEAD") {
        fetchOpts.body = data;
      }

      fetch(action, fetchOpts)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          o.onSuccess?.(formEl, response);
        })
        .catch((err: unknown) => {
          if ((err as Error).name !== "AbortError") {
            o.onError?.(formEl, err);
          }
        })
        .finally(() => {
          formEl.classList.remove(o.submittingClass);
          if (submitter) submitter.disabled = false;
          o.onComplete?.(formEl);
        });
    });
  },
);
