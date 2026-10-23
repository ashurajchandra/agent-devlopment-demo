import { createTodo, removeTodo, sortTodos, toggleTodo } from "/src/todos.js";

const KEY = "todos";
const form = document.querySelector("#add-form");
const input = document.querySelector("#title");
const errorBox = document.querySelector("#error");
const list = document.querySelector("#list");

let todos = JSON.parse(localStorage.getItem(KEY) ?? "[]");

function save() {
  localStorage.setItem(KEY, JSON.stringify(todos));
}

function render() {
  list.replaceChildren(
    ...sortTodos(todos).map((todo) => {
      const item = document.createElement("li");
      item.className = todo.done ? "done" : "";
      item.dataset.id = todo.id;

      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = todo.done;
      check.addEventListener("change", () => {
        todos = toggleTodo(todos, todo.id);
        save();
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
        render();
      });

      item.append(check, label, remove);
      return item;
    })
  );
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    todos = [...todos, createTodo(input.value)];
    errorBox.hidden = true;
    input.value = "";
    save();
    render();
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
  }
});

render();
