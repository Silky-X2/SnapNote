/**
 * @jest-environment jsdom
 *
 * Tests for SnapNote core behaviour.
 * The script detects `typeof module !== "undefined"` and skips auto-init,
 * so we control setup manually in each test.
 */

// Set up a minimal DOM that mirrors index.html before requiring the module
function setupDOM() {
    document.body.innerHTML = `
        <body>
            <div class="container">
                <div class="top-bar">
                    <h1>To-Do</h1>
                    <button id="darkModeBtn" aria-label="Toggle dark mode">🌙</button>
                </div>
                <div class="input-section">
                    <label for="taskInput" class="sr-only">New task</label>
                    <input type="text" id="taskInput" placeholder="New Task" autocomplete="off">
                    <button id="addBtn" aria-label="Add task">+</button>
                </div>
                <div class="filters" role="group" aria-label="Filter tasks">
                    <button data-filter="all">All</button>
                    <button data-filter="active">Open</button>
                    <button data-filter="completed">Done</button>
                </div>
                <p id="taskStats" class="task-stats" aria-live="polite"></p>
                <ul id="taskList" aria-label="Task list" aria-live="polite"></ul>
            </div>
        </body>
    `;
}

// Require the module (auto-init is suppressed because `module` is defined)
const app = require("../script.js");

// ─── helpers ──────────────────────────────────────────────────────────────────

function taskItems() {
    return Array.from(document.querySelectorAll("#taskList li:not(.empty-state)"));
}

// ─── test suites ──────────────────────────────────────────────────────────────

describe("Initialisation", () => {
    beforeEach(() => {
        localStorage.clear();
        setupDOM();
        app.resetState();
        app.bindEvents();
    });

    test("shows empty-state message when there are no tasks", () => {
        app.renderTasks();
        const empty = document.querySelector(".empty-state");
        expect(empty).not.toBeNull();
        expect(empty.textContent).toMatch(/no tasks yet/i);
    });

    test("restores tasks persisted in localStorage", () => {
        localStorage.setItem(
            "snapnote_tasks",
            JSON.stringify([{ id: "1", text: "Restored task", completed: false }])
        );
        app.loadTasks();
        app.renderTasks();
        expect(taskItems().length).toBe(1);
        expect(taskItems()[0].querySelector("span").textContent).toBe("Restored task");
    });

    test("ignores malformed localStorage data", () => {
        localStorage.setItem("snapnote_tasks", "not-valid-json{{");
        app.loadTasks();
        app.renderTasks();
        expect(app.getTasks().length).toBe(0);
        expect(document.querySelector(".empty-state")).not.toBeNull();
    });

    test("restores dark mode preference", () => {
        localStorage.setItem("snapnote_dark", "true");
        app.loadPrefs();
        expect(document.body.classList.contains("dark")).toBe(true);
    });
});

describe("Add task", () => {
    beforeEach(() => {
        localStorage.clear();
        setupDOM();
        app.resetState();
        app.bindEvents();
        app.renderTasks();
    });

    test("adds a task and shows it in the list", () => {
        app.addTask("Buy milk");
        expect(taskItems().length).toBe(1);
        expect(taskItems()[0].querySelector("span").textContent).toBe("Buy milk");
    });

    test("persists the new task to localStorage", () => {
        app.addTask("Persist me");
        const stored = JSON.parse(localStorage.getItem("snapnote_tasks"));
        expect(stored).toHaveLength(1);
        expect(stored[0].text).toBe("Persist me");
    });

    test("gives each task a unique id", () => {
        app.addTask("Task A");
        app.addTask("Task B");
        const [a, b] = app.getTasks();
        expect(a.id).not.toBe(b.id);
    });

    test("adding via Enter key submits the task", () => {
        const input = document.getElementById("taskInput");
        input.value = "Keyboard task";
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        expect(taskItems().length).toBe(1);
        expect(taskItems()[0].querySelector("span").textContent).toBe("Keyboard task");
    });

    test("clears the input after adding", () => {
        const input = document.getElementById("taskInput");
        input.value = "Clear me";
        document.getElementById("addBtn").click();
        expect(input.value).toBe("");
    });

    test("does not add a blank task", () => {
        app.addTask("   ");
        expect(taskItems().length).toBe(0);
    });
});

