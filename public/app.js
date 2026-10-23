import { createTodo, removeTodo, sortTodos, toggleTodo, reorderTodos } from "/src/todos.js";

const KEY = "todos";
const AUDIT_KEY = "todo_audit_log";

const form = document.querySelector("#add-form");
const input = document.querySelector("#title");
const errorBox = document.querySelector("#error");
const list = document.querySelector("#list");
const auditList = document.querySelector("#audit-list");
const toastContainer = document.querySelector("#toast-container");

let todos = JSON.parse(localStorage.getItem(KEY) ?? "[]");
let auditLogs = JSON.parse(localStorage.getItem(AUDIT_KEY) ?? "[]");

function save() {
  localStorage.setItem(KEY, JSON.stringify(todos));
}

function addAuditLog(action, details) {
  const log = {
    action,
    details,
    timestamp: new Date().toLocaleTimeString()
  };
  auditLogs.unshift(log);
  localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLogs));
  renderAudit();
}

function showToast(message) {
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function renderAudit() {
  if (!auditList) return;
  auditList.replaceChildren(
    ...auditLogs.map((log) => {
      const item = document.createElement("li");
      item.className = "audit-item";
      
      const textSpan = document.createElement("span");
      textSpan.className = "audit-text";
      textSpan.textContent = `[${log.action}] ${log.details}`;
      
      const timeSpan = document.createElement("span");
      timeSpan.className = "audit-time";
      timeSpan.textContent = log.timestamp;
      
      item.append(textSpan, timeSpan);
      return item;
    })
  );
}

function render() {
  list.replaceChildren(
    ...todos.map((todo) => {
      const item = document.createElement("li");
      item.className = todo.done ? "done" : "";
      item.dataset.id = todo.id;
      item.draggable = true;

      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = todo.done;
      check.addEventListener("change", () => {
        todos = toggleTodo(todos, todo.id);
        const updated = todos.find((t) => t.id === todo.id);
        save();
        addAuditLog("UPDATE", `Toggled "${todo.title}" to ${updated.done ? "done" : "active"}`);
        showToast(`Updated completion for "${todo.title}"`);
        render();
      });

      const label = document.createElement("span");
      label.className = "label";
      label.textContent = todo.title;

      const remove = document.createElement("button");
      remove.className = "remove";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        todos = removeTodo(todos, todo.id);
        save();
        addAuditLog("DELETE", `Deleted "${todo.title}"`);
        render();
      });

      // Drag and Drop listeners
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", todo.id);
        item.classList.add("dragging");
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        list.querySelectorAll("li").forEach((li) => li.classList.remove("drag-over"));
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        const draggingItem = list.querySelector(".dragging");
        if (draggingItem && draggingItem !== item) {
          item.classList.add("drag-over");
        }
      });

      item.addEventListener("dragleave", () => {
        item.classList.remove("drag-over");
      });

      item.addEventListener("drop", (e) => {
        e.preventDefault();
        item.classList.remove("drag-over");
        const sourceId = e.dataTransfer.getData("text/plain");
        const targetId = todo.id;
        if (sourceId && sourceId !== targetId) {
          const sourceTodo = todos.find((t) => t.id === sourceId);
          if (sourceTodo) {
            todos = reorderTodos(todos, sourceId, targetId);
            save();
            addAuditLog("UPDATE", `Reordered: Moved "${sourceTodo.title}" to position of "${todo.title}"`);
            showToast(`Reordered: Moved "${sourceTodo.title}"`);
            render();
          }
        }
      });

      item.append(check, label, remove);
      return item;
    })
  );
  renderAudit();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const newTodo = createTodo(input.value);
    todos = [...todos, newTodo];
    errorBox.hidden = true;
    input.value = "";
    save();
    addAuditLog("CREATE", `Created "${newTodo.title}"`);
    showToast(`Created: "${newTodo.title}"`);
    render();
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
  }
});

render();
renderAudit();
