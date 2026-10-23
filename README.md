# Sample todo app

A tiny web app used as the "company repository" for the delivery pipeline demo.

- `src/todos.js`: pure todo logic (no browser, easy to unit test)
- `public/`: the page (HTML, CSS, browser script). Todos are kept in `localStorage`.
- `server.js`: serves `public/` and `src/` on `PORT` (default 4173)
- `test/`: unit tests, run with `npm test`

Conventions: plain ES modules, no dependencies, every change to `src/` needs a test.
