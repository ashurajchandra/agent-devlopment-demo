import {
  createTodo,
  removeTodo,
  sortTodos,
  toggleTodo,
  updateTodoStatus,
  createAuditEvent,
} from "/src/todos.js";

const KEY_TODOS = "todos";
const KEY_AUDIT = "auditHistory";

const form = document.querySelector("#add-form");
const input = document.querySelector("#title");
const errorBox = document.querySelector("#error");

const listTodo = document.querySelector("#list-todo");
const listInProgress = document.querySelector("#list-inprogress");
const listDone = document.querySelector("#list-done");
const auditLog = document.querySelector("#audit-log");

let todos = JSON.parse(localStorage.getItem(KEY_TODOS) ?? "[]");
let auditHistory = JSON.parse(localStorage.getItem(KEY_AUDIT) ?? "[]");

function save() {
  localStorage.setItem(KEY_TODOS, JSON.stringify(todos));
  localStorage.setItem(KEY_AUDIT, JSON.stringify(auditHistory));
}

function showToast(message) {
  const container = document.querySelector("#toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function formatLogEntry(text, status) {
  if (text === "-" && status === "-") return "-";
  if (!text || text === "-") return status || "-";
  if (!status || status === "-") return text || "-";
  return `${text} (${status})`;
}

function render() {
  // Clear lists
  listTodo.replaceChildren();
  listInProgress.replaceChildren();
  listDone.replaceChildren();

  // Populate lists
  todos.forEach((todo) => {
    // Ensure all existing todos have a status
    if (!todo.status) {
      todo.status = todo.done ? "done" : "todo";
    }

    const card = document.createElement("div");
    card.className = `todo-card ${todo.done ? "done" : ""}`;
    card.draggable = true;
    card.dataset.id = todo.id;

    // Drag start
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", todo.id);
      card.classList.add("dragging");
    });

    // Drag end
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = todo.done;
    check.addEventListener("change", () => {
      const oldTodo = { ...todo };
      todos = toggleTodo(todos, todo.id);
      const newTodo = todos.find((t) => t.id === todo.id);
      
      const event = createAuditEvent("status-change", oldTodo, newTodo);
      auditHistory = [event, ...auditHistory];
      
      save();
      render();
      showToast(`Updated "${todo.title}" to ${newTodo.status}`);
    });

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = todo.title;

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove";
    removeBtn.textContent = "Delete";
    removeBtn.addEventListener("click", () => {
      const oldTodo = { ...todo };
      todos = removeTodo(todos, todo.id);
      
      const event = createAuditEvent("delete", oldTodo, null);
      auditHistory = [event, ...auditHistory];
      
      save();
      render();
    });

    card.append(check, label, removeBtn);

    if (todo.status === "in-progress") {
      listInProgress.appendChild(card);
    } else if (todo.status === "done") {
      listDone.appendChild(card);
    } else {
      listTodo.appendChild(card);
    }
  });

  // Render audit history
  auditLog.replaceChildren(
    ...auditHistory.map((entry) => {
      const li = document.createElement("li");
      
      const ts = document.createElement("span");
      ts.className = "audit-ts";
      ts.textContent = new Date(entry.timestamp).toLocaleString();

      const op = document.createElement("span");
      op.className = "audit-op";
      op.textContent = entry.operation;

      const oldVal = document.createElement("span");
      oldVal.className = "audit-old";
      oldVal.textContent = formatLogEntry(entry.oldText, entry.oldStatus);

      const newVal = document.createElement("span");
      newVal.className = "audit-new";
      newVal.textContent = formatLogEntry(entry.newText, entry.newStatus);

      li.append(ts, op, oldVal, newVal);
      return li;
    })
  );
}

// Drag & Drop for Columns
document.querySelectorAll(".kanban-column").forEach((column) => {
  column.addEventListener("dragover", (e) => {
    e.preventDefault();
    column.classList.add("drag-over");
  });

  column.addEventListener("dragleave", () => {
    column.classList.remove("drag-over");
  });

  column.addEventListener("drop", (e) => {
    e.preventDefault();
    column.classList.remove("drag-over");
    
    const id = e.dataTransfer.getData("text/plain");
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    const targetStatus = column.dataset.status;
    if (todo.status !== targetStatus) {
      const oldTodo = { ...todo };
      todos = updateTodoStatus(todos, id, targetStatus);
      const newTodo = todos.find((t) => t.id === id);

      const event = createAuditEvent("status-change", oldTodo, newTodo);
      auditHistory = [event, ...auditHistory];

      save();
      render();
      showToast(`Moved "${todo.title}" to ${targetStatus}`);
    }
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const newTodo = createTodo(input.value);
    todos = [...todos, newTodo];
    
    const auditEvent = createAuditEvent("create", null, newTodo);
    auditHistory = [auditEvent, ...auditHistory];

    errorBox.hidden = true;
    input.value = "";
    
    save();
    render();
    showToast(`Created todo: "${newTodo.title}"`);
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
  }
});

render();
