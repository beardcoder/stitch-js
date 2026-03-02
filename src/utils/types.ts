/** A function that tears down a component. */
export type CleanupFn = () => void;

/** Lifecycle hooks for an enhanced component instance. */
export interface ComponentInstance {
  /** Tear down the component, remove listeners, restore DOM. */
  destroy: CleanupFn;
}

/**
 * A component factory — receives the target element and optional config,
 * attaches behavior, and returns a handle with a `destroy` method.
 */
export type ComponentFactory<O = unknown> = (
  el: HTMLElement,
  options?: O,
) => ComponentInstance;

/** A behavior definition that pairs a factory with its options. */
export interface BehaviorDef<O = unknown> {
  factory: ComponentFactory<O>;
  options?: O;
}

/** Options for the `enhance` call. */
export interface EnhanceOptions<O = unknown> {
  /** Override the default options passed to the factory. */
  options?: O;
  /** Scope the query to a subtree instead of `document`. */
  root?: ParentNode;
}
