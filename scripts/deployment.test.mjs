import test from "node:test";
import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import path from "node:path";
import { shots } from "../timeline.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const exec = promisify(execFile);
test("production build is isolated, clears stale output and serves its assets", async () => {
  const build = path.join(root, "scripts/build.mjs");
  await exec(process.execPath, [build], { cwd: tmpdir() });
  await writeFile(path.join(root, "dist/stale-test.txt"), "obsolete output");
  await exec(process.execPath, [build], { cwd: tmpdir() });
  assert.deepEqual((await readdir(path.join(root, "dist"))).sort(), [
    "app.js",
    "frames",
    "index.html",
    "styles.css",
    "timeline.js",
  ]);
  const manifest = JSON.parse(
    await readFile(path.join(root, "dist/frames/manifest.json"), "utf8"),
  );
  assert.deepEqual(
    Object.keys(manifest).sort(),
    [...new Set(shots.map((s) => s.seq))].sort(),
  );
  for (const value of Object.values(manifest))
    assert.deepEqual(Object.keys(value), ["count"]);
  const server = spawn(
    process.execPath,
    [path.join(root, "scripts/serve.mjs"), "--dist"],
    {
      cwd: tmpdir(),
      env: { ...process.env, PORT: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  try {
    const url = await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Preview server did not start")),
        5000,
      );
      server.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      server.stdout.on("data", (data) => {
        const match = data.toString().match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) {
          clearTimeout(timeout);
          resolve(match[0]);
        }
      });
    });
    const page = await fetch(url);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /AI Factory/);
    for (const asset of [
      "app.js",
      "timeline.js",
      "styles.css",
      "frames/manifest.json",
      ...Object.keys(manifest).map((name) => `frames/${name}/000.webp`),
    ]) {
      const response = await fetch(`${url}/${asset}`);
      assert.equal(response.status, 200, asset);
      assert.ok((await response.arrayBuffer()).byteLength > 0, asset);
    }
    assert.equal((await fetch(`${url}/README.md`)).status, 404);
    assert.equal((await fetch(`${url}/scripts/serve.mjs`)).status, 404);
    assert.equal((await fetch(`${url}/frames/tray/000.webp`)).status, 404);
    const head = await fetch(url, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
  } finally {
    server.kill();
  }
});
