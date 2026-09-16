import test from "node:test";
import assert from "node:assert/strict";
import { stateAt, shots, ANSWER, OUTPUT_TOKENS } from "../timeline.js";
test("timeline covers every scroll position without gaps and stays in frame bounds", () => {
  for (let i = 0; i <= 10000; i++) {
    const s = stateAt(i / 10000);
    assert.ok(s.frameProgress >= 0 && s.frameProgress <= 1);
    assert.ok(s.shot);
  }
  for (let i = 1; i < shots.length; i++)
    assert.equal(shots[i - 1].end, shots[i].start);
});
test("response starts inside factory, finishes before the ending hold, and reverses with scroll", () => {
  assert.equal(stateAt(0.66).generation.text.length, 0);
  assert.ok(stateAt(0.75).generation.text.length > 0);
  assert.ok(stateAt(0.83).generation.text.length < ANSWER.length);
  assert.equal(stateAt(0.95).generation.text.length, ANSWER.length);
  assert.equal(stateAt(0).generation.text.length, 0);
});
test("scroll positions clamp to the first and last shots", () => {
  assert.equal(stateAt(-1).shot, shots[0]);
  assert.equal(stateAt(1.5).shot, shots.at(-1));
});

test("generated reply follows complete illustrative tokens and stays synchronized when reversing", () => {
  let previous = 0;
  for (let i = 0; i <= 1000; i++) {
    const s = stateAt(i / 1000),
      g = s.generation;
    assert.ok(g.count >= previous);
    previous = g.count;
    assert.equal(g.text, OUTPUT_TOKENS.slice(0, g.count).join(""));
    assert.ok(ANSWER.startsWith(g.text));
  }
  assert.equal(stateAt(0.675).generation.text, "");
  assert.equal(stateAt(0.7).generation.text, "An");
  assert.equal(stateAt(0.73).generation.text, "An AI");
  assert.equal(stateAt(1).generation.text, ANSWER);
  assert.equal(stateAt(0.7).generation.text, "An");
});
