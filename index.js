let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentView = "pending";

if ("Notification" in window) {
  Notification.requestPermission();
}

function showSystemNotification(title, message) {
  if (Notification.permission === "granted") {
    new Notification(title, { body: message });
  }
}

const form = document.getElementById("taskForm");
const input = document.getElementById("taskInput");
const details = document.getElementById("taskDetails");
const dueDate = document.getElementById("dueDate");
const priority = document.getElementById("priority");
const taskList = document.getElementById("taskList");
const search = document.getElementById("search");
const title = document.getElementById("sectionTitle");
const emptyMsg = document.getElementById("emptyMsg");

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
    const index = tasks.indexOf(task);

    checkDueDates(task);

    const div = document.createElement("div");
    div.className =
      "border-b py-2 flex justify-between items-center text-xs sm:text-sm";

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

      <div class="flex gap-2">
        <button onclick="editTask(${index})">✏️</button>
        <button onclick="deleteTask(${index})">❌</button>
      </div>
    `;

    taskList.appendChild(div);
  });
}

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

  scheduleReminder(newTask);

  save();
  form.reset();
});

function toggleComplete(i) {
  tasks[i].completed = !tasks[i].completed;
  showToast("✔ Updated");
  save();
}

function deleteTask(i) {
  tasks.splice(i, 1);
  showToast("❌ Deleted");
  save();
}

function editTask(i) {
  const newName = prompt("Edit task:", tasks[i].name);
  if (newName) {
    tasks[i].name = newName;
    showToast("✏️ Updated");
    save();
  }
}

function setView(view) {
  currentView = view;

  document.getElementById("pendingTab").classList.remove("bg-blue-700");
  document.getElementById("completedTab").classList.remove("bg-blue-700");

  document
    .getElementById(view === "pending" ? "pendingTab" : "completedTab")
    .classList.add("bg-blue-700");

  renderTasks();
}

function save() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}

search.addEventListener("input", renderTasks);

if (localStorage.getItem("dark") === "true") {
  document.documentElement.classList.add("dark");
}

function toggleDark() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem(
    "dark",
    document.documentElement.classList.contains("dark"),
  );
}

renderTasks();
