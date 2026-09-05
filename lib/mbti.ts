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
    decisionStyleDetail:
      "Moves quickly from analysis to action, setting an ambitious direction and expecting the team to execute against it without delay.",
    description:
      "Sets a clear direction fast, mobilises teams around bold targets, and is comfortable making high-stakes calls under uncertainty. In banking, well suited to leading turnarounds, M&A integration, or aggressive growth mandates.",
    executiveFit: true,
    icon: "/mbti-icons/ENTJ.svg",
  },
  ESTJ: {
    code: "ESTJ", name: "The Executive", group: "Sentinel",
    decisionStyle: "Structured operational commander",
    decisionStyleDetail:
      "Leans on established process and clear accountability, weighing options against policy and past results before committing.",
    description:
      "Runs decisions through policy, precedent, and measurable process. Reliable for enforcing controls, standardising operations, and delivering on committed targets — a strong fit for COO-track and branch-network leadership.",
    executiveFit: true,
    icon: "/mbti-icons/ESTJ.svg",
  },
  INTJ: {
    code: "INTJ", name: "The Architect", group: "Analyst",
    decisionStyle: "Long-horizon systems planner",
    decisionStyleDetail:
      "Steps back to model how a decision plays out over years, favouring a well-reasoned plan over a fast reaction.",
    description:
      "Builds decisions from long-range models and systemic risk analysis before committing. Strong fit for strategy, risk modelling, and enterprise technology leadership where a multi-year view matters more than speed.",
    executiveFit: true,
    icon: "/mbti-icons/INTJ.svg",
  },
  ISTJ: {
    code: "ISTJ", name: "The Logistician", group: "Sentinel",
    decisionStyle: "Methodical compliance-first executor",
    decisionStyleDetail:
      "Cross-checks every option against rules, precedent, and risk before committing, and rarely deviates once a plan is set.",
    description:
      "Decides conservatively, verifies against rules and history, and values consistency over improvisation. A natural fit for risk, compliance, audit, and back-office operations leadership in a regulated bank.",
    executiveFit: true,
    icon: "/mbti-icons/ISTJ.svg",
  },

  ENTP: { code: "ENTP", name: "The Debater", group: "Analyst", decisionStyle: "Rapid opportunistic strategist", decisionStyleDetail: "Enjoys debating multiple angles at once and will happily overturn the obvious choice if a better one surfaces mid-conversation.", description: "Generates and pressure-tests alternatives quickly; thrives reframing a decision rather than following the obvious path. Useful in innovation and new-product functions.", executiveFit: false, icon: "/mbti-icons/ENTP.svg" },
  INTP: { code: "INTP", name: "The Logician", group: "Analyst", decisionStyle: "Analytical model-builder", decisionStyleDetail: "Wants to understand the underlying logic of a problem fully before offering a recommendation, even if that takes longer.", description: "Prefers to fully understand the mechanics of a problem before deciding; strong in quantitative and modelling roles (e.g. credit risk, treasury analytics).", executiveFit: false, icon: "/mbti-icons/INTP.svg" },
  ESFJ: { code: "ESFJ", name: "The Consul", group: "Sentinel", decisionStyle: "Consensus-building coordinator", decisionStyleDetail: "Checks in with stakeholders first, shaping a decision that keeps the team aligned and morale intact.", description: "Decides by building buy-in across stakeholders and maintaining team harmony; effective in client-relationship and branch-operations leadership.", executiveFit: false, icon: "/mbti-icons/ESFJ.svg" },
  ISFJ: { code: "ISFJ", name: "The Defender", group: "Sentinel", decisionStyle: "Careful service-oriented steward", decisionStyleDetail: "Weighs how a choice affects the people and customers involved, and prefers the safer, well-tested option.", description: "Protects continuity and customer trust, decides cautiously with attention to downstream impact on people; strong in customer service and HR operations.", executiveFit: false, icon: "/mbti-icons/ISFJ.svg" },
  ENFJ: { code: "ENFJ", name: "The Protagonist", group: "Diplomat", decisionStyle: "People-centred visionary", decisionStyleDetail: "Frames decisions around what will help the team grow, leading through influence and vision rather than authority alone.", description: "Decides with an eye on team development and culture; effective leading change-management and talent-development initiatives.", executiveFit: false, icon: "/mbti-icons/ENFJ.svg" },
  INFJ: { code: "INFJ", name: "The Advocate", group: "Diplomat", decisionStyle: "Principled long-term idealist", decisionStyleDetail: "Tests each option against personal and organisational values, preferring the choice that holds up over many years.", description: "Weighs decisions against values and long-term mission; a fit for ESG, corporate governance, and CSR-adjacent leadership.", executiveFit: false, icon: "/mbti-icons/INFJ.svg" },
  ENFP: { code: "ENFP", name: "The Campaigner", group: "Diplomat", decisionStyle: "Enthusiastic possibility-driven connector", decisionStyleDetail: "Generates many options quickly and rallies others around the most exciting one before narrowing down.", description: "Decides by exploring possibilities and rallying people; suited to marketing, partnerships, and business development leadership.", executiveFit: false, icon: "/mbti-icons/ENFP.svg" },
  INFP: { code: "INFP", name: "The Mediator", group: "Diplomat", decisionStyle: "Values-driven reflective idealist", decisionStyleDetail: "Takes time alone to reflect before committing, making sure the outcome stays true to their principles.", description: "Deliberates carefully to stay aligned with personal and organisational values; fits roles balancing ethics with commercial pressure.", executiveFit: false, icon: "/mbti-icons/INFP.svg" },
  ESTP: { code: "ESTP", name: "The Entrepreneur", group: "Explorer", decisionStyle: "Fast pragmatic risk-taker", decisionStyleDetail: "Reads the room in real time and commits fast, comfortable taking a calculated bet rather than waiting for full certainty.", description: "Decides quickly from real-time information and is comfortable with calculated risk; suited to trading-floor or frontline sales leadership.", executiveFit: false, icon: "/mbti-icons/ESTP.svg" },
  ISTP: { code: "ISTP", name: "The Virtuoso", group: "Explorer", decisionStyle: "Hands-on troubleshooter", decisionStyleDetail: "Prefers to test a fix directly rather than theorise, deciding through trial and hands-on iteration.", description: "Decides by direct problem-solving rather than theory; a fit for technical operations and IT infrastructure leadership.", executiveFit: false, icon: "/mbti-icons/ISTP.svg" },
  ESFP: { code: "ESFP", name: "The Entertainer", group: "Explorer", decisionStyle: "Energetic in-the-moment responder", decisionStyleDetail: "Decides based on immediate, tangible feedback from the people in front of them, adjusting course on the fly.", description: "Decides pragmatically based on immediate feedback from people; effective in front-office and client-experience roles.", executiveFit: false, icon: "/mbti-icons/ESFP.svg" },
  ISFP: { code: "ISFP", name: "The Adventurer", group: "Explorer", decisionStyle: "Quiet adaptive pragmatist", decisionStyleDetail: "Avoids rigid rules, handling each situation on its own terms and adapting the approach as new information comes in.", description: "Decides flexibly, case by case, preferring to adapt over enforcing rigid process; fits specialist advisory roles.", executiveFit: false, icon: "/mbti-icons/ISFP.svg" },
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
