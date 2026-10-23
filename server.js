import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

// Serves /public at "/" and /src at "/src". Nothing else is reachable.
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname === "/" ? "/index.html" : url.pathname;
  const base = path.startsWith("/src/") ? root : join(root, "public");
  const file = normalize(join(base, path));
  if (!file.startsWith(base)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] ?? "text/plain" }).end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
});

const port = Number(process.env.PORT) || 4173;
server.listen(port, () => console.log(`Todo app on http://localhost:${port}`));
