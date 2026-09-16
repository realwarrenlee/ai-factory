import { createRequire } from "node:module";
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require(process.env.SHARP_MODULE || "sharp");
} catch {
  throw new Error(
    "Frame regeneration requires Sharp. Set SHARP_MODULE to an installed Sharp module. Normal builds do not need Sharp.",
  );
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "../blender/vera-rubin");
const sequences = {
  campus: ["renders-v6/film", 1, 96, 3],
  entry: ["renders-v6/film", 289, 672, 2],
  power: ["renders-v7/frames", 1, 144, 3],
  cooling: ["renders-v7/frames", 1153, 1296, 3],
  cpu: ["renders-v7/frames", 289, 432, 3],
  gpu: ["renders-v7/frames", 721, 864, 2],
  network: ["renders-v7/frames", 865, 1008, 3],
  inference: ["renders-v7/frames", 1009, 1152, 2],
};
const manifest = {};
let bytes = 0;
for (const [name, [folder, start, end, step]] of Object.entries(sequences)) {
  const directory = path.join(root, "public/frames", name);
  await mkdir(directory, { recursive: true });
  const indices = [];
  for (let n = start; n <= end; n += step) indices.push(n);
  if (indices.at(-1) !== end) indices.push(end);
  manifest[name] = { count: indices.length, source: folder, indices };
  for (let i = 0; i < indices.length; i++) {
    const output = path.join(directory, `${String(i).padStart(3, "0")}.webp`);
    await sharp(
      path.join(
        source,
        folder,
        `frame-${String(indices[i]).padStart(4, "0")}.png`,
      ),
    )
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 78, effort: 3 })
      .toFile(output);
    bytes += (await stat(output)).size;
  }
  console.log(`${name}: ${indices.length} frames`);
}
await writeFile(
  path.join(root, "public/frames/manifest.json"),
  JSON.stringify(manifest, null, 2),
);
console.log(`Total: ${(bytes / 1048576).toFixed(1)} MiB`);
