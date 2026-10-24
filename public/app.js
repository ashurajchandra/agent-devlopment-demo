import {
  createTodo,
  removeTodo,
  sortTodos,
  toggleTodo,
  updateTodoStatus,
  createAuditEvent,
  addTagToTodo,
  removeTagFromTodo,
  getUniqueTags,
  getLocalDateStr,
  formatDueDate,
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

let selectedTagFilter = null;

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

function getTagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 90%)`;
}

function renderFilters() {
  const filterBar = document.querySelector("#filter-bar");
  if (!filterBar) return;
  filterBar.replaceChildren();

  const uniqueTags = getUniqueTags(todos);

  // 'All' chip
  const allChip = document.createElement("button");
  allChip.className = `filter-chip ${!selectedTagFilter ? "active" : ""}`;
  allChip.textContent = "All";
  allChip.addEventListener("click", () => {
    selectedTagFilter = null;
    render();
  });
  filterBar.appendChild(allChip);

  // Individual tag chips
  uniqueTags.forEach((tag) => {
    const chip = document.createElement("button");
    const isActive = selectedTagFilter && selectedTagFilter.toLowerCase() === tag.toLowerCase();
    chip.className = `filter-chip ${isActive ? "active" : ""}`;
    chip.textContent = tag;
    chip.addEventListener("click", () => {
      if (isActive) {
        selectedTagFilter = null;
      } else {
        selectedTagFilter = tag;
      }
      render();
    });
    filterBar.appendChild(chip);
  });
}

function render() {
  // Render filters first
  renderFilters();

  // Clear lists
  listTodo.replaceChildren();
  listInProgress.replaceChildren();
  listDone.replaceChildren();

  const filteredTodos = selectedTagFilter
    ? todos.filter((todo) => (todo.tags || []).some((tag) => tag.toLowerCase() === selectedTagFilter.toLowerCase()))
    : todos;

  const sortedTodos = sortTodos(filteredTodos);

  const matchesZero = selectedTagFilter && sortedTodos.length === 0;
  const noTodosMsg = document.querySelector("#no-todos-msg");
  if (noTodosMsg) {
    if (matchesZero) {
      noTodosMsg.style.display = "block";
    } else {
      noTodosMsg.style.display = "none";
    }
  }

  // Populate lists
  sortedTodos.forEach((todo) => {
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

    const topRow = document.createElement("div");
    topRow.className = "todo-top-row";

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

    let dueDateSpan = null;
    if (todo.dueDate) {
      const normDate = getLocalDateStr(todo.dueDate);
      if (normDate) {
        dueDateSpan = document.createElement("span");
        dueDateSpan.className = "todo-due-date";
        
        const formatted = formatDueDate(normDate);
        if (todo.done) {
          dueDateSpan.textContent = ` (${formatted})`;
        } else {
          const today = new Date();
          const localTodayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          if (normDate < localTodayStr) {
            dueDateSpan.textContent = ` (${formatted} - Overdue)`;
            dueDateSpan.classList.add("overdue");
          } else if (normDate === localTodayStr) {
            dueDateSpan.textContent = ` (${formatted} - Due today)`;
            dueDateSpan.classList.add("due-today");
          } else {
            dueDateSpan.textContent = ` (${formatted})`;
          }
        }
      }
    }

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

    if (dueDateSpan) {
      topRow.append(check, label, dueDateSpan, removeBtn);
    } else {
      topRow.append(check, label, removeBtn);
    }

    const tagsContainer = document.createElement("div");
    tagsContainer.className = "todo-tags-container";

    const currentTags = todo.tags || [];
    currentTags.forEach((tag) => {
      const tagChip = document.createElement("span");
      tagChip.className = "tag-chip";
      tagChip.textContent = tag;
      tagChip.style.backgroundColor = getTagColor(tag);

      const removeTagBtn = document.createElement("button");
      removeTagBtn.className = "remove-tag-btn";
      removeTagBtn.textContent = "x";
      removeTagBtn.setAttribute("aria-label", `Remove tag ${tag}`);
      removeTagBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        todos = removeTagFromTodo(todos, todo.id, tag);
        save();
        render();
      });

      tagChip.appendChild(removeTagBtn);
      tagsContainer.appendChild(tagChip);
    });

    const addTagForm = document.createElement("div");
    addTagForm.className = "add-tag-form";

    const addTagInput = document.createElement("input");
    addTagInput.type = "text";
    addTagInput.className = "add-tag-input";
    addTagInput.placeholder = "Add tag";
    addTagInput.setAttribute("aria-label", "Add tag to todo");
    addTagInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        const val = addTagInput.value.trim();
        if (val) {
          try {
            todos = addTagToTodo(todos, todo.id, val);
            save();
            render();
          } catch (err) {
            showToast(err.message);
          }
        }
      }
    });

    addTagForm.appendChild(addTagInput);

    card.append(topRow, tagsContainer, addTagForm);

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
    const dueDateInput = document.querySelector("#due-date");
    const newTodo = createTodo(input.value, dueDateInput ? dueDateInput.value : null);
    todos = [...todos, newTodo];
    
    const auditEvent = createAuditEvent("create", null, newTodo);
    auditHistory = [auditEvent, ...auditHistory];

    errorBox.hidden = true;
    input.value = "";
    if (dueDateInput) {
      dueDateInput.value = "";
    }
    
    save();
    render();
    showToast(`Created todo: "${newTodo.title}"`);
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
  }
});

render();
