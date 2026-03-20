function addTask() {
    const input = document.getElementById("taskInput");
    const taskText = input.value.trim();

    if (taskText === "") return;

    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = taskText;

    span.onclick = () => {
        span.classList.toggle("completed");
        saveTasks();
    };

    const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
            deleteBtn.onclick = () => {
            li.remove();
            saveTasks();
    };

    li.appendChild(span);
    li.appendChild(deleteBtn);

    document.getElementById("taskList").appendChild(li);

    input.value = "";

    saveTasks();
}

    function saveTasks() {
    const tasks = [];

    document.querySelectorAll("#taskList li").forEach(li => {
        const span = li.querySelector("span");

        tasks.push({
            text: span.textContent,
            completed: span.classList.contains("completed")
        });
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    tasks.forEach(task => {
        const li = document.createElement("li");

        const span = document.createElement("span");
        span.textContent = task.text;

        if (task.completed) {
            span.classList.add("completed");
        }

        span.onclick = () => {
            span.classList.toggle("completed");
            saveTasks();
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.onclick = () => {
            li.remove();
            saveTasks();
        };

        li.appendChild(span);
        li.appendChild(deleteBtn);

        document.getElementById("taskList").appendChild(li);
    });
}
    function toggleDarkMode() {
        document.body.classList.toggle("dark");
    }
    loadTasks();