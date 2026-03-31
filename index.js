document.addEventListener("DOMContentLoaded", () => {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let currentView = "pending";
  let reminderTimers = {}; // ✅ FIXED

  // Ask notification permission
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

  // Schedule reminder
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

  // Check due dates
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

    const searchVal = search.value.toLowerCase();

    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(searchVal) ||
        (t.details && t.details.toLowerCase().includes(searchVal)) ||
        t.priority.toLowerCase().includes(searchVal),
    );

    taskList.innerHTML = "";

    if (filtered.length === 0) {
      emptyMsg.classList.remove("hidden");
      return;
    } else {
      emptyMsg.classList.add("hidden");
    }

    filtered.forEach((task) => {
      const index = tasks.findIndex((t) => t === task); // ✅ FIXED

      checkDueDates(task);

      const div = document.createElement("div");
      div.className =
        "border-b py-2 flex justify-between items-start text-xs sm:text-sm gap-2";

      div.innerHTML = `
      <div>
        <div class="flex items-center gap-2">
          <input type="checkbox" ${task.completed ? "checked" : ""}
            onchange="toggleComplete(${index})"/>
          <span class="${task.completed ? "line-through opacity-50" : ""}">
            ${task.name}
          </span>
        </div>

        <p class="text-gray-500">${task.details || ""}</p>
        <p class="text-xs">📅 ${task.date || "No date"} | 🔥 ${task.priority}</p>
      </div>

      <div class="flex gap-2 shrink-0">
        <button onclick="editTask(${index})">✏️</button>
        <button onclick="deleteTask(${index})">❌</button>
      </div>
    `;

      taskList.appendChild(div);
    });
  }

  // Add task
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (input.value.trim() === "") return;

    const newTask = {
      name: input.value,
      details: details.value,
      date: dueDate.value,
      priority: priority.value,
      completed: false,
    };

    tasks.push(newTask);
    showToast("✅ Task added");

    scheduleReminder(newTask, tasks.length - 1);

    save();
    form.reset(); // ✅ FIXED
  });

  // Toggle complete
  window.toggleComplete = function (i) {
    tasks[i].completed = !tasks[i].completed;

    // ❗ stop reminder if completed
    if (tasks[i].completed && reminderTimers[i]) {
      clearTimeout(reminderTimers[i]);
    }

    showToast("✔ Updated");
    save();
  };

  // Delete task
  window.deleteTask = function (i) {
    if (reminderTimers[i]) {
      clearTimeout(reminderTimers[i]);
    }

    tasks.splice(i, 1);
    showToast("❌ Deleted");
    save();
  };

  // Edit task
  window.editTask = function (i) {
    const newName = prompt("Edit task:", tasks[i].name);
    if (newName) {
      tasks[i].name = newName;
      showToast("✏️ Updated");
      save();
    }
  };

  // Switch view
  window.setView = function (view) {
    currentView = view;

    document.getElementById("pendingTab").classList.remove("bg-blue-700");
    document.getElementById("completedTab").classList.remove("bg-blue-700");

    document
      .getElementById(view === "pending" ? "pendingTab" : "completedTab")
      .classList.add("bg-blue-700");

    renderTasks();
  };

  // Save
  function save() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
  }

  // Search
  search.addEventListener("input", renderTasks);

  // Dark mode
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

  // Initial render
  renderTasks();
});
