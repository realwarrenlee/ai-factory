import {
  mkdir,
  copyFile,
  readFile,
  writeFile,
  rm,
  stat,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { shots } from "../timeline.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
const source = path.join(root, "public/frames");
const manifest = JSON.parse(
  await readFile(path.join(source, "manifest.json"), "utf8"),
);
const files = ["index.html", "styles.css", "app.js", "timeline.js"];
const runtimeManifest = {};
const frames = [];

// Validate every referenced asset before replacing the generated output.
for (const name of new Set(shots.map((shot) => shot.seq))) {
  const count = manifest[name]?.count;
  if (!Number.isInteger(count) || count < 1)
    throw new Error(`Missing frame sequence: ${name}`);
  runtimeManifest[name] = { count };
  for (let i = 0; i < count; i++) {
    const relative = `${name}/${String(i).padStart(3, "0")}.webp`;
    await stat(path.join(source, relative));
    frames.push(relative);
  }
}
for (const file of files) await stat(path.join(root, file));
// This fixed target is always website/dist; never accept a caller-supplied deletion path.
if (
  path.dirname(output) !== path.resolve(root) ||
  path.basename(output) !== "dist"
)
  throw new Error("Invalid output directory");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of files)
  await copyFile(path.join(root, file), path.join(output, file));
for (const name of Object.keys(runtimeManifest))
  await mkdir(path.join(output, "frames", name), { recursive: true });
for (const file of frames)
  await copyFile(path.join(source, file), path.join(output, "frames", file));
await writeFile(
  path.join(output, "frames/manifest.json"),
  JSON.stringify(runtimeManifest),
);
console.log(
  `Built ${frames.length} frames and ${files.length} application files in ${output}`,
);
