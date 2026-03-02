// Core
export { enhance, destroyAll } from "./core/enhance.js";
export { register, init, autoInit } from "./core/auto.js";
export { defineComponent } from "./core/component.js";
export { createStore, computed, effect } from "./core/store.js";
export { persistedStore } from "./core/persisted.js";
export { createRouter } from "./core/router.js";

// Example components
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

export type { ComponentContext, SetupFn } from "./core/component.js";
export type { Store, Computed, Listener } from "./core/store.js";
export type { PersistedStoreOptions } from "./core/persisted.js";
export type { Router, RouterOptions, RouteState, RouteParams } from "./core/router.js";
export type { TabsOptions } from "./components/tabs.js";
export type { AccordionOptions } from "./components/accordion.js";
export type { FormOptions } from "./components/form.js";
export type { AnimateOptions } from "./components/animate.js";
