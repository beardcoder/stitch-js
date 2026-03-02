// Core
export { enhance, destroyAll } from "./core/enhance.js";
export { register, init, autoInit } from "./core/auto.js";

// Components
export { tabs } from "./components/tabs.js";
export { accordion } from "./components/accordion.js";
export { form } from "./components/form.js";
export { animate } from "./components/animate.js";

// Utilities
export { queryAll, setAria, uid } from "./utils/dom.js";

// Types
export type {
  CleanupFn,
  ComponentInstance,
  ComponentFactory,
  BehaviorDef,
  EnhanceOptions,
} from "./utils/types.js";

export type { TabsOptions } from "./components/tabs.js";
export type { AccordionOptions } from "./components/accordion.js";
export type { FormOptions } from "./components/form.js";
export type { AnimateOptions } from "./components/animate.js";
