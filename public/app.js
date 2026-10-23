import { createTodo, removeTodo, sortTodos, toggleTodo, updateTodoStatus, createAuditEntry } from "/src/todos.js";

const KEY_TODOS = "todos";
const KEY_AUDIT = "auditLogs";

const form = document.querySelector("#add-form");
const input = document.querySelector("#title");
const errorBox = document.querySelector("#error");
const toastContainer = document.querySelector("#toast-container");
const auditTrailList = document.querySelector("#audit-trail");

const listTodo = document.querySelector("#list-todo");
const listInProgress = document.querySelector("#list-in_progress");
const listDone = document.querySelector("#list-done");

let todos = JSON.parse(localStorage.getItem(KEY_TODOS) ?? "[]");
let auditLogs = JSON.parse(localStorage.getItem(KEY_AUDIT) ?? "[]");

function saveTodos() {
  localStorage.setItem(KEY_TODOS, JSON.stringify(todos));
}

function saveAuditLogs() {
  localStorage.setItem(KEY_AUDIT, JSON.stringify(auditLogs));
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastContainer.appendChild(toast);
  
  // trigger animation/opacity
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

function logChange(prev, updated) {
  const entry = createAuditEntry(prev, updated);
  auditLogs.unshift(entry); // newest first
  saveAuditLogs();
  renderAuditLogs();
}

function renderAuditLogs() {
  auditTrailList.innerHTML = "";
  auditLogs.forEach((log) => {
    const li = document.createElement("li");
    const dateStr = new Date(log.timestamp).toLocaleString();
    li.innerHTML = `<span class="audit-time">[${dateStr}]</span> <span class="audit-prev">"${log.previousText}"</span> &rarr; <span class="audit-next">"${log.updatedText}"</span>`;
    auditTrailList.appendChild(li);
  });
}

function render() {
  listTodo.innerHTML = "";
  listInProgress.innerHTML = "";
  listDone.innerHTML = "";

  sortTodos(todos).forEach((todo) => {
    const item = document.createElement("li");
    item.className = todo.done ? "done" : "";
    item.dataset.id = todo.id;
    item.draggable = true;

    item.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", todo.id);
      item.classList.add("dragging");
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
    });

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = todo.done;
    check.addEventListener("change", () => {
      const oldTodo = todos.find(t => t.id === todo.id);
      const oldStatus = oldTodo.status;
      const oldDone = oldTodo.done;
      todos = toggleTodo(todos, todo.id);
      const updatedTodo = todos.find(t => t.id === todo.id);
      
      const newStatus = updatedTodo.status;
      const prevText = `"${todo.title}" (status: ${oldStatus}, done: ${oldDone})`;
      const nextText = `"${todo.title}" (status: ${newStatus}, done: ${updatedTodo.done})`;
      
      logChange(prevText, nextText);
      showToast(`Updated: "${todo.title}"`);
      
      saveTodos();
      render();
    });

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = todo.title;

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      logChange(`"${todo.title}" (status: ${todo.status})`, "Deleted");
      showToast(`Deleted: "${todo.title}"`);
      todos = removeTodo(todos, todo.id);
      saveTodos();
      render();
    });

    item.append(check, label, remove);

    // Append to corresponding list
    const status = todo.status || "todo";
    if (status === "todo") {
      listTodo.appendChild(item);
    } else if (status === "in_progress") {
      listInProgress.appendChild(item);
    } else if (status === "done") {
      listDone.appendChild(item);
    }
  });
}

// Drag & Drop Column setup
[listTodo, listInProgress, listDone].forEach((listEl) => {
  listEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    listEl.classList.add("dragover");
  });

  listEl.addEventListener("dragleave", () => {
    listEl.classList.remove("dragover");
  });

  listEl.addEventListener("drop", (e) => {
    e.preventDefault();
    listEl.classList.remove("dragover");
    const id = e.dataTransfer.getData("text/plain");
    const todo = todos.find((t) => t.id === id);
    const newStatus = listEl.dataset.status;

    if (todo && todo.status !== newStatus) {
      const oldStatus = todo.status;
      todos = updateTodoStatus(todos, id, newStatus);
      const prevText = `"${todo.title}" (status: ${oldStatus})`;
      const nextText = `"${todo.title}" (status: ${newStatus})`;
      
      logChange(prevText, nextText);
      showToast(`Updated: "${todo.title}" to ${newStatus}`);
      
      saveTodos();
      render();
    }
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const newTodo = createTodo(input.value);
    todos = [...todos, newTodo];
    errorBox.hidden = true;
    input.value = "";
    
    logChange("", `Created: "${newTodo.title}" (status: todo)`);
    showToast(`Created: "${newTodo.title}"`);
    
    saveTodos();
    render();
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
  }
});

render();
renderAuditLogs();
