// Pure todo logic. The browser script and the tests both import this file.

let counter = 0;

export function createTodo(title) {
  const text = String(title ?? "").trim();
  if (!text) throw new Error("A todo needs a title.");
  counter += 1;
  return { id: `t${Date.now()}-${counter}`, title: text, done: false };
}

export function toggleTodo(todos, id) {
  return todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo));
}

export function removeTodo(todos, id) {
  return todos.filter((todo) => todo.id !== id);
}

// Open todos first, finished ones last; otherwise keep the order they were added.
export function sortTodos(todos) {
  return [...todos].sort((a, b) => Number(a.done) - Number(b.done));
}
