export const PROMPT = "What is an AI factory?";
export const ANSWER =
  "An AI factory brings together computing, networks, power and cooling to run AI at scale. Here, a trained model turns your question into a reply, one token at a time.";
// Illustrative text pieces, not the output of a particular model tokenizer.
export const INPUT_TOKENS = ["What", " is", " an", " AI", " factory", "?"];
export const OUTPUT_TOKENS = ANSWER.match(/\s*[^\s.,]+|[.,]/g);
export const shots = [
  {
    start: 0,
    end: 0.1,
    seq: "campus",
    title: "You ask. What happens next?",
    body: "Every AI answer runs on physical hardware. Follow one question through the machines that produce its reply.",
    label: "",
  },
  {
    start: 0.1,
    end: 0.21,
    seq: "entry",
    from: 0,
    to: 0.58,
    title: "Your question reaches a data center.",
    body: "Networks carry your request from your device to computers running the model.",
    label: "The request",
  },
  {
    start: 0.21,
    end: 0.29,
    seq: "entry",
    from: 0.58,
    to: 1,
    title: "Software assigns the work.",
    body: "A server receives your request and schedules it to run on available computing hardware.",
    label: "Inside the factory",
  },
  {
    start: 0.29,
    end: 0.355,
    seq: "power",
    title: "The computation needs electricity.",
    body: "Power systems supply the servers and the equipment supporting them. They are running before your question arrives.",
    label: "Power",
  },
  {
    start: 0.355,
    end: 0.43,
    seq: "cooling",
    title: "Working chips produce heat.",
    body: "Cooling systems carry that heat away so the servers can keep operating.",
    label: "Cooling",
  },
  {
    start: 0.43,
    end: 0.51,
    seq: "cpu",
    title: "Your question becomes tokens.",
    body: "Tokens are pieces of text: a word, part of a word, or punctuation. The model receives each piece as a number.",
    label: "Preparing the input",
  },
  {
    start: 0.51,
    end: 0.58,
    seq: "gpu",
    title: "The model processes your question.",
    body: "GPUs calculate relationships between the input tokens using patterns learned during training.",
    label: "Understanding the context",
  },
  {
    start: 0.58,
    end: 0.66,
    seq: "network",
    title: "A large model can span many GPUs.",
    body: "In this illustrated setup, fast connections let processors exchange the results of their calculations.",
    label: "Working together",
  },
  {
    start: 0.66,
    end: 0.735,
    seq: "inference",
    from: 0.36,
    to: 0.65,
    title: "The reply starts with a choice.",
    body: "The model scores possible next tokens. One is selected and sent back as the beginning of your reply.",
    label: "Generating the answer",
  },
  {
    start: 0.735,
    end: 0.83,
    seq: "inference",
    from: 0.65,
    to: 1,
    title: "Each token shapes what comes next.",
    body: "The selected token joins the context. The model repeats the calculation, extending the reply one piece at a time.",
    label: "Generating the answer",
  },
  {
    start: 0.83,
    end: 1,
    seq: "campus",
    from: 1,
    to: 0,
    title: "An answer on your screen. A physical system behind it.",
    body: "Networks carried the request. Power and cooling sustained the hardware. The model generated the reply, one token at a time.",
    label: "",
  },
];
export const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
export function generationAt(p) {
  const count =
    p < 0.69
      ? 0
      : p < 0.725
        ? 1
        : p < 0.75
          ? 2
          : Math.min(
              OUTPUT_TOKENS.length,
              2 +
                Math.floor(
                  clamp((p - 0.75) / 0.15) * (OUTPUT_TOKENS.length - 2),
                ),
            );
  const text = OUTPUT_TOKENS.slice(0, count).join("");
  return {
    count,
    text,
    candidates:
      p >= 0.66 && p < 0.75
        ? count === 0
          ? ["An", "The", "A"]
          : count === 1
            ? [" AI", " automated", " intelligent"]
            : [" factory", " system", " model"]
        : [],
    selected:
      (p >= 0.68 && p < 0.69) ||
      (p >= 0.715 && p < 0.725) ||
      (p >= 0.74 && p < 0.75),
  };
}
export function stateAt(progress) {
  const p = clamp(progress),
    index = shots.findIndex((s) => p >= s.start && p < s.end),
    shot = shots[index < 0 ? shots.length - 1 : index];
  const local = clamp((p - shot.start) / (shot.end - shot.start)),
    phase = clamp((local - 0.12) / 0.76),
    generation = generationAt(p);
  return {
    p,
    shot,
    local,
    phase,
    frameProgress:
      (shot.from ?? 0) + phase * ((shot.to ?? 1) - (shot.from ?? 0)),
    generation,
  };
}
