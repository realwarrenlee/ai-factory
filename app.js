import {
  shots,
  clamp,
  stateAt,
  ANSWER,
  PROMPT,
  INPUT_TOKENS,
  OUTPUT_TOKENS,
} from "./timeline.js";
const $ = (id) => document.getElementById(id);
const stage = document.querySelector(".stage"),
  canvas = $("scene"),
  ctx = canvas.getContext("2d");
let manifest = {},
  lastShot = null,
  raf = 0,
  currentKey = "",
  lastImage = null;
const cache = new Map(),
  pending = new Map(),
  queue = [];
let active = 0;
function pathFor(seq, index) {
  return `./frames/${seq}/${String(index).padStart(3, "0")}.webp`;
}
function load(seq, index, urgent = false) {
  const key = `${seq}/${index}`;
  if (cache.has(key)) {
    const image = cache.get(key);
    cache.delete(key);
    cache.set(key, image);
    return Promise.resolve(image);
  }
  if (pending.has(key)) return pending.get(key);
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  pending.set(key, promise);
  const task = { key, url: pathFor(seq, index), resolve };
  if (urgent) queue.unshift(task);
  else queue.push(task);
  pump();
  return promise;
}
function pump() {
  while (active < 5 && queue.length) {
    const task = queue.shift();
    active++;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      cache.set(task.key, image);
      while (cache.size > 300) cache.delete(cache.keys().next().value);
      finish(image);
    };
    image.onerror = () => finish(null);
    function finish(result) {
      active--;
      pending.delete(task.key);
      task.resolve(result);
      pump();
    }
    image.src = task.url;
  }
}
function draw(image) {
  if (!image) return;
  lastImage = image;
  const w = canvas.width,
    h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const scale = Math.max(w / image.width, h / image.height);
  const top = (h - image.height * scale) / 2;
  ctx.drawImage(
    image,
    (w - image.width * scale) / 2,
    top,
    image.width * scale,
    image.height * scale,
  );
}
function resize() {
  const rect = canvas.getBoundingClientRect(),
    dpr = Math.min(devicePixelRatio, 1.5);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  draw(lastImage);
  schedule();
}
function requestFrame(s) {
  const seq = s.shot.seq,
    count = manifest[seq]?.count;
  if (!count) return;
  const n = Math.round(s.frameProgress * (count - 1)),
    key = `${seq}/${n}`;
  if (key === currentKey) return;
  currentKey = key;
  if (cache.has(key)) {
    draw(cache.get(key));
    $("media-status").hidden = true;
  } else
    load(seq, n, true).then((image) => {
      if (currentKey !== key) return;
      if (image) {
        draw(image);
        $("media-status").hidden = true;
      } else {
        $("media-status").hidden = false;
        $("media-status").textContent =
          "This frame could not load. Scroll to try another.";
      }
    });
  for (let delta = 1; delta <= 15; delta++) {
    if (n + delta < count) load(seq, n + delta);
    if (n - delta >= 0) load(seq, n - delta);
  }
  const next = shots[shots.indexOf(s.shot) + 1];
  if (next && manifest[next.seq])
    load(
      next.seq,
      Math.round((next.from ?? 0) * (manifest[next.seq].count - 1)),
    );
}
function tokenContent(s) {
  const isInput = s.p < 0.66,
    g = s.generation;
  const words = isInput
    ? INPUT_TOKENS
    : g.candidates.length
      ? g.candidates
      : OUTPUT_TOKENS.slice(Math.max(0, g.count - 6), g.count);
  const split = clamp((s.p - 0.43) / 0.05);
  $("token-list").style.gap = isInput ? `${split * 7}px` : "7px";
  $("token-list").classList.toggle("unsplit", isInput && split < 0.1);
  const signature = JSON.stringify([isInput, words, g.selected, g.count]);
  if ($("token-list").dataset.signature !== signature) {
    $("token-list").replaceChildren(
      ...words.map((word, i) => {
        const e = document.createElement("span");
        e.className = `token${!isInput && g.candidates.length ? " candidate" : ""}${!isInput && (g.candidates.length ? g.selected && i === 0 : i === words.length - 1) ? " selected" : ""}`;
        e.textContent = word;
        return e;
      }),
    );
    $("token-list").dataset.signature = signature;
  }
  $("token-context").textContent = isInput
    ? PROMPT
    : g.candidates.length
      ? g.text
        ? `Reply so far: ${g.text}`
        : "The reply has not started yet."
      : "Each new piece joins the reply below.";
  $("token-label").textContent = isInput
    ? "Your question → text pieces · illustrative"
    : g.candidates.length
      ? g.selected
        ? "Selected next token · illustrative"
        : "Possible next tokens · illustrative"
      : "Latest output pieces · illustrative";
}
function answerContent(s) {
  const panel = $("answer-panel"),
    answer = $("answer");
  const show = s.p >= 0.69;
  panel.hidden = !show;
  panel.classList.toggle("complete", s.generation.text === ANSWER);
  const text = s.generation.text;
  if (answer.textContent !== text) answer.textContent = text;
}
function render() {
  raf = 0;
  const max = $("journey").offsetHeight - innerHeight;
  const s = stateAt(scrollY / max);
  stage.classList.toggle("opening", s.p < 0.1);
  stage.classList.toggle("ending", s.p >= 0.83);
  stage.classList.toggle("streaming", s.p >= 0.69 && s.p < 0.83);
  if (lastShot !== s.shot) {
    $("title").textContent = s.shot.title;
    $("description").textContent = s.shot.body;
    $("phase").textContent = s.shot.label;
    lastShot = s.shot;
  }

  const tokens = s.p >= 0.43 && s.p < 0.83;
  stage.classList.toggle("token-scene", tokens);
  $("tokens").hidden = !tokens;
  if (tokens) tokenContent(s);
  answerContent(s);

  requestFrame(s);
}
function schedule() {
  if (!raf) raf = requestAnimationFrame(render);
}
addEventListener("scroll", schedule, { passive: true });
addEventListener("resize", resize);
new ResizeObserver(resize).observe(canvas);
resize();
for (const element of document.querySelectorAll("[data-prompt]"))
  element.textContent = PROMPT;
// Eagerly load the hero frame so the canvas isn't blank on first paint.
load("campus", 0, true).then((image) => {
  if (image && !currentKey) {
    currentKey = "campus/0";
    draw(image);
    $("media-status").hidden = true;
  }
});
try {
  const response = await fetch("./frames/manifest.json");
  if (!response.ok) throw Error();
  manifest = await response.json();
  currentKey = "";
  schedule();
  // Preload the entire opening sequence so the first scroll is smooth.
  const campusCount = manifest.campus?.count ?? 0;
  for (let i = 0; i < campusCount; i++) load("campus", i);
} catch {
  $("media-status").textContent =
    "Factory imagery could not load. Please refresh to try again.";
}
