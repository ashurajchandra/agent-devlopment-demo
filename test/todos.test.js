import test from "node:test";
import assert from "node:assert/strict";

import { createTodo, removeTodo, sortTodos, toggleTodo } from "../src/todos.js";

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
