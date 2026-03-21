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

    tasks.forEach((task, index) => {
        const li = document.createElement("li");

        const span = document.createElement("span");
        span.textContent = task.text;

        if (task.completed) {
            span.classList.add("completed");
        }
        
        span.onclick = () => toggleTask(index);
        span.ondblclick = () => startEdit(index);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.onclick = () => deleteTask(index);

        const editBtn = document.createElement("button");
        editBtn.textContent = "✏️";
        editBtn.onclick = () => startEdit(index);

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

function startEdit(index) {
    const list = document.getElementById("taskList");
    const li = list.children[index];

    const input = document.createElement("input");
    input.type = "text";
    input.value = tasks[index].text;

    
    li.replaceChild(input, li.querySelector("span"));

    input.focus();

    // save function
    function saveEdit() {
        const newText = input.value.trim();

        if (newText !== "") {
            tasks[index].text = newText;
            saveTasks();
            renderTasks();
        } else {
            renderTasks(); 
        }
    }

    // Enter 
    input.onkeydown = (e) => {
        if (e.key === "Enter") {
            saveEdit();
        }
    };

    // Klick outside
    input.onblur = () => {
        saveEdit();
    };
}

loadTasks();
renderTasks();