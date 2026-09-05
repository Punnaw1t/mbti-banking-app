import { Archetype, MbtiCode, Question, Scores, Trait, TestResult } from "./types";

// =========================================================================
// MODEL COMPONENT (DSS): scores raw answers into the 4 MBTI dichotomies
// =========================================================================
export function scoreAnswers(answers: Trait[]): Scores {
  const s: Scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  answers.forEach((t) => (s[t] += 1));
  return s;
}

export function typeFromScores(s: Scores): MbtiCode {
  const code =
    (s.E >= s.I ? "E" : "I") +
    (s.S >= s.N ? "S" : "N") +
    (s.T >= s.F ? "T" : "F") +
    (s.J >= s.P ? "J" : "P");
  return code as MbtiCode;
}

// =========================================================================
// KNOWLEDGE BASE (DSS): IF-THEN production rules
// -------------------------------------------------------------------------
// Rule form:  IF (MBTI code = X) THEN (decision-maker archetype = Y)
// The four archetypes emphasised by the assignment brief — Commander,
// Executive, Architect, Logistician — are flagged executiveFit = true and
// are the styles the HR Executive is asked to weight most heavily for
// upper-management / executive-track banking roles. The remaining 12
// types are included so every test result maps to a concrete, explainable
// decision style rather than being left unclassified.
// =========================================================================
export const archetypeRules: Record<MbtiCode, Archetype> = {
  ENTJ: {
    code: "ENTJ", name: "The Commander", group: "Analyst",
    decisionStyle: "Decisive strategic driver",
    description:
      "Sets a clear direction fast, mobilises teams around bold targets, and is comfortable making high-stakes calls under uncertainty. In banking, well suited to leading turnarounds, M&A integration, or aggressive growth mandates.",
    executiveFit: true,
    icon: "🎯",
  },
  ESTJ: {
    code: "ESTJ", name: "The Executive", group: "Sentinel",
    decisionStyle: "Structured operational commander",
    description:
      "Runs decisions through policy, precedent, and measurable process. Reliable for enforcing controls, standardising operations, and delivering on committed targets — a strong fit for COO-track and branch-network leadership.",
    executiveFit: true,
    icon: "💼",
  },
  INTJ: {
    code: "INTJ", name: "The Architect", group: "Analyst",
    decisionStyle: "Long-horizon systems planner",
    description:
      "Builds decisions from long-range models and systemic risk analysis before committing. Strong fit for strategy, risk modelling, and enterprise technology leadership where a multi-year view matters more than speed.",
    executiveFit: true,
    icon: "📐",
  },
  ISTJ: {
    code: "ISTJ", name: "The Logistician", group: "Sentinel",
    decisionStyle: "Methodical compliance-first executor",
    description:
      "Decides conservatively, verifies against rules and history, and values consistency over improvisation. A natural fit for risk, compliance, audit, and back-office operations leadership in a regulated bank.",
    executiveFit: true,
    icon: "📋",
  },

  ENTP: { code: "ENTP", name: "The Debater", group: "Analyst", decisionStyle: "Rapid opportunistic strategist", description: "Generates and pressure-tests alternatives quickly; thrives reframing a decision rather than following the obvious path. Useful in innovation and new-product functions.", executiveFit: false, icon: "🗣️" },
  INTP: { code: "INTP", name: "The Logician", group: "Analyst", decisionStyle: "Analytical model-builder", description: "Prefers to fully understand the mechanics of a problem before deciding; strong in quantitative and modelling roles (e.g. credit risk, treasury analytics).", executiveFit: false, icon: "🔬" },
  ESFJ: { code: "ESFJ", name: "The Consul", group: "Sentinel", decisionStyle: "Consensus-building coordinator", description: "Decides by building buy-in across stakeholders and maintaining team harmony; effective in client-relationship and branch-operations leadership.", executiveFit: false, icon: "🤝" },
  ISFJ: { code: "ISFJ", name: "The Defender", group: "Sentinel", decisionStyle: "Careful service-oriented steward", description: "Protects continuity and customer trust, decides cautiously with attention to downstream impact on people; strong in customer service and HR operations.", executiveFit: false, icon: "🛡️" },
  ENFJ: { code: "ENFJ", name: "The Protagonist", group: "Diplomat", decisionStyle: "People-centred visionary", description: "Decides with an eye on team development and culture; effective leading change-management and talent-development initiatives.", executiveFit: false, icon: "🌟" },
  INFJ: { code: "INFJ", name: "The Advocate", group: "Diplomat", decisionStyle: "Principled long-term idealist", description: "Weighs decisions against values and long-term mission; a fit for ESG, corporate governance, and CSR-adjacent leadership.", executiveFit: false, icon: "💡" },
  ENFP: { code: "ENFP", name: "The Campaigner", group: "Diplomat", decisionStyle: "Enthusiastic possibility-driven connector", description: "Decides by exploring possibilities and rallying people; suited to marketing, partnerships, and business development leadership.", executiveFit: false, icon: "🎉" },
  INFP: { code: "INFP", name: "The Mediator", group: "Diplomat", decisionStyle: "Values-driven reflective idealist", description: "Deliberates carefully to stay aligned with personal and organisational values; fits roles balancing ethics with commercial pressure.", executiveFit: false, icon: "🕊️" },
  ESTP: { code: "ESTP", name: "The Entrepreneur", group: "Explorer", decisionStyle: "Fast pragmatic risk-taker", description: "Decides quickly from real-time information and is comfortable with calculated risk; suited to trading-floor or frontline sales leadership.", executiveFit: false, icon: "⚡" },
  ISTP: { code: "ISTP", name: "The Virtuoso", group: "Explorer", decisionStyle: "Hands-on troubleshooter", description: "Decides by direct problem-solving rather than theory; a fit for technical operations and IT infrastructure leadership.", executiveFit: false, icon: "🔧" },
  ESFP: { code: "ESFP", name: "The Entertainer", group: "Explorer", decisionStyle: "Energetic in-the-moment responder", description: "Decides pragmatically based on immediate feedback from people; effective in front-office and client-experience roles.", executiveFit: false, icon: "🎭" },
  ISFP: { code: "ISFP", name: "The Adventurer", group: "Explorer", decisionStyle: "Quiet adaptive pragmatist", description: "Decides flexibly, case by case, preferring to adapt over enforcing rigid process; fits specialist advisory roles.", executiveFit: false, icon: "🎨" },
};

export function getArchetype(code: MbtiCode): Archetype {
  return archetypeRules[code];
}

export function buildResult(answers: Trait[]): TestResult {
  const scores = scoreAnswers(answers);
  const mbtiType = typeFromScores(scores);
  const archetype = getArchetype(mbtiType);
  return { scores, mbtiType, archetype, completedAt: new Date().toISOString() };
}

// Convenience: percentage split per dichotomy, used for result page bars.
export function dichotomyPercents(s: Scores) {
  const pct = (a: number, b: number) => {
    const total = a + b || 1;
    return Math.round((a / total) * 100);
  };
  return {
    EI: { leftPct: pct(s.E, s.I), leftLabel: "E", rightLabel: "I" },
    SN: { leftPct: pct(s.S, s.N), leftLabel: "S", rightLabel: "N" },
    TF: { leftPct: pct(s.T, s.F), leftLabel: "T", rightLabel: "F" },
    JP: { leftPct: pct(s.J, s.P), leftLabel: "J", rightLabel: "P" },
  };
}
