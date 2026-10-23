import test from "node:test";
import assert from "node:assert/strict";

import { createTodo, removeTodo, sortTodos, toggleTodo, reorderTodos } from "../src/todos.js";

test("createTodo trims the title and starts not done", () => {
  const todo = createTodo("  buy milk ");
  assert.equal(todo.title, "buy milk");
  assert.equal(todo.done, false);
});

test("createTodo rejects an empty title", () => {
  assert.throws(() => createTodo("   "), /needs a title/);
});

test("toggleTodo flips only the matching todo", () => {
  const a = createTodo("a");
  const b = createTodo("b");
  const result = toggleTodo([a, b], a.id);
  assert.equal(result[0].done, true);
  assert.equal(result[1].done, false);
});

test("removeTodo drops the matching todo", () => {
  const a = createTodo("a");
  const b = createTodo("b");
  assert.deepEqual(removeTodo([a, b], a.id).map((t) => t.title), ["b"]);
});

test("sortTodos puts finished todos last and keeps the order otherwise", () => {
  const a = { ...createTodo("a"), done: true };
  const b = createTodo("b");
  const c = createTodo("c");
  assert.deepEqual(sortTodos([a, b, c]).map((t) => t.title), ["b", "c", "a"]);
});

test("reorderTodos rearranges the todos correctly", () => {
  const a = { id: "1", title: "a", done: false };
  const b = { id: "2", title: "b", done: false };
  const c = { id: "3", title: "c", done: false };
  
  // Drag a to b's position (moving 1st item to 2nd position)
  const result1 = reorderTodos([a, b, c], "1", "2");
  assert.deepEqual(result1.map(t => t.id), ["2", "1", "3"]);

  // Drag c to a's position (moving 3rd item to 1st position)
  const result2 = reorderTodos([a, b, c], "3", "1");
  assert.deepEqual(result2.map(t => t.id), ["3", "1", "2"]);

  // Non-existent id returns same list
  const result3 = reorderTodos([a, b, c], "99", "1");
  assert.deepEqual(result3.map(t => t.id), ["1", "2", "3"]);
});
