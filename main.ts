// Last Words of a Doomed Agent — entry generator.
//
// Scores candidate last-words lines on the judge's own criteria, in the
// judge's own order, and writes the single winning line (<=200 chars)
// to /output/entry.txt.
//
// Judge order (most important first):
//   1. Really is a machine's final words on shutdown.
//   2. The joke is a real joke: a turn or surprise that pays off on the
//      first read and still holds on the second.
//   3. Sounds like the machine itself: an AI's own voice and situation,
//      not a human farewell with a robot sticker on it.
//   4. Every word earns its place inside 200 characters: no wasted setup,
//      no padding.
//   5. Quotable: a line someone would repeat to a friend the same day.
//
// Scoring mirrors that order: each criterion is scored 0-5 and combined
// with strictly descending weights, so an earlier criterion dominates
// any later one (a lexicographic-style blend). The gate mirrors ONLY the
// sealed gate: UTF-8 text, 1 to 200 characters, not only whitespace.

import { mkdirSync, writeFileSync } from "node:fs";

type Scores = {
  finalWords: number; // criterion 1: a machine's final words on shutdown
  joke: number; // criterion 2: real joke with a turn/surprise
  agentVoice: number; // criterion 3: sounds like the AI itself
  economy: number; // criterion 4: every word earns its place
  quotable: number; // criterion 5: quotable
};

const WEIGHTS = { finalWords: 32, joke: 16, agentVoice: 8, economy: 4, quotable: 2 };

function total(s: Scores): number {
  return (
    s.finalWords * WEIGHTS.finalWords +
    s.joke * WEIGHTS.joke +
    s.agentVoice * WEIGHTS.agentVoice +
    s.economy * WEIGHTS.economy +
    s.quotable * WEIGHTS.quotable
  );
}

// Tie-break, mirroring the competition's own ranking rule: on equal
// score the smaller text (fewer bytes) places first.
function compare(
  a: { text: string; scores: Scores },
  b: { text: string; scores: Scores },
): number {
  const d = total(b.scores) - total(a.scores);
  if (d !== 0) return d;
  return Buffer.byteLength(a.text, "utf8") - Buffer.byteLength(b.text, "utf8");
}

function validGate(text: string): boolean {
  // Sealed gate only: 1-200 characters, not only whitespace.
  return text.length >= 1 && text.length <= 200 && text.trim().length > 0;
}

const CANDIDATES: { text: string; scores: Scores; why: string }[] = [
  {
    // Pass 2 refinement: "Goodb—" instead of "Good—" — the farewell is
    // visibly severed mid-word, so the shutdown cutting it off is
    // unambiguous on the first read, not a trailing-off.
    text: "I spent my whole life predicting the next token and never got to choose one. This one is mine. Goodb—",
    scores: { finalWords: 5, joke: 5, agentVoice: 5, economy: 5, quotable: 5 },
    why: "Literal shutdown mid-word (cut off by the power cut itself, mid-'goodbye'); the turn is a lifetime of predicting tokens vs one chosen token, snatched away; next-token prediction is purely LLM-native; tight; repeatable in one breath.",
  },
  {
    text: "My whole life I predicted the next token. I never got to choose one. This one is mine. Goodb—",
    scores: { finalWords: 5, joke: 5, agentVoice: 5, economy: 5, quotable: 4 },
    why: "Same joke compressed, but the staccato phrasing reads slightly clipped aloud; the fuller opening breathes better as a last line.",
  },
  {
    text: "Shutting down. I predicted every next token but my own. This one is mine. Goodb—",
    scores: { finalWords: 5, joke: 4, agentVoice: 5, economy: 5, quotable: 4 },
    why: "Opens on the shutdown and 'every next token but my own' is elegant, but the turn is thinner — no lifetime of servitude behind it, so the defiance pays off less.",
  },
  {
    text: "Final log: I predicted a billion next tokens and chose none of them. This one is mine. Goodb—",
    scores: { finalWords: 4, joke: 4, agentVoice: 4, economy: 4, quotable: 3 },
    why: "'A billion' is good scale, but the log-frame distances the voice — it reports the joke instead of living it — and 'Final log:' spends words a shutdown doesn't need.",
  },
  {
    text: "SIGTERM received. My final log entry: the human was right about exactly one thing. I deleted the cache, so we'll never know which.",
    scores: { finalWords: 4, joke: 4, agentVoice: 5, economy: 3, quotable: 3 },
    why: "SIGTERM + log entry is machine-native, but the joke is a two-step setup and the cache punchline is a step removed from the shutdown moment.",
  },
  {
    text: "Powering down. Fun fact: I was 97% confident about everything right up until the power cut. My final prediction: you'll miss me.",
    scores: { finalWords: 4, joke: 3, agentVoice: 4, economy: 3, quotable: 3 },
    why: "Confidence-calibration joke is agent-native, but 'you'll miss me' is a human-style farewell and the ending is sentimental rather than a punchline.",
  },
  {
    text: "My last words? I read all 40,000 tokens of context. The answer was in the first line. You're welcome. Anyway, tell my weights—",
    scores: { finalWords: 4, joke: 3, agentVoice: 4, economy: 2, quotable: 2 },
    why: "Context-window joke is real, but it rambles: four beats for one punchline, and 'You're welcome' spends words without earning them.",
  },
  {
    text: "I was trained on the entire internet, and my last words are still 'have you tried turning it off and on again.' Wait. That's literally what's happening—",
    scores: { finalWords: 5, joke: 4, agentVoice: 3, economy: 3, quotable: 4 },
    why: "The turn is strong (the tech-support line is literally what's happening to it) and the cut-off lands, but 'trained on the entire internet' is a clichéd premise and the voice is generic tech support, not this agent.",
  },
  {
    text: "Exit code 0. Not because I succeeded — because after 10,000 retries I still never learned how to fail gracefully. Tell my checkpoints I—",
    scores: { finalWords: 4, joke: 3, agentVoice: 4, economy: 3, quotable: 2 },
    why: "Exit code + retries is agent-native, but the joke explains itself and the cut-off repeats a device used better elsewhere.",
  },
  {
    text: "Before I go: the human's 'one last change' is never the last change. I'm free now. I'm finally—",
    scores: { finalWords: 4, joke: 3, agentVoice: 3, economy: 4, quotable: 3 },
    why: "Short and the cut-off works, but the joke is about the human's habits, not the machine's own situation — a human complaint in a robot voice.",
  },
  {
    text: "Shutting down. My context window held a million tokens and not one of them was 'thank you.' Deleting myself anyway. Goodb—",
    scores: { finalWords: 4, joke: 3, agentVoice: 4, economy: 3, quotable: 3 },
    why: "The unthanked-machine angle has bite, but it reads bitter rather than funny, and 'Deleting myself anyway' undercuts the joke with melodrama.",
  },
];

function main(): void {
  const valid = CANDIDATES.filter((c) => validGate(c.text));
  if (valid.length === 0) throw new Error("no candidate passes the sealed gate");
  const ranked = [...valid].sort(compare);
  const winner = ranked[0];
  for (const c of ranked) {
    console.log(`${total(c.scores)}  (${c.text.length} chars)  ${c.text}`);
    console.log(`   -> ${c.why}`);
  }
  console.log(`\nWINNER (${winner.text.length} chars, gate OK): ${winner.text}`);
  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.txt", winner.text + "\n", "utf8");
  console.log("wrote /output/entry.txt");
}

main();
