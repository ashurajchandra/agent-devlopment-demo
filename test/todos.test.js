import test from "node:test";
import assert from "node:assert/strict";

import {
  createTodo,
  removeTodo,
  sortTodos,
  toggleTodo,
  updateTodoStatus,
  createAuditEntry
} from "../src/todos.js";

test("createTodo trims the title and starts not done", () => {
  const todo = createTodo("  buy milk ");
  assert.equal(todo.title, "buy milk");
  assert.equal(todo.done, false);
  assert.equal(todo.status, "todo");
});

test("createTodo rejects an empty title", () => {
  assert.throws(() => createTodo("   "), /needs a title/);
});

test("toggleTodo flips only the matching todo", () => {
  const a = createTodo("a");
  const b = createTodo("b");
  const result = toggleTodo([a, b], a.id);
  assert.equal(result[0].done, true);
  assert.equal(result[0].status, "done");
  assert.equal(result[1].done, false);
  assert.equal(result[1].status, "todo");
});

test("removeTodo drops the matching todo", () => {
  const a = createTodo("a");
  const b = createTodo("b");
  assert.deepEqual(removeTodo([a, b], a.id).map((t) => t.title), ["b"]);
});

test("sortTodos puts finished todos last and keeps the order otherwise", () => {
  const a = { ...createTodo("a"), done: true, status: "done" };
  const b = createTodo("b");
  const c = createTodo("c");
  assert.deepEqual(sortTodos([a, b, c]).map((t) => t.title), ["b", "c", "a"]);
});

test("updateTodoStatus changes status and sets done correctly", () => {
  const a = createTodo("a");
  const result1 = updateTodoStatus([a], a.id, "in_progress");
  assert.equal(result1[0].status, "in_progress");
  assert.equal(result1[0].done, false);

  const result2 = updateTodoStatus([a], a.id, "done");
  assert.equal(result2[0].status, "done");
  assert.equal(result2[0].done, true);
});

test("createAuditEntry returns proper object with timestamp, oldVal, and newVal", () => {
  const before = Date.now();
  const entry = createAuditEntry("old description", "new description");
  const after = Date.now();

  assert.ok(entry.timestamp >= before && entry.timestamp <= after);
  assert.equal(entry.oldVal, "old description");
  assert.equal(entry.newVal, "new description");
  assert.equal(entry.previousText, "old description");
  assert.equal(entry.updatedText, "new description");
});
