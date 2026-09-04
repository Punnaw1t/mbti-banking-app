import { Question } from "./types";

// -----------------------------------------------------------------------
// PLACEHOLDER QUESTION BANK
// -----------------------------------------------------------------------
// Per project scope, the real MBTI question bank is supplied separately.
// This file only defines the SHAPE the test screen expects: each question
// targets one of the four dichotomies (EI / SN / TF / JP) and offers two
// options, each tagged with the trait it scores toward.
//
// To plug in the real question bank: replace the array below with your
// own questions using the same `Question` shape from lib/types.ts.
// The scoring engine (lib/mbti.ts) and every downstream screen (result,
// dashboard, company view) will keep working unchanged.
// -----------------------------------------------------------------------

export const questionBank: Question[] = [
  { id: 1, dichotomy: "EI", prompt: "Placeholder item 1 — Energy orientation", optionA: { label: "Option A (sample)", trait: "E" }, optionB: { label: "Option B (sample)", trait: "I" } },
  { id: 2, dichotomy: "EI", prompt: "Placeholder item 2 — Energy orientation", optionA: { label: "Option A (sample)", trait: "E" }, optionB: { label: "Option B (sample)", trait: "I" } },
  { id: 3, dichotomy: "EI", prompt: "Placeholder item 3 — Energy orientation", optionA: { label: "Option A (sample)", trait: "I" }, optionB: { label: "Option B (sample)", trait: "E" } },
  { id: 4, dichotomy: "SN", prompt: "Placeholder item 4 — Information gathering", optionA: { label: "Option A (sample)", trait: "S" }, optionB: { label: "Option B (sample)", trait: "N" } },
  { id: 5, dichotomy: "SN", prompt: "Placeholder item 5 — Information gathering", optionA: { label: "Option A (sample)", trait: "N" }, optionB: { label: "Option B (sample)", trait: "S" } },
  { id: 6, dichotomy: "SN", prompt: "Placeholder item 6 — Information gathering", optionA: { label: "Option A (sample)", trait: "S" }, optionB: { label: "Option B (sample)", trait: "N" } },
  { id: 7, dichotomy: "TF", prompt: "Placeholder item 7 — Decision making basis", optionA: { label: "Option A (sample)", trait: "T" }, optionB: { label: "Option B (sample)", trait: "F" } },
  { id: 8, dichotomy: "TF", prompt: "Placeholder item 8 — Decision making basis", optionA: { label: "Option A (sample)", trait: "F" }, optionB: { label: "Option B (sample)", trait: "T" } },
  { id: 9, dichotomy: "TF", prompt: "Placeholder item 9 — Decision making basis", optionA: { label: "Option A (sample)", trait: "T" }, optionB: { label: "Option B (sample)", trait: "F" } },
  { id: 10, dichotomy: "JP", prompt: "Placeholder item 10 — Lifestyle / structure", optionA: { label: "Option A (sample)", trait: "J" }, optionB: { label: "Option B (sample)", trait: "P" } },
  { id: 11, dichotomy: "JP", prompt: "Placeholder item 11 — Lifestyle / structure", optionA: { label: "Option A (sample)", trait: "P" }, optionB: { label: "Option B (sample)", trait: "J" } },
  { id: 12, dichotomy: "JP", prompt: "Placeholder item 12 — Lifestyle / structure", optionA: { label: "Option A (sample)", trait: "J" }, optionB: { label: "Option B (sample)", trait: "P" } },
];
