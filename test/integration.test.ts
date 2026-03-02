import { describe, expect, it } from "bun:test";
import { defineComponent } from "../src/core/component";
import { enhance, destroyAll } from "../src/core/enhance";
import { createStore, computed, effect } from "../src/core/store";
import { createRouter } from "../src/core/router";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDoc(html: string): HTMLElement {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div;
}

// ---------------------------------------------------------------------------
// Common component examples
// ---------------------------------------------------------------------------

describe("example: Counter component", () => {
  const counter = defineComponent({ initial: 0 }, (ctx) => {
    const count = createStore(ctx.options.initial);
    const display = ctx.query(".count")!;

    ctx.sync(count, (val) => {
      display.textContent = String(val);
    });

    ctx.on("click", ".inc", () => count.update((n) => n + 1));
    ctx.on("click", ".dec", () => count.update((n) => n - 1));
  });

  it("increments and decrements the displayed count", () => {
    const root = makeDoc(`
      <div data-counter>
        <button class="dec">-</button>
        <span class="count">0</span>
        <button class="inc">+</button>
      </div>
    `);

    enhance("[data-counter]", counter(), { root });

    const inc = root.querySelector<HTMLElement>(".inc")!;
    const dec = root.querySelector<HTMLElement>(".dec")!;
    const display = root.querySelector(".count")!;

    inc.click();
    inc.click();
    expect(display.textContent).toBe("2");

    dec.click();
    expect(display.textContent).toBe("1");
  });

  it("accepts a custom initial value via options", () => {
    const root = makeDoc(`
      <div data-counter>
        <button class="dec">-</button>
        <span class="count">0</span>
        <button class="inc">+</button>
      </div>
    `);

    enhance("[data-counter]", counter({ initial: 10 }), { root });

    const display = root.querySelector(".count")!;
    expect(display.textContent).toBe("10");

    root.querySelector<HTMLElement>(".inc")!.click();
    expect(display.textContent).toBe("11");
  });

  it("cleans up on destroy — clicks no longer update", () => {
    const root = makeDoc(`
      <div data-counter>
        <button class="dec">-</button>
        <span class="count">0</span>
        <button class="inc">+</button>
      </div>
    `);

    const [instance] = enhance("[data-counter]", counter(), { root });
    const inc = root.querySelector<HTMLElement>(".inc")!;
    const display = root.querySelector(".count")!;

    inc.click();
    expect(display.textContent).toBe("1");

    instance.destroy();

    inc.click();
    expect(display.textContent).toBe("1"); // no change after destroy
  });
});

