document.addEventListener("DOMContentLoaded", () => {
  function parseTasksFromStorage() {
    try {
      const data = JSON.parse(localStorage.getItem("tasks"));
      if (!Array.isArray(data)) return [];
      return data.map((task) => ({
        id: task.id || `${Date.now()}-${Math.random()}`,
        name: task.name || "",
        details: task.details || "",
        date: task.date || "",
        priority: task.priority || "low",
        completed:
          task.completed === true || task.completed === "true" ? true : false,
      }));
    } catch (err) {
      console.warn("Invalid tasks in localStorage, resetting:", err);
      localStorage.removeItem("tasks");
      return [];
    }
  }

  let tasks = parseTasksFromStorage();
  let currentView = localStorage.getItem("view") || "pending";
  let reminderTimers = {};

  
  if ("Notification" in window) {
    Notification.requestPermission();
  }

  function showSystemNotification(title, message) {
    if (Notification.permission === "granted") {
      new Notification(title, { body: message });
    }
  }

  // DOM elements
  const form = document.getElementById("taskForm");
  const input = document.getElementById("taskInput");
  const details = document.getElementById("taskDetails");
  const dueDate = document.getElementById("dueDate");
  const priority = document.getElementById("priority");
  const taskList = document.getElementById("taskList");
  const search = document.getElementById("search");
  const title = document.getElementById("sectionTitle");
  const emptyMsg = document.getElementById("emptyMsg");

  // Toast
  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 2000);
  }

  
  function scheduleReminder(task, index) {
    if (!task.date) return;

    const dueTime = new Date(task.date).getTime();
    const now = new Date().getTime();

    const oneHourBefore = dueTime - now - 60 * 60 * 1000;

    if (oneHourBefore > 0) {
      const timer = setTimeout(() => {
        if (!tasks[index].completed) {
          showToast("⏰ Reminder: " + task.name);
          showSystemNotification("Reminder", task.name);
        }
      }, oneHourBefore);

      reminderTimers[index] = timer;
    }
  }

  
  function checkDueDates(task) {
    if (!task.date) return;

    const today = new Date().toISOString().split("T")[0];
    const taskDay = task.date.split("T")[0];

    if (taskDay === today && !task.completed) {
      showToast("📅 Due today: " + task.name);
      showSystemNotification("Task Due Today", task.name);
    }
  }

  // Render tasks
  function renderTasks() {
    let filtered = tasks;

    if (currentView === "pending") {
      filtered = tasks.filter((t) => !t.completed);
      title.textContent = "Current Tasks";
    } else {
      filtered = tasks.filter((t) => t.completed);
      title.textContent = "Completed Tasks";
    }

    const searchVal = (search.value || "").toLowerCase();

    filtered = filtered.filter((t) => {
      const name = (t.name || "").toLowerCase();
      const detailsVal = (t.details || "").toLowerCase();
      const priorityVal = (t.priority || "").toLowerCase();
      return (
        name.includes(searchVal) ||
        detailsVal.includes(searchVal) ||
        priorityVal.includes(searchVal)
      );
    });

    taskList.innerHTML = "";

    if (filtered.length === 0) {
      emptyMsg.classList.remove("hidden");
      return;
    } else {
      emptyMsg.classList.add("hidden");
    }

    filtered.forEach((task) => {
      const index = tasks.findIndex((t) => t.id === task.id);

      checkDueDates(task);

      const div = document.createElement("div");
      div.className =
        "border-b py-4 flex flex-col md:flex-row justify-between items-start md:items-center text-base sm:text-lg gap-4";

      div.innerHTML = `
      <div class="flex flex-col gap-2 w-full">
        <div class="flex items-center gap-4">
          <input type="checkbox" ${task.completed ? "checked" : ""}
            onchange="toggleComplete(${index})" class="w-6 h-6" />
          <span class="${task.completed ? "line-through opacity-70" : ""} text-lg font-semibold">
            ${task.name || "(No name)"}
          </span>
        </div>

        <p class="text-gray-500 text-base">${task.details || ""}</p>
        <p class="text-sm text-gray-400">📅 ${task.date || "No date"} | 🔥 ${task.priority}</p>
      </div>

      <div class="flex gap-3 shrink-0">
        <button onclick="editTask(${index})" class="px-3 py-2 rounded bg-yellow-500 text-base hover:bg-yellow-600">✏️ Edit</button>
        <button onclick="deleteTask(${index})" class="px-3 py-2 rounded bg-red-500 text-base hover:bg-red-600">❌ Delete</button>
      </div>
    `;

      taskList.appendChild(div);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (input.value.trim() === "") return;

    const newTask = {
      id: `${Date.now()}-${Math.random()}`,
      name: input.value,
      details: details.value,
      date: dueDate.value,
      priority: priority.value || "low",
      completed: false,
    };

    tasks.push(newTask);
    showToast("✅ Task added");

    scheduleReminder(newTask, tasks.length - 1);

    save();
    form.reset(); 
  });

  
  window.toggleComplete = function (i) {
    tasks[i].completed = !tasks[i].completed;

    
    if (tasks[i].completed && reminderTimers[i]) {
      clearTimeout(reminderTimers[i]);
    }

    showToast("✔ Updated");
    save();
  };

  
  window.deleteTask = function (i) {
    if (reminderTimers[i]) {
      clearTimeout(reminderTimers[i]);
    }

    tasks.splice(i, 1);
    showToast("❌ Deleted");
    save();
  };

  window.editTask = function (i) {
    const newName = prompt("Edit task:", tasks[i].name);
    if (newName) {
      tasks[i].name = newName;
      showToast("✏️ Updated");
      save();
    }
  };

  window.setView = function (view) {
    currentView = view;
    localStorage.setItem("view", view);

    document.getElementById("pendingTab").classList.remove("bg-blue-700");
    document.getElementById("completedTab").classList.remove("bg-blue-700");

    document
      .getElementById(view === "pending" ? "pendingTab" : "completedTab")
      .classList.add("bg-blue-700");

    renderTasks();
  };

  function save() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
  }

  search.addEventListener("input", renderTasks);

  if (localStorage.getItem("dark") === "true") {
    document.documentElement.classList.add("dark");
  }

  window.toggleDark = function () {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem(
      "dark",
      document.documentElement.classList.contains("dark"),
    );
  };

  renderTasks();
});
