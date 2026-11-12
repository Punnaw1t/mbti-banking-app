import { DecisionProfile, LikertAnswer, OceanScores, OceanTrait, ProfileCode, TestResult } from "./types";
import { questionBank } from "./questions";
import { OCEAN_NORMS } from "./oceanNorms";

// Clockwise around the pentagon, starting from the top.
export const TRAIT_ORDER: OceanTrait[] = ["O", "C", "E", "A", "N"];

export const TRAIT_META: Record<OceanTrait, { name: string; low: string; high: string }> = {
  O: { name: "Openness", low: "Prefers the proven and practical", high: "Curious, imaginative, drawn to new ideas" },
  C: { name: "Conscientiousness", low: "Flexible, works in bursts", high: "Organised, thorough, follows through" },
  E: { name: "Extraversion", low: "Reserved, reflects before speaking", high: "Outgoing, energised by people" },
  A: { name: "Agreeableness", low: "Direct, comfortable with friction", high: "Cooperative, considerate of others" },
  N: { name: "Neuroticism", low: "Calm and steady under pressure", high: "Feels stress and setbacks strongly" },
};

// =========================================================================
// MODEL COMPONENT (DSS): scores raw answers into the 5 OCEAN traits
// =========================================================================
export function scoreAnswers(answers: LikertAnswer[]): OceanScores {
  const s: OceanScores = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  answers.forEach((answer, i) => {
    const q = questionBank[i];
    s[q.trait] += q.reverse ? 6 - answer : answer;
  });
  return s;
}

export function buildResult(answers: LikertAnswer[]): TestResult {
  return { scores: scoreAnswers(answers), completedAt: new Date().toISOString() };
}

// Where a raw score sits among the 592,204 cleaned IPIP-50 respondents.
export function traitPercentile(trait: OceanTrait, raw: number): number {
  return OCEAN_NORMS[trait][raw - 10];
}

export function percentiles(s: OceanScores): OceanScores {
  return {
    O: traitPercentile("O", s.O),
    C: traitPercentile("C", s.C),
    E: traitPercentile("E", s.E),
    A: traitPercentile("A", s.A),
    N: traitPercentile("N", s.N),
  };
}

export function traitBand(percentile: number): "Low" | "Moderate" | "High" {
  if (percentile < 30) return "Low";
  return percentile < 70 ? "Moderate" : "High";
}

// Trait-leadership correlations from Judge, Bono, Ilies & Gerhardt (2002).
// Mirrored in data/build_ocean_dataset.py, which uses the same rule for the CSV.
const LEADERSHIP_WEIGHTS: Record<OceanTrait, number> = { E: 0.31, C: 0.28, N: -0.24, O: 0.24, A: 0.08 };
const EXECUTIVE_FIT_THRESHOLD = 70; // roughly the top 15% of the workforce

export function leadershipIndex(s: OceanScores): number {
  return leadershipIndexFromPercentiles(percentiles(s));
}

// Same index from percentiles directly, e.g. a scenario typed into the HR chatbot.
export function leadershipIndexFromPercentiles(p: OceanScores): number {
  let weighted = 0;
  let total = 0;
  TRAIT_ORDER.forEach((t) => {
    const w = LEADERSHIP_WEIGHTS[t];
    weighted += Math.abs(w) * (w > 0 ? p[t] : 100 - p[t]);
    total += Math.abs(w);
  });
  return Math.round((weighted / total) * 10) / 10;
}

// =========================================================================
// KNOWLEDGE BASE (DSS): IF-THEN production rules
// -------------------------------------------------------------------------
// R1: IF leadership index >= 70 THEN flag as executive-track.
// R2: IF the strongest trait is at or above the 60th percentile THEN the
//     decision profile is that trait's profile (N counts through its inverse,
//     emotional stability; ties resolve in leadership-weight order).
// R3: IF no trait reaches the 60th percentile THEN Balanced Generalist.
// =========================================================================
export function isExecutiveFit(s: OceanScores): boolean {
  return leadershipIndex(s) >= EXECUTIVE_FIT_THRESHOLD;
}

export const EXECUTIVE_FIT_MIN = EXECUTIVE_FIT_THRESHOLD;

const BALANCED_BELOW = 60;

export const profileRules: Record<ProfileCode, DecisionProfile> = {
  E: {
    code: "E", name: "The Mobiliser",
    decisionStyle: "Decisive people-led driver",
    decisionStyleDetail: "Thinks out loud, gathers momentum in the room, and moves quickly from discussion to a visible call.",
    description: "Sets direction through presence and energy, and rallies teams around a target. In banking, well suited to leading growth mandates, client-facing divisions, and change programmes that need a visible sponsor.",
  },
  C: {
    code: "C", name: "The Steward",
    decisionStyle: "Disciplined process-first executor",
    decisionStyleDetail: "Plans ahead, checks options against evidence and policy, and follows a decision through to completion.",
    description: "Decides carefully, documents why, and delivers on commitments. A natural fit for risk, compliance, audit, and operations leadership in a regulated bank.",
  },
  S: {
    code: "S", name: "The Steady Hand",
    decisionStyle: "Composed under-pressure decider",
    decisionStyleDetail: "Stays level during incidents and bad news, separating the signal from the noise before committing.",
    description: "Keeps judgement intact when stakes rise, and steadies the people around them. Valuable in incident command, crisis response, and treasury or trading-adjacent leadership.",
  },
  O: {
    code: "O", name: "The Visionary",
    decisionStyle: "Long-horizon systems thinker",
    decisionStyleDetail: "Looks for the pattern behind the problem and is willing to back an unproven approach if the logic holds.",
    description: "Reframes problems and weighs long-range possibilities before committing. A strong fit for strategy, product innovation, and enterprise technology leadership.",
  },
  A: {
    code: "A", name: "The Consensus Builder",
    decisionStyle: "Trust-building collaborative decider",
    decisionStyleDetail: "Brings stakeholders in early and shapes a decision that people will actually stand behind.",
    description: "Decides by building buy-in and protecting relationships. Effective in customer-experience, talent, and cross-functional leadership.",
  },
  B: {
    code: "B", name: "The Balanced Generalist",
    decisionStyle: "Adaptable situational decider",
    decisionStyleDetail: "No single trait dominates, so the approach shifts with what the situation calls for.",
    description: "No trait stands out strongly, so there is no one signature style to lean on and the approach can adapt across contexts. Useful in rotational and generalist roles.",
  },
};

export function getProfile(s: OceanScores): DecisionProfile {
  return profileFromPercentiles(percentiles(s));
}

export function profileFromPercentiles(p: OceanScores): DecisionProfile {
  // Leadership-weight order; a later trait must beat the current best outright.
  const strengths: [ProfileCode, number][] = [
    ["E", p.E], ["C", p.C], ["S", 100 - p.N], ["O", p.O], ["A", p.A],
  ];
  let best = strengths[0];
  strengths.forEach((entry) => { if (entry[1] > best[1]) best = entry; });
  return profileRules[best[1] < BALANCED_BELOW ? "B" : best[0]];
}