describe("example: Toggle component", () => {
  const toggle = defineComponent(
    { activeClass: "is-open", ariaAttr: "expanded" },
    (ctx) => {
      let open = false;

      ctx.on("click", ".toggle-trigger", (_e, delegate) => {
        open = !open;
        ctx.el.classList.toggle(ctx.options.activeClass, open);
        ctx.aria(delegate, { [ctx.options.ariaAttr]: open });
      });
    },
  );

  it("toggles active class and aria-expanded on click", () => {
    const root = makeDoc(`
      <div data-toggle>
        <button class="toggle-trigger">Menu</button>
        <div class="toggle-content">Content</div>
      </div>
    `);

    enhance("[data-toggle]", toggle(), { root });
    const trigger = root.querySelector<HTMLElement>(".toggle-trigger")!;
    const wrapper = root.querySelector<HTMLElement>("[data-toggle]")!;

    expect(wrapper.classList.contains("is-open")).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBeNull();

    trigger.click();
    expect(wrapper.classList.contains("is-open")).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    trigger.click();
    expect(wrapper.classList.contains("is-open")).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("supports custom activeClass option", () => {
    const root = makeDoc(`
      <div data-toggle>
        <button class="toggle-trigger">Menu</button>
      </div>
    `);

    enhance("[data-toggle]", toggle({ activeClass: "active" }), { root });
    root.querySelector<HTMLElement>(".toggle-trigger")!.click();
    expect(
      root.querySelector("[data-toggle]")!.classList.contains("active"),
    ).toBe(true);
  });
});

describe("example: Filtered list component", () => {
  const filteredList = defineComponent({}, (ctx) => {
    const items = ctx.queryAll(".list-item");
    const filter = createStore("");

    const matchingCount = computed([filter], (term) => {
      let count = 0;
      for (const item of items) {
        const text = item.textContent?.toLowerCase() ?? "";
        const visible = term === "" || text.includes(term.toLowerCase());
        item.hidden = !visible;
        if (visible) count++;
      }
      return count;
    });

    ctx.sync(matchingCount, (count) => {
      const status = ctx.query(".filter-status");
      if (status) status.textContent = `${count} items`;
    });

    ctx.on("input", ".filter-input", (e) => {
      filter.set((e.target as HTMLInputElement).value);
    });
  });

  it("filters list items based on input and updates count", () => {
    const root = makeDoc(`
      <div data-list>
        <input class="filter-input" />
        <span class="filter-status"></span>
        <div class="list-item">Apple</div>
        <div class="list-item">Banana</div>
        <div class="list-item">Avocado</div>
      </div>
    `);

    enhance("[data-list]", filteredList(), { root });

    const status = root.querySelector(".filter-status")!;
    expect(status.textContent).toBe("3 items");

    // Simulate typing 'a' — matches Apple, Banana, Avocado
    const input = root.querySelector<HTMLInputElement>(".filter-input")!;
    input.value = "a";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    // All 3 contain 'a'
    expect(status.textContent).toBe("3 items");

    // Type 'av' — matches Avocado only
    input.value = "av";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(status.textContent).toBe("1 items");

    const items = root.querySelectorAll(".list-item");
    expect((items[0] as HTMLElement).hidden).toBe(true); // Apple
    expect((items[1] as HTMLElement).hidden).toBe(true); // Banana
    expect((items[2] as HTMLElement).hidden).toBe(false); // Avocado

    // Clear filter — all visible
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(status.textContent).toBe("3 items");
  });
});

// ---------------------------------------------------------------------------
// Complex component examples — use ALL features together
// ---------------------------------------------------------------------------

describe("example: Todo App (complex — all features)", () => {
  /**
   * This complex example uses:
   * - defineComponent + enhance for mounting
   * - createStore for todo list state
   * - computed for derived filtered list
   * - effect for side-effects (updating DOM)
   * - ctx.on for delegated events
   * - ctx.emit for custom events
   * - ctx.data for initial data from HTML
   * - ctx.sync for reactive store → DOM binding
   * - ctx.onDestroy for cleanup
   * - ctx.uid for unique IDs
   * - ctx.aria for accessibility
   */

  interface Todo {
    id: string;
    text: string;
    done: boolean;
  }

  const todoApp = defineComponent({}, (ctx) => {
    // Read initial todos from embedded data
    const initialData = ctx.data<{ todos?: Todo[] }>();
    const todos = createStore<Todo[]>(initialData.todos ?? []);
    const filterStore = createStore<"all" | "active" | "done">("all");

    const filteredTodos = computed([todos, filterStore], (list, filter) => {
      if (filter === "active") return list.filter((t) => !t.done);
      if (filter === "done") return list.filter((t) => t.done);
      return list;
    });

    const activeCount = computed([todos], (list) =>
      list.filter((t) => !t.done).length,
    );

    // Render filtered todos into the list container
    const listEl = ctx.query(".todo-list")!;
    const countEl = ctx.query(".todo-count")!;

    ctx.sync(filteredTodos, (filtered) => {
      listEl.innerHTML = "";
      for (const todo of filtered) {
        const li = document.createElement("li");
        li.setAttribute("data-id", todo.id);
        li.classList.toggle("done", todo.done);
        li.innerHTML = `
          <button class="todo-toggle">${todo.done ? "✓" : "○"}</button>
          <span>${todo.text}</span>
          <button class="todo-remove">×</button>
        `;
        listEl.appendChild(li);
      }
    });

    ctx.sync(activeCount, (count) => {
      countEl.textContent = `${count} active`;
    });

    // Add a new todo
    ctx.on("submit", (e) => {
      e.preventDefault();
      const input = ctx.query<HTMLInputElement>(".todo-input");
      if (!input || !input.value.trim()) return;
      const id = ctx.uid("todo");
      todos.update((list) => [
        ...list,
        { id, text: input.value.trim(), done: false },
      ]);
      input.value = "";
    });

    // Toggle done state
    ctx.on("click", ".todo-toggle", (_e, delegate) => {
      const li = delegate.closest("li");
      const id = li?.getAttribute("data-id");
      if (!id) return;
      todos.update((list) =>
        list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
      );
    });

    // Remove a todo
    ctx.on("click", ".todo-remove", (_e, delegate) => {
      const li = delegate.closest("li");
      const id = li?.getAttribute("data-id");
      if (!id) return;
      todos.update((list) => list.filter((t) => t.id !== id));
    });

    // Filter buttons
    ctx.on("click", ".filter-btn", (_e, delegate) => {
      const filter = delegate.getAttribute("data-filter") as
        | "all"
        | "active"
        | "done";
      filterStore.set(filter);
      // Update ARIA for filter buttons
      ctx.queryAll(".filter-btn").forEach((btn) => {
        ctx.aria(btn, { pressed: btn === delegate });
      });
    });

    // Side-effect: log todo count changes (tests can verify via effect)
    const countLog: number[] = [];
    const stopEffect = effect([activeCount], (count) => {
      countLog.push(count);
    });

    ctx.onDestroy(stopEffect);
    ctx.onDestroy(() => {
      filteredTodos.dispose();
      activeCount.dispose();
    });
  });

  function makeTodoHtml(initialTodos: Todo[] = []) {
    return makeDoc(`
      <form data-todo>
        <script type="application/json">${JSON.stringify({ todos: initialTodos })}</script>
        <input class="todo-input" placeholder="Add todo" />
        <button type="submit">Add</button>
        <ul class="todo-list"></ul>
        <span class="todo-count"></span>
        <div>
          <button class="filter-btn" data-filter="all">All</button>
          <button class="filter-btn" data-filter="active">Active</button>
          <button class="filter-btn" data-filter="done">Done</button>
        </div>
      </form>
    `);
  }

  it("initializes with data from embedded JSON", () => {
    const root = makeTodoHtml([
      { id: "1", text: "Buy milk", done: false },
      { id: "2", text: "Walk dog", done: true },
    ]);

    enhance("[data-todo]", todoApp(), { root });

    const items = root.querySelectorAll(".todo-list li");
    expect(items.length).toBe(2);
    expect(root.querySelector(".todo-count")!.textContent).toBe("1 active");
  });

  it("adds a new todo via form submit", () => {
    const root = makeTodoHtml();
    enhance("[data-todo]", todoApp(), { root });

    const input = root.querySelector<HTMLInputElement>(".todo-input")!;
    input.value = "Learn stitch-js";

    const form = root.querySelector<HTMLFormElement>("[data-todo]")!;
    form.dispatchEvent(new Event("submit", { bubbles: true }));

    const items = root.querySelectorAll(".todo-list li");
    expect(items.length).toBe(1);
    expect(items[0].querySelector("span")!.textContent).toBe("Learn stitch-js");
    expect(root.querySelector(".todo-count")!.textContent).toBe("1 active");
  });

  it("toggles todo done state", () => {
    const root = makeTodoHtml([
      { id: "1", text: "Test", done: false },
    ]);

    enhance("[data-todo]", todoApp(), { root });

    expect(root.querySelector(".todo-count")!.textContent).toBe("1 active");

    const toggleBtn = root.querySelector<HTMLElement>(".todo-toggle")!;
    toggleBtn.click();

    expect(root.querySelector(".todo-count")!.textContent).toBe("0 active");
  });

  it("removes a todo", () => {
    const root = makeTodoHtml([
      { id: "1", text: "Task A", done: false },
      { id: "2", text: "Task B", done: false },
    ]);

    enhance("[data-todo]", todoApp(), { root });
    expect(root.querySelectorAll(".todo-list li").length).toBe(2);

    const removeBtn = root.querySelector<HTMLElement>(".todo-remove")!;
    removeBtn.click();

    expect(root.querySelectorAll(".todo-list li").length).toBe(1);
    expect(root.querySelector(".todo-count")!.textContent).toBe("1 active");
  });

  it("filters todos by all / active / done", () => {
    const root = makeTodoHtml([
      { id: "1", text: "Active task", done: false },
      { id: "2", text: "Done task", done: true },
      { id: "3", text: "Another active", done: false },
    ]);

    enhance("[data-todo]", todoApp(), { root });

    // Initially shows all
    expect(root.querySelectorAll(".todo-list li").length).toBe(3);

    // Filter: active
    const activeBtn = root.querySelector<HTMLElement>(
      '.filter-btn[data-filter="active"]',
    )!;
    activeBtn.click();
    expect(root.querySelectorAll(".todo-list li").length).toBe(2);

    // Filter: done
    const doneBtn = root.querySelector<HTMLElement>(
      '.filter-btn[data-filter="done"]',
    )!;
    doneBtn.click();
    expect(root.querySelectorAll(".todo-list li").length).toBe(1);

    // Filter: all
    const allBtn = root.querySelector<HTMLElement>(
      '.filter-btn[data-filter="all"]',
    )!;
    allBtn.click();
    expect(root.querySelectorAll(".todo-list li").length).toBe(3);
  });

  it("cleans up all stores and listeners on destroy", () => {
    const root = makeTodoHtml([
      { id: "1", text: "Task", done: false },
    ]);

    const [instance] = enhance("[data-todo]", todoApp(), { root });
    instance.destroy();

    // After destroy, verify the component is properly torn down
    expect(
      root.querySelector("[data-todo]")!.hasAttribute("data-stitch-enhanced"),
    ).toBe(false);
  });
});

describe("example: Dashboard with routed views (complex — all features)", () => {
  /**
   * This complex example uses:
   * - createRouter for hash-based navigation
   * - createStore + computed for application state
   * - effect for reactive route → DOM updates
   * - defineComponent + enhance for view components
   * - ctx.sync for store → DOM binding
   * - ctx.on for delegated events
   * - ctx.emit for component communication
   * - ctx.data for server-rendered configuration
   * - ctx.aria for accessible navigation
   * - ctx.onDestroy / destroyAll for cleanup
   * - ctx.uid for unique IDs
   */

  it("renders different views based on route and manages shared state", () => {
    const root = makeDoc(`
      <div data-dashboard>
        <script type="application/json">{"title":"My Dashboard"}</script>
        <nav>
          <a class="nav-link" href="#" data-route="">Home</a>
          <a class="nav-link" href="#users" data-route="users">Users</a>
          <a class="nav-link" href="#settings" data-route="settings">Settings</a>
        </nav>
        <h1 class="dash-title"></h1>
        <div class="view-container"></div>
        <span class="breadcrumb"></span>
      </div>
    `);

    const router = createRouter(["", "users", "users/:id", "settings"]);
    const notifications = createStore(3);

    // Computed: breadcrumb from route
    const breadcrumb = computed([router], (route) => {
      const parts = route.path ? route.path.split("/") : ["home"];
      return parts.join(" > ");
    });

    // Dashboard shell component
    const dashboard = defineComponent({}, (ctx) => {
      const config = ctx.data<{ title: string }>();
      const titleEl = ctx.query(".dash-title")!;
      const viewEl = ctx.query(".view-container")!;
      const crumbEl = ctx.query(".breadcrumb")!;

      titleEl.textContent = config.title;

      // Update breadcrumb reactively
      ctx.sync(breadcrumb, (text) => {
        crumbEl.textContent = text;
      });

      // Render view based on route
      const stopRouteEffect = effect([router], (route) => {
        switch (route.pattern) {
          case "":
            viewEl.textContent = "Welcome home";
            break;
          case "users":
            viewEl.textContent = "User list";
            break;
          case "users/:id":
            viewEl.textContent = `User profile: ${route.params.id}`;
            break;
          case "settings":
            viewEl.textContent = "Settings page";
            break;
          default:
            viewEl.textContent = "404 Not Found";
        }
      });

      // Navigation click handler with active link styling
      ctx.on("click", ".nav-link", (e, delegate) => {
        e.preventDefault();
        const routePath = delegate.getAttribute("data-route") ?? "";
        router.push(routePath);

        // Update active link aria
        ctx.queryAll(".nav-link").forEach((link) => {
          const isCurrent = link === delegate;
          ctx.aria(link, { current: isCurrent ? "page" : "false" });
        });
      });

      const groupId = ctx.uid("dashboard");
      titleEl.id = `${groupId}-title`;

      ctx.onDestroy(stopRouteEffect);
      ctx.onDestroy(() => breadcrumb.dispose());
    });

    const [instance] = enhance("[data-dashboard]", dashboard(), { root });

    // Initial state: home view
    const viewEl = root.querySelector(".view-container")!;
    const crumbEl = root.querySelector(".breadcrumb")!;
    const titleEl = root.querySelector(".dash-title")!;

    expect(titleEl.textContent).toBe("My Dashboard");
    expect(viewEl.textContent).toBe("Welcome home");
    expect(crumbEl.textContent).toBe("home");

    // Navigate to users
    router.push("users");
    expect(viewEl.textContent).toBe("User list");
    expect(crumbEl.textContent).toBe("users");

    // Navigate to specific user
    router.push("users/42");
    expect(viewEl.textContent).toBe("User profile: 42");
    expect(crumbEl.textContent).toBe("users > 42");

    // Navigate to settings
    router.push("settings");
    expect(viewEl.textContent).toBe("Settings page");
    expect(crumbEl.textContent).toBe("settings");

    // Navigate via link click
    const homeLink = root.querySelector<HTMLElement>('.nav-link[data-route=""]')!;
    homeLink.click();
    expect(viewEl.textContent).toBe("Welcome home");
    expect(homeLink.getAttribute("aria-current")).toBe("page");

    // Cleanup
    instance.destroy();
    router.destroy();

    expect(
      root.querySelector("[data-dashboard]")!.hasAttribute("data-stitch-enhanced"),
    ).toBe(false);
  });

  it("shares state between router and multiple components", () => {
    const root = makeDoc(`
      <div data-app>
        <div data-nav>
          <a class="link" data-path="">Home</a>
          <a class="link" data-path="about">About</a>
          <span class="badge">0</span>
        </div>
        <div data-content>
          <span class="route-display"></span>
          <span class="count-display">0</span>
          <button class="notify-btn">Notify</button>
        </div>
      </div>
    `);

    // Shared state
    const router = createRouter(["", "about"]);
    const messageCount = createStore(0);

    // Navigation component — reads router + messageCount
    const navComponent = defineComponent({}, (ctx) => {
      const badge = ctx.query(".badge")!;

      ctx.sync(messageCount, (count) => {
        badge.textContent = String(count);
      });

      ctx.on("click", ".link", (e, delegate) => {
        e.preventDefault();
        router.push(delegate.getAttribute("data-path") ?? "");
      });
    });

    // Content component — reads router, modifies messageCount
    const contentComponent = defineComponent({}, (ctx) => {
      const routeDisplay = ctx.query(".route-display")!;
      const countDisplay = ctx.query(".count-display")!;

      ctx.sync(router, (route) => {
        routeDisplay.textContent = route.path || "home";
      });

      ctx.sync(messageCount, (count) => {
        countDisplay.textContent = String(count);
      });

      ctx.on("click", ".notify-btn", () => {
        messageCount.update((n) => n + 1);
      });
    });

    enhance("[data-nav]", navComponent(), { root });
    enhance("[data-content]", contentComponent(), { root });

    const badge = root.querySelector(".badge")!;
    const routeDisplay = root.querySelector(".route-display")!;
    const countDisplay = root.querySelector(".count-display")!;

    // Initial state
    expect(routeDisplay.textContent).toBe("home");
    expect(badge.textContent).toBe("0");
    expect(countDisplay.textContent).toBe("0");

    // Navigate via nav link
    root.querySelector<HTMLElement>('.link[data-path="about"]')!.click();
    expect(routeDisplay.textContent).toBe("about");

    // Click notify button — shared state updates both components
    root.querySelector<HTMLElement>(".notify-btn")!.click();
    root.querySelector<HTMLElement>(".notify-btn")!.click();
    expect(badge.textContent).toBe("2");
    expect(countDisplay.textContent).toBe("2");

    // Navigate back home
    root.querySelector<HTMLElement>('.link[data-path=""]')!.click();
    expect(routeDisplay.textContent).toBe("home");

    // Cleanup
    destroyAll("[data-nav]", undefined, root);
    destroyAll("[data-content]", undefined, root);
    router.destroy();
  });
});