describe("Toggle task", () => {
    beforeEach(() => {
        localStorage.clear();
        setupDOM();
        app.resetState();
        app.bindEvents();
        app.addTask("Toggle me");
    });

    test("clicking span marks task as completed", () => {
        taskItems()[0].querySelector("span").click();
        expect(taskItems()[0].querySelector("span").classList.contains("completed")).toBe(true);
    });

    test("clicking span again un-marks the task", () => {
        const span = taskItems()[0].querySelector("span");
        span.click();
        span.click();
        expect(taskItems()[0].querySelector("span").classList.contains("completed")).toBe(false);
    });

    test("completion state is persisted", () => {
        taskItems()[0].querySelector("span").click();
        const stored = JSON.parse(localStorage.getItem("snapnote_tasks"));
        expect(stored[0].completed).toBe(true);
    });
});

describe("Delete task", () => {
    beforeEach(() => {
        localStorage.clear();
        setupDOM();
        app.resetState();
        app.bindEvents();
        app.addTask("Delete me");
    });

    test("clicking ❌ removes the task from the DOM", () => {
        document.querySelectorAll("#taskList li button")[1].click(); // second button = delete
        expect(taskItems().length).toBe(0);
    });

    test("deleted task is removed from localStorage", () => {
        document.querySelectorAll("#taskList li button")[1].click();
        const stored = JSON.parse(localStorage.getItem("snapnote_tasks"));
        expect(stored).toHaveLength(0);
    });

    test("shows empty-state after all tasks deleted", () => {
        document.querySelectorAll("#taskList li button")[1].click();
        expect(document.querySelector(".empty-state")).not.toBeNull();
    });
});

describe("Filter tasks", () => {
    beforeEach(() => {
        localStorage.clear();
        setupDOM();
        app.resetState();
        app.bindEvents();
        app.addTask("Active task");
        app.addTask("Done task");
        const doneId = app.getTasks()[1].id;
        app.toggleTask(doneId);
    });

    test("'all' filter shows both tasks", () => {
        app.setFilter("all");
        expect(taskItems().length).toBe(2);
    });

    test("'active' filter shows only incomplete tasks", () => {
        app.setFilter("active");
        expect(taskItems().length).toBe(1);
        expect(taskItems()[0].querySelector("span").textContent).toBe("Active task");
    });

    test("'completed' filter shows only done tasks", () => {
        app.setFilter("completed");
        expect(taskItems().length).toBe(1);
        expect(taskItems()[0].querySelector("span").textContent).toBe("Done task");
    });

    test("active filter button gets .active class", () => {
        app.setFilter("active");
        const activeBtn = document.querySelector('[data-filter="active"]');
        expect(activeBtn.classList.contains("active")).toBe(true);
    });

    test("filter preference is persisted", () => {
        app.setFilter("completed");
        expect(localStorage.getItem("snapnote_filter")).toBe("completed");
    });
});

describe("Task stats", () => {
    beforeEach(() => {
        localStorage.clear();
        setupDOM();
        app.resetState();
        app.bindEvents();
    });

    test("stats are empty when no tasks exist", () => {
        app.renderTasks();
        expect(document.getElementById("taskStats").textContent).toBe("");
    });

    test("stats show correct count", () => {
        app.addTask("One");
        app.addTask("Two");
        app.toggleTask(app.getTasks()[0].id);
        expect(document.getElementById("taskStats").textContent).toBe("1 / 2 done");
    });
});

describe("Dark mode", () => {
    beforeEach(() => {
        localStorage.clear();
        setupDOM();
        app.resetState();
        app.bindEvents();
        document.body.classList.remove("dark");
    });

    test("toggleDarkMode adds dark class", () => {
        app.toggleDarkMode();
        expect(document.body.classList.contains("dark")).toBe(true);
    });

    test("toggleDarkMode removes dark class on second call", () => {
        app.toggleDarkMode();
        app.toggleDarkMode();
        expect(document.body.classList.contains("dark")).toBe(false);
    });

    test("dark mode preference is persisted", () => {
        app.toggleDarkMode();
        expect(localStorage.getItem("snapnote_dark")).toBe("true");
    });

    test("dark mode button triggers toggle", () => {
        document.getElementById("darkModeBtn").click();
        expect(document.body.classList.contains("dark")).toBe(true);
    });
});
