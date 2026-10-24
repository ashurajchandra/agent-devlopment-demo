// Pure todo logic. The browser script and the tests both import this file.

let counter = 0;

export function getLocalDateStr(dateInput) {
  if (!dateInput) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDueDate(dueDateStr) {
  const norm = getLocalDateStr(dueDateStr);
  if (!norm) return "";
  const parts = norm.split('-');
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${weekdays[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

export function createTodo(title, dueDate = null) {
  const text = String(title ?? "").trim();
  if (!text) throw new Error("A todo needs a title.");
  counter += 1;
  const todo = { id: `t${Date.now()}-${counter}`, title: text, done: false, status: "todo", tags: [] };
  const normDate = getLocalDateStr(dueDate);
  if (normDate) {
    todo.dueDate = normDate;
  }
  return todo;
}

export function toggleTodo(todos, id) {
  return todos.map((todo) => {
    if (todo.id === id) {
      const nextDone = !todo.done;
      return {
        ...todo,
        done: nextDone,
        status: nextDone ? "done" : "todo",
      };
    }
    return todo;
  });
}

export function updateTodoStatus(todos, id, newStatus) {
  if (!["todo", "in-progress", "done"].includes(newStatus)) {
    throw new Error("Invalid status");
  }
  return todos.map((todo) => {
    if (todo.id === id) {
      return {
        ...todo,
        status: newStatus,
        done: newStatus === "done",
      };
    }
    return todo;
  });
}

export function removeTodo(todos, id) {
  return todos.filter((todo) => todo.id !== id);
}

// Open todos first, finished ones last; otherwise keep the order they were added.
export function sortTodos(todos) {
  const indexed = todos.map((todo, index) => ({ todo, index }));

  indexed.sort((x, y) => {
    const a = x.todo;
    const b = y.todo;

    // 1. Completed status
    if (a.done !== b.done) {
      return Number(a.done) - Number(b.done);
    }

    // Both are open (done is false)
    if (!a.done) {
      const normA = getLocalDateStr(a.dueDate);
      const normB = getLocalDateStr(b.dueDate);
      const aValid = !!normA;
      const bValid = !!normB;

      if (aValid && bValid) {
        // Compare dates (earliest first)
        const timeA = new Date(normA).getTime();
        const timeB = new Date(normB).getTime();
        if (timeA !== timeB) {
          return timeA - timeB;
        }
      } else if (aValid) {
        return -1; // a has due date, b does not, so a comes first
      } else if (bValid) {
        return 1; // b has due date, a does not, so b comes first
      }
    }

    // Fallback to original order
    return x.index - y.index;
  });

  return indexed.map(item => item.todo);
}

export function createAuditEvent(operation, oldTodo, newTodo) {
  return {
    timestamp: new Date().toISOString(),
    operation,
    oldText: oldTodo ? oldTodo.title : "-",
    oldStatus: oldTodo ? oldTodo.status : "-",
    newText: newTodo ? newTodo.title : "-",
    newStatus: newTodo ? newTodo.status : "-"
  };
}

export function addTagToTodo(todos, id, tag) {
  const trimmed = String(tag ?? "").trim();
  if (!trimmed) {
    throw new Error("Tag cannot be empty.");
  }
  if (trimmed.length > 20) {
    throw new Error("Tag cannot exceed 20 characters.");
  }

  // Check if target todo has max tags before mapping to throw immediately if needed, or inside.
  // Actually, throwing inside map can be perfectly fine, but let's locate the todo to do validation.
  const target = todos.find(t => t.id === id);
  if (target) {
    const currentTags = target.tags || [];
    const exists = currentTags.some(t => t.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      return todos; // duplicate on the same todo does nothing
    }
    if (currentTags.length >= 5) {
      throw new Error("A todo can have a maximum of 5 tags.");
    }
  }

  return todos.map((todo) => {
    if (todo.id === id) {
      const currentTags = todo.tags || [];
      return {
        ...todo,
        tags: [...currentTags, trimmed]
      };
    }
    return todo;
  });
}

export function removeTagFromTodo(todos, id, tag) {
  return todos.map((todo) => {
    if (todo.id === id) {
      const currentTags = todo.tags || [];
      return {
        ...todo,
        tags: currentTags.filter((t) => t.toLowerCase() !== tag.toLowerCase())
      };
    }
    return todo;
  });
}

export function getUniqueTags(todos) {
  const seen = new Set();
  const result = [];
  todos.forEach((todo) => {
    const currentTags = todo.tags || [];
    currentTags.forEach((t) => {
      const lower = t.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push(t);
      }
    });
  });
  return result;
}
