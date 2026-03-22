let currentFilter = "all";

let tasks = [];

function loadTasks() {
    tasks = JSON.parse(localStorage.getItem("tasks")) || [];
}

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === "active") return !task.completed;
        if (currentFilter === "completed") return task.completed;
        return true;
    });

    filteredTasks.forEach((task) => {
        const realIndex = tasks.indexOf(task);

        const li = document.createElement("li");

        const span = document.createElement("span");
        span.textContent = task.text;

        if (task.completed) {
            span.classList.add("completed");
        }

        span.onclick = () => toggleTask(realIndex);
        span.ondblclick = (e) => startEdit(realIndex, e);

        const editBtn = document.createElement("button");
        editBtn.textContent = "✏️";
        editBtn.onclick = (e) => startEdit(realIndex, e);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.onclick = () => deleteTask(realIndex);

        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);

        list.appendChild(li);
    });
}

function addTask() {
    const input = document.getElementById("taskInput");
    const text = input.value.trim();

    if (!text) return;

    tasks.push({
        text: text,
        completed: false
    });

    input.value = "";

    saveTasks();
    renderTasks();
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;

    saveTasks();
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);

    saveTasks();
    renderTasks();
}

function toggleDarkMode() {
    document.body.classList.toggle("dark");
}

function startEdit(index, event) {
    const li = event.target.closest("li");

    const input = document.createElement("input");
    input.type = "text";
    input.value = tasks[index].text;

    const span = li.querySelector("span");
    li.replaceChild(input, span);

    input.focus();

    function saveEdit() {
        const newText = input.value.trim();

        if (newText !== "") {
            tasks[index].text = newText;
            saveTasks();
        }

        renderTasks();
    }

    input.onkeydown = (e) => {
        if (e.key === "Enter") saveEdit();
    };

    input.onblur = saveEdit;
}

function setFilter(filter) {
    currentFilter = filter;
    renderTasks();
}

loadTasks();
renderTasks();