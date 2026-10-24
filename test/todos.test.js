import test from "node:test";
import assert from "node:assert/strict";

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

test("updateTodoStatus changes status and synchronizes done field", () => {
  const a = createTodo("test status change");
  const list = [a];
  
  const updated1 = updateTodoStatus(list, a.id, "in-progress");
  assert.equal(updated1[0].status, "in-progress");
  assert.equal(updated1[0].done, false);

  const updated2 = updateTodoStatus(updated1, a.id, "done");
  assert.equal(updated2[0].status, "done");
  assert.equal(updated2[0].done, true);
});

test("createAuditEvent generates a standard event structure", () => {
  const todo1 = { id: "1", title: "old item", status: "todo", done: false };
  const todo2 = { id: "1", title: "new item", status: "in-progress", done: false };

  const event = createAuditEvent("status-change", todo1, todo2);
  assert.equal(event.operation, "status-change");
  assert.equal(event.oldText, "old item");
  assert.equal(event.oldStatus, "todo");
  assert.equal(event.newText, "new item");
  assert.equal(event.newStatus, "in-progress");
  assert.ok(event.timestamp);
});

test("addTagToTodo adds valid tags, avoids duplicates case-insensitively, and limits to 5", () => {
  const todo = createTodo("tag test");
  let list = [todo];

  // Trim and add
  list = addTagToTodo(list, todo.id, "  Work  ");
  assert.deepEqual(list[0].tags, ["Work"]);

  // Duplicate case-insensitive does nothing
  const countBefore = list[0].tags.length;
  list = addTagToTodo(list, todo.id, "work");
  assert.equal(list[0].tags.length, countBefore);

  // Validate length constraints
  assert.throws(() => addTagToTodo(list, todo.id, ""), /cannot be empty/);
  assert.throws(() => addTagToTodo(list, todo.id, "a".repeat(21)), /cannot exceed 20 characters/);

  // Max 5 tags
  list = addTagToTodo(list, todo.id, "Personal");
  list = addTagToTodo(list, todo.id, "Urgent");
  list = addTagToTodo(list, todo.id, "Code");
  list = addTagToTodo(list, todo.id, "Review");
  assert.deepEqual(list[0].tags, ["Work", "Personal", "Urgent", "Code", "Review"]);

  assert.throws(() => addTagToTodo(list, todo.id, "Extra"), /maximum of 5 tags/);
});

test("removeTagFromTodo removes tags case-insensitively", () => {
  const todo = { ...createTodo("remove tag test"), tags: ["Work", "Personal"] };
  let list = [todo];

  list = removeTagFromTodo(list, todo.id, "work");
  assert.deepEqual(list[0].tags, ["Personal"]);
});

test("getUniqueTags returns unique tags across all todos", () => {
  const t1 = { ...createTodo("t1"), tags: ["Work", "Personal"] };
  const t2 = { ...createTodo("t2"), tags: ["work", "Urgent"] };
  const t3 = { ...createTodo("t3") };

  const unique = getUniqueTags([t1, t2, t3]);
  assert.deepEqual(unique, ["Work", "Personal", "Urgent"]);
});
