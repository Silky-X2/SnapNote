/* global module */
// ===== STATE =====
let tasks = [];
let currentFilter = "all";

// ===== PERSISTENCE =====
function loadTasks() {
    try {
        const raw = localStorage.getItem("snapnote_tasks");
        const parsed = JSON.parse(raw);
        tasks = Array.isArray(parsed)
            ? parsed.filter(t => t && typeof t.id !== "undefined" && typeof t.text === "string")
            : [];
    } catch (_e) {
        tasks = [];
    }
}

function saveTasks() {
    localStorage.setItem("snapnote_tasks", JSON.stringify(tasks));
}

function loadPrefs() {
    if (localStorage.getItem("snapnote_dark") === "true") {
        document.body.classList.add("dark");
    }
    const savedFilter = localStorage.getItem("snapnote_filter");
    if (["all", "active", "completed"].includes(savedFilter)) {
        currentFilter = savedFilter;
    }
}

function savePrefs() {
    localStorage.setItem("snapnote_dark", document.body.classList.contains("dark"));
    localStorage.setItem("snapnote_filter", currentFilter);
}

// ===== ID GENERATION =====
let _idCounter = 0;
function generateId() {
    return Date.now() + "-" + (++_idCounter) + "-" + Math.random().toString(36).slice(2, 7);
}

// ===== STATE MUTATIONS =====
function addTask(text) {
    if (!text || !text.trim()) return;
    tasks.push({ id: generateId(), text: text.trim(), completed: false });
    saveTasks();
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

function updateTask(id, newText) {
    const task = tasks.find(t => t.id === id);
    if (task && newText.trim()) {
        task.text = newText.trim();
        saveTasks();
    }
    renderTasks();
}

function setFilter(filter) {
    currentFilter = filter;
    savePrefs();
    renderTasks();
}

function toggleDarkMode() {
    document.body.classList.toggle("dark");
    savePrefs();
}

function resetState() {
    tasks = [];
    currentFilter = "all";
}

// ===== RENDERING =====
function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    // Update active filter button state
    document.querySelectorAll(".filters button").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.filter === currentFilter);
    });

    // Update stats
    const total = tasks.length;
    const done = tasks.filter(t => t.completed).length;
    const statsEl = document.getElementById("taskStats");
    if (statsEl) {
        statsEl.textContent = total === 0 ? "" : done + " / " + total + " done";
    }

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === "active") return !task.completed;
        if (currentFilter === "completed") return task.completed;
        return true;
    });

    // Empty state
    if (filteredTasks.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty-state";
        empty.textContent = total === 0
            ? "No tasks yet. Add one above!"
            : "No tasks match this filter.";
        list.appendChild(empty);
        return;
    }

    filteredTasks.forEach(task => {
        const li = document.createElement("li");

        const span = document.createElement("span");
        span.textContent = task.text;
        span.setAttribute("role", "button");
        span.setAttribute("tabindex", "0");
        span.setAttribute("aria-label", (task.completed ? "Unmark" : "Mark as done") + ": " + task.text);
        if (task.completed) {
            span.classList.add("completed");
        }
        span.onclick = () => toggleTask(task.id);
        span.ondblclick = e => startEdit(task.id, e);
        span.onkeydown = e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleTask(task.id);
            }
        };

        const editBtn = document.createElement("button");
        editBtn.textContent = "✏️";
        editBtn.setAttribute("aria-label", "Edit task: " + task.text);
        editBtn.onclick = e => startEdit(task.id, e);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.setAttribute("aria-label", "Delete task: " + task.text);
        deleteBtn.onclick = () => deleteTask(task.id);

        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);

        list.appendChild(li);
    });
}

// ===== INLINE EDIT =====
function startEdit(id, event) {
    const li = event.target.closest("li");
    const span = li.querySelector("span");
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const input = document.createElement("input");
    input.type = "text";
    input.value = task.text;
    input.setAttribute("aria-label", "Edit task text");
    li.replaceChild(input, span);
    input.focus();

    let saved = false;
    function saveEdit() {
        if (saved) return;
        saved = true;
        const newText = input.value.trim();
        if (newText) {
            updateTask(id, newText);
        } else {
            renderTasks();
        }
    }

    input.onkeydown = e => {
        if (e.key === "Enter") saveEdit();
        if (e.key === "Escape") { saved = true; renderTasks(); }
    };
    input.onblur = saveEdit;
}

// ===== EVENT BINDING =====
function bindEvents() {
    const taskInput = document.getElementById("taskInput");
    const addBtn = document.getElementById("addBtn");
    const darkBtn = document.getElementById("darkModeBtn");

    addBtn.addEventListener("click", () => {
        const text = taskInput.value.trim();
        if (text) {
            addTask(text);
            taskInput.value = "";
            taskInput.focus();
        }
    });

    taskInput.addEventListener("keydown", e => {
        if (e.key === "Enter") addBtn.click();
    });

    darkBtn.addEventListener("click", toggleDarkMode);

    document.querySelectorAll(".filters button").forEach(btn => {
        btn.addEventListener("click", () => setFilter(btn.dataset.filter));
    });
}

// ===== INIT (browser only) =====
if (typeof module === "undefined") {
    loadPrefs();
    loadTasks();
    bindEvents();
    renderTasks();
}

// ===== MODULE EXPORTS (tests / Node) =====
if (typeof module !== "undefined") {
    module.exports = {
        addTask, deleteTask, toggleTask, updateTask,
        setFilter, toggleDarkMode,
        loadTasks, saveTasks, loadPrefs, savePrefs,
        renderTasks, bindEvents, resetState,
        getTasks: () => tasks,
        getCurrentFilter: () => currentFilter
    };
}