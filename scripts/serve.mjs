import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = fileURLToPath(new URL("../", import.meta.url));
const production = process.argv.includes("--dist");
const root = production ? path.join(project, "dist") : project;
const pages = new Set(["index.html", "styles.css", "app.js", "timeline.js"]);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webp": "image/webp",
};
const server = http.createServer(async (req, res) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const relative = pathname === "/" ? "index.html" : pathname.slice(1);
    const isFrame = /^frames\/(?:manifest\.json|[a-z]+\/\d{3}\.webp)$/.test(
      relative,
    );
    if (!pages.has(relative) && !isFrame) {
      res.writeHead(404).end("Not found");
      return;
    }
    const file = path.join(
      root,
      !production && isFrame ? "public" : "",
      relative,
    );
    const content = await readFile(file);
    res.writeHead(200, {
      "Content-Type": mime[path.extname(file)],
      "Content-Length": content.length,
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch {
    res.writeHead(404).end("Not found");
  }
});
server.listen(
  Number(process.env.PORT ?? (production ? 4174 : 4173)),
  "127.0.0.1",
  () => {
    console.log(
      `AI Factory ${production ? "production preview" : "development"}: http://127.0.0.1:${server.address().port}`,
    );
  },
);
