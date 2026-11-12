import { Department, OceanScores, OceanTrait, ProfileCode, User } from "./types";
import {
  EXECUTIVE_FIT_MIN, TRAIT_META, TRAIT_ORDER, getProfile, isExecutiveFit, leadershipIndex,
  leadershipIndexFromPercentiles, percentiles, profileFromPercentiles, profileRules, traitBand,
} from "./ocean";
import { DepartmentStats, WORKFORCE_STATS } from "./workforceStats";

// =========================================================================
// DECISION SUPPORT CHATBOT (DSS interface 3)
// -------------------------------------------------------------------------
// A rule-based advisor for the HR page. Each question is matched to one
// intent, entities (department, profile, trait, 9-Box cell, employee, numbers)
// are pulled from the text, and the answer is built from the same KPI alert
// rules and IF-THEN rules as the report. There is no language model, so every
// answer can be traced to a rule.
//
// Two data sources, always labelled in the answer:
//   - App: employees registered in this prototype, limited to the viewer's scope
//   - Workforce dataset: data/employees_ocean_hr.csv (17,414 employees), via
//     lib/workforceStats.ts. Its OCEAN columns are a synthetic link.
// =========================================================================

export type Status = "green" | "yellow" | "red";

export interface Alert {
  status: Status;
  kpi: string;
  detail: string;
}

export interface BotReply {
  intent: IntentId;
  text: string;
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
  alerts?: Alert[];
  actions?: string[];
  note?: string;
  suggestions?: string[];
}

export interface BotContext {
  viewer: User;
  employees: User[]; // non-reviewer users the viewer may see
  scope: Department[] | "all";
}

export type IntentId =
  | "help" | "scenario" | "employee" | "explain" | "pending" | "shortlist"
  | "nine_box" | "recommend" | "profiles" | "kpi" | "department" | "fallback";

// Intent catalogue, in matching order. Shown by the help intent and in the README.
export const INTENTS: { id: IntentId; label: string; example: string }[] = [
  { id: "kpi", label: "KPI status with Red, Yellow and Green alerts", example: "Show the KPI overview" },
  { id: "recommend", label: "Recommended actions from the alert rules", example: "What should we do first?" },
  { id: "scenario", label: "Advice for a scenario you describe", example: "Low performance band is 52% and stars are 9%" },
  { id: "department", label: "Department snapshot or comparison", example: "Stats for IT Support" },
  { id: "profiles", label: "Decision profile distribution", example: "Profile distribution in Retail Banking" },
  { id: "employee", label: "One employee's profile and advice", example: "Tell me about Aran" },
  { id: "shortlist", label: "Executive-fit shortlist (rules L1, X1)", example: "Who should be on the succession shortlist?" },
  { id: "nine_box", label: "9-Box Talent Grid counts and actions", example: "How many Enigmas are there?" },
  { id: "pending", label: "Employees who have not taken the test", example: "Who hasn't completed the assessment?" },
  { id: "explain", label: "How a rule or KPI works", example: "How is the Leadership Index calculated?" },
];

// ---------- knowledge used by the rules ----------
const PROFILE_ORDER: ProfileCode[] = ["E", "C", "S", "O", "A", "B"];

const NINE_BOX: Record<number, { label: string; perf: string; pot: string; action: string }> = {
  1: { label: "Enigma", perf: "Low", pot: "High", action: "Find the barrier, coach, consider a better-fit role" },
  2: { label: "Growth Employee", perf: "Medium", pot: "High", action: "Stretch assignment and development plan" },
  3: { label: "Star", perf: "High", pot: "High", action: "Succession pool, retain and prepare for promotion" },
  4: { label: "Dilemma", perf: "Low", pot: "Medium", action: "Performance plan with close coaching" },
  5: { label: "Core Player", perf: "Medium", pot: "Medium", action: "Keep engaged, targeted skill training" },
  6: { label: "High Performer", perf: "High", pot: "Medium", action: "Reward and widen scope to build potential" },
  7: { label: "Underperformer", perf: "Low", pot: "Low", action: "Performance plan, consider role change" },
  8: { label: "Average Performer", perf: "Medium", pot: "Low", action: "Clarify goals, keep in current role" },
  9: { label: "Solid Performer", perf: "High", pot: "Low", action: "Recognize expertise, keep as specialist" },
};

const KPI_INFO: Record<number, { name: string; rule: string; meaning: string }> = {
  1: { name: "Trait Percentile", rule: "Yellow when a department's mean percentile on a trait is outside 40 to 60", meaning: "Where each person sits on O, C, E, A and N against 592,204 benchmark respondents." },
  2: { name: "Decision Profile Distribution", rule: "Yellow when one profile is over 35% of a team, Red over 50%", meaning: "Share of results in each of the six decision profiles." },
  3: { name: "Executive Fit Rate", rule: "Red when a department falls below 10%", meaning: "Share of results with a Leadership Index of 70 or more." },
  4: { name: "Performance Index", rule: "Yellow when the Low band is over 45% of rated employees, Red over 50%", meaning: "Percentile of 0.5 × rating + 0.4 × KPI flag + 0.1 × award, banded into thirds." },
  5: { name: "Potential Index", rule: "Green when the High band is 33.3% or more, Yellow below, Red below 25%", meaning: "Percentile of a promotion model trained on hr-ana train.csv (AUC 0.714)." },
  6: { name: "9-Box Talent Pipeline", rule: "Yellow when Stars are under 10% of rated employees", meaning: "Share of rated employees in each 9-Box cell, plus the Star and executive-fit shortlist." },
  7: { name: "Assessment Completion Rate", rule: "Yellow below 90%, Red below 70%", meaning: "Share of employees with a completed OCEAN result." },
};

// ---------- entity dictionaries ----------
const DEPT_ALIASES: [Department, RegExp][] = [
  ["Retail Banking", /retail|รีเทล/],
  ["Corporate Banking", /corporate|คอร์ปอเรท/],
  ["Customer Service", /customer service|customer|\bcs\b|บริการลูกค้า/],
  ["Finance & Accounting", /financ|accounting|การเงิน|บัญชี/],
  ["IT Support", /\bit support\b|\bit (department|team|dept)\b|technology team|ไอที/],
  ["Human Resources", /human resources|hr department|hr team|ฝ่ายบุคคล/],
];
const PROFILE_ALIASES: [ProfileCode, RegExp][] = [
  ["E", /mobili[sz]er/], ["C", /steward/], ["S", /steady hand/],
  ["O", /visionar/], ["A", /consensus/], ["B", /balanced|generalist/],
];
const TRAIT_ALIASES: [OceanTrait, RegExp][] = [
  ["O", /openness|\bopen\b/], ["C", /conscientious/], ["E", /extra[vo]ersion|extravert|extrovert/],
  ["A", /agreeable/], ["N", /neurotic|emotional stability|stability/],
];
const CELL_ALIASES: [number, RegExp][] = [
  [1, /enigma/], [2, /growth employee/], [3, /\bstars?\b/], [4, /dilemma/], [5, /core player/],
  [6, /high performer/], [7, /underperformer|under performer/], [8, /average performer/], [9, /solid performer/],
];

// ---------- small helpers ----------
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);
const fmt = (n: number) => n.toLocaleString("en-US");
const first = <T,>(list: [T, RegExp][], q: string) => list.find(([, re]) => re.test(q))?.[0];
const all = <T,>(list: [T, RegExp][], q: string) => list.filter(([, re]) => re.test(q)).map(([v]) => v);
const has = (q: string, re: RegExp) => re.test(q);

function scopeDepartments(ctx: BotContext): Department[] {
  return ctx.scope === "all" ? (Object.keys(WORKFORCE_STATS) as Department[]) : ctx.scope;
}

function inScope(ctx: BotContext, dept: Department) {
  return ctx.scope === "all" || ctx.scope.includes(dept);
}

function sumStats(depts: Department[]): DepartmentStats {
  const zero = (keys: string[]) => Object.fromEntries(keys.map((k) => [k, 0])) as any;
  const out: DepartmentStats = {
    employees: 0, rated: 0, kpiMet: 0, meanTrainingScore: 0, meanPercentile: zero(TRAIT_ORDER),
    profiles: zero(PROFILE_ORDER), executiveFit: 0, performanceBand: zero(["Low", "Medium", "High"]),
    potentialBand: zero(["Low", "Medium", "High"]), nineBox: zero(["1", "2", "3", "4", "5", "6", "7", "8", "9"]),
    x1StarExecutiveFit: 0, x2FitLowPerformance: 0, x3HighPotentialBalanced: 0,
  };
  depts.forEach((d) => {
    const s = WORKFORCE_STATS[d];
    if (!s) return;
    out.employees += s.employees; out.rated += s.rated; out.kpiMet += s.kpiMet; out.executiveFit += s.executiveFit;
    out.meanTrainingScore += s.meanTrainingScore * s.employees;
    TRAIT_ORDER.forEach((t) => (out.meanPercentile[t] += s.meanPercentile[t] * s.employees));
    PROFILE_ORDER.forEach((p) => (out.profiles[p] += s.profiles[p]));
    (["Low", "Medium", "High"] as const).forEach((b) => {
      out.performanceBand[b] += s.performanceBand[b];
      out.potentialBand[b] += s.potentialBand[b];
    });
    Object.keys(s.nineBox).forEach((k) => (out.nineBox[k] += s.nineBox[k]));
    out.x1StarExecutiveFit += s.x1StarExecutiveFit; out.x2FitLowPerformance += s.x2FitLowPerformance;
    out.x3HighPotentialBalanced += s.x3HighPotentialBalanced;
  });
  out.meanTrainingScore = Math.round((out.meanTrainingScore / (out.employees || 1)) * 10) / 10;
  TRAIT_ORDER.forEach((t) => (out.meanPercentile[t] = Math.round((out.meanPercentile[t] / (out.employees || 1)) * 10) / 10));
  return out;
}

// ---------- KPI alert rules (report section 3.5) ----------
const kpi2 = (share: number): Status => (share > 50 ? "red" : share > 35 ? "yellow" : "green");
const kpi3 = (rate: number): Status => (rate < 10 ? "red" : "green");
const kpi4 = (lowShare: number): Status => (lowShare > 50 ? "red" : lowShare > 45 ? "yellow" : "green");
const kpi5 = (highShare: number): Status => (highShare < 25 ? "red" : highShare < 33.3 ? "yellow" : "green");
const kpi6 = (starShare: number): Status => (starShare < 10 ? "yellow" : "green");
const kpi7 = (rate: number): Status => (rate < 70 ? "red" : rate < 90 ? "yellow" : "green");

function topProfile(counts: Record<ProfileCode, number>) {
  const total = PROFILE_ORDER.reduce((a, p) => a + counts[p], 0);
  const best = PROFILE_ORDER.reduce((a, p) => (counts[p] > counts[a] ? p : a), PROFILE_ORDER[0]);
  return { code: best, share: pct(counts[best], total), total };
}

function workforceAlerts(label: string, s: DepartmentStats): Alert[] {
  const top = topProfile(s.profiles);
  const fit = pct(s.executiveFit, s.employees);
  const low = pct(s.performanceBand.Low, s.rated);
  const high = pct(s.potentialBand.High, s.employees);
  const star = pct(s.nineBox["3"], s.rated);
  return [
    { status: kpi2(top.share), kpi: "KPI 2", detail: `${label}: largest profile is ${profileRules[top.code].name} at ${top.share}% (alert above 35%)` },
    { status: kpi3(fit), kpi: "KPI 3", detail: `${label}: executive fit ${fit}% (${fmt(s.executiveFit)} of ${fmt(s.employees)}, alert below 10%)` },
    { status: kpi4(low), kpi: "KPI 4", detail: `${label}: Low performance band ${low}% of rated (alert above 45%)` },
    { status: kpi5(high), kpi: "KPI 5", detail: `${label}: High potential band ${high}% (target 33.3% or more)` },
    { status: kpi6(star), kpi: "KPI 6", detail: `${label}: Stars ${star}% of rated (alert below 10%)` },
  ];
}

interface AppSummary {
  total: number; completed: User[]; pending: User[]; fit: User[];
  profiles: Record<ProfileCode, number>;
}

function appSummary(employees: User[]): AppSummary {
  const completed = employees.filter((e) => e.result);
  const profiles = Object.fromEntries(PROFILE_ORDER.map((p) => [p, 0])) as Record<ProfileCode, number>;
  completed.forEach((e) => profiles[getProfile(e.result!.scores).code]++);
  return {
    total: employees.length, completed, pending: employees.filter((e) => !e.result),
    fit: completed.filter((e) => isExecutiveFit(e.result!.scores)), profiles,
  };
}

// Shares of one or two results are noise, so KPI 2 and KPI 3 wait for this many.
const MIN_RESULTS = 5;

function appAlerts(a: AppSummary): Alert[] {
  const out: Alert[] = [];
  if (!a.total) return out;
  const completion = pct(a.completed.length, a.total);
  out.push({ status: kpi7(completion), kpi: "KPI 7", detail: `App: ${a.completed.length} of ${a.total} employees assessed (${completion}%, target 95%)` });
  if (a.completed.length >= MIN_RESULTS) {
    const fit = pct(a.fit.length, a.completed.length);
    out.push({ status: kpi3(fit), kpi: "KPI 3", detail: `App: executive fit ${fit}% (${a.fit.length} of ${a.completed.length} results)` });
    const top = topProfile(a.profiles);
    out.push({ status: kpi2(top.share), kpi: "KPI 2", detail: `App: largest profile is ${profileRules[top.code].name} at ${top.share}% of ${top.total} results` });
  }
  return out;
}

// Rule-based actions for every non-green alert, most severe first.
function actionsFor(alerts: Alert[], s: DepartmentStats | null, a: AppSummary | null): string[] {
  const order = { red: 0, yellow: 1, green: 2 };
  const actions: string[] = [];
  [...alerts].sort((x, y) => order[x.status] - order[y.status]).forEach((al) => {
    if (al.status === "green") return;
    const where = al.detail.split(":")[0];
    switch (al.kpi) {
      case "KPI 7":
        actions.push(`Send reminders to the ${a?.pending.length ?? "pending"} employee(s) without a result (Send reminder on this page).`);
        break;
      case "KPI 3":
        actions.push(`${where}: too few executive-fit profiles. Widen the succession search to other departments and start leadership development for the strongest Growth Employees.`);
        break;
      case "KPI 2":
        actions.push(`${where}: one decision style dominates. Balance it in the next hires and promotions, and pair leaders with a different profile on key decisions.`);
        break;
      case "KPI 4":
        actions.push(`${where}: start a performance review. Put ${s ? fmt(s.nineBox["7"]) + " Underperformers and " + fmt(s.nineBox["4"]) + " Dilemmas" : "Underperformers and Dilemmas"} on performance plans with close coaching.`);
        break;
      case "KPI 5":
        actions.push(`${where}: the potential pipeline is thin. Give High Performers and Core Players stretch assignments and add training.`);
        break;
      case "KPI 6":
        actions.push(`${where}: too few Stars. Fast-track ${s ? fmt(s.nineBox["2"]) + " Growth Employees" : "Growth Employees"} with stretch assignments, and widen the scope of High Performers.`);
        break;
    }
  });
  return actions;
}

// ---------- intent detection ----------
function detectIntent(q: string, raw: string, ctx: BotContext): IntentId {
  const words = q.trim().split(/\s+/).length;
  if (/^(hi|hello|hey|help|menu|start|สวัสดี|ช่วยด้วย|ทำอะไรได้)/.test(q) && words <= 6) return "help";
  if (/what can you do|how do i use|ทำอะไรได้บ้าง/.test(q)) return "help";
  if (parseTraitScenario(raw) || parseMetricScenario(q).length || /leadership index (of|is|=)?\s*\d/.test(q)) return "scenario";
  if (findEmployee(q, ctx)) return "employee";
  if (/what is|what's|what are|explain|how is|how does|how do|meaning|define|คืออะไร|อธิบาย|คำนวณ/.test(q) &&
      /leadership index|profile|kpi|9-?box|nine.?box|band|percentile|executive fit|rule|enigma|star|steward|mobili|visionar|steady|consensus|balanced|openness|conscientious|extraver|agreeable|neurotic/.test(q)) return "explain";
  if (/pending|not (yet )?(assessed|completed|taken|done)|haven'?t|hasn'?t|has not|have not|incomplete|reminder|ยังไม่|ค้าง/.test(q)) return "pending";
  if (/shortlist|succession|candidate|promot|successor|ผู้สืบทอด|เลื่อนตำแหน่ง/.test(q) ||
      (/executive|leader|ผู้บริหาร/.test(q) && !/rate|%|percent|kpi/.test(q))) return "shortlist";
  if (/9-?box|nine.?box|talent grid|enigma|growth employee|\bstars?\b|dilemma|core player|high performer|underperform|average performer|solid performer/.test(q)) return "nine_box";
  if (/recommend|suggest|should|action|advice|advise|priorit|focus|next step|what to do|แนะนำ|ควร|ทำอะไรดี/.test(q)) return "recommend";
  if (/profile|style|distribution|mobili|steward|steady hand|visionar|consensus|balanced|generalist|trait|สไตล์|โปรไฟล์/.test(q)) return "profiles";
  if (/kpi|metric|rate|completion|overview|dashboard|summary|status|alert|health|ภาพรวม|สถิติ|ตัวชี้วัด/.test(q)) return "kpi";
  if (first(DEPT_ALIASES, q) || /department|compare|แผนก|เทียบ/.test(q)) return "department";
  return "fallback";
}

function findEmployee(q: string, ctx: BotContext): User | undefined {
  return ctx.employees.find((e) =>
    e.name.toLowerCase().split(/\s+/).some((part) => part.length >= 3 && new RegExp(`\\b${part}\\b`).test(q)));
}

// "E 80, C 45, O 60, A 30, N 20" or "extraversion 80 ..." -> percentiles
function parseTraitScenario(raw: string): Partial<OceanScores> | null {
  const found: Partial<OceanScores> = {};
  const long = /(openness|conscientiousness|extraversion|extroversion|agreeableness|neuroticism)\s*(?:=|:|is|at|of)?\s*(\d{1,3})/gi;
  const short = /\b([OCEAN])\s*(?:=|:)?\s*(\d{1,3})\b(?!\s*%)/g;
  const map: Record<string, OceanTrait> = { openness: "O", conscientiousness: "C", extraversion: "E", extroversion: "E", agreeableness: "A", neuroticism: "N" };
  let m: RegExpExecArray | null;
  while ((m = long.exec(raw))) found[map[m[1].toLowerCase()]] = Math.min(100, +m[2]);
  while ((m = short.exec(raw))) found[m[1] as OceanTrait] = Math.min(100, +m[2]);
  return Object.keys(found).length >= 3 ? found : null;
}

type Metric = "completion" | "executive_fit" | "low_band" | "stars" | "high_potential" | "profile_share";
const METRICS: [Metric, RegExp][] = [
  ["completion", /completion|completed|assessed|response rate|ทำแบบทดสอบ/],
  ["executive_fit", /executive.?fit|exec fit/],
  ["low_band", /low (performance )?band|low performers?|low performance|underperform/],
  ["stars", /\bstars?\b/],
  ["high_potential", /high potential|potential band|high band/],
  ["profile_share", /one profile|single profile|same profile|profile share|mobili[sz]er|steward|steady hand|visionar|consensus|balanced/],
];

// Splits the text into clauses and pairs each metric with the percentage in the same clause.
function parseMetricScenario(q: string): { metric: Metric; value: number }[] {
  const out: { metric: Metric; value: number }[] = [];
  q.split(/,|;|\band\b|\bbut\b|และ|แต่|\.(?!\d)/).forEach((clause) => {
    const num = clause.match(/(\d+(?:\.\d+)?)\s*(%|percent|เปอร์เซ็นต์)/);
    if (!num) return;
    const metric = first(METRICS, clause);
    if (metric && !out.some((o) => o.metric === metric)) out.push({ metric, value: +num[1] });
  });
  return out;
}

// ---------- intent handlers ----------
function help(ctx: BotContext): BotReply {
  return {
    intent: "help",
    text: `Hi ${ctx.viewer.name.split(" ")[0]}, I answer questions about OCEAN results, KPIs and talent decisions for ${ctx.scope === "all" ? "all departments" : ctx.scope.join(", ")}. Every answer comes from the KPI alert rules and decision rules in the report. You can ask about:`,
    bullets: INTENTS.map((i) => `${i.label}, for example "${i.example}"`),
    suggestions: ["Show the KPI overview", "What should we do first?", "Who should be on the succession shortlist?"],
  };
}

function kpiOverview(ctx: BotContext, q: string): BotReply {
  const dept = first(DEPT_ALIASES, q);
  if (dept && !inScope(ctx, dept)) return outOfScope(ctx, dept);
  const depts = dept ? [dept] : scopeDepartments(ctx);
  const label = dept ?? (ctx.scope === "all" ? "All departments" : "Your scope");
  const s = sumStats(depts);
  const app = appSummary(dept ? ctx.employees.filter((e) => e.department === dept) : ctx.employees);
  const alerts = [...appAlerts(app), ...workforceAlerts(label, s)];
  const red = alerts.filter((a) => a.status === "red").length;
  const yellow = alerts.filter((a) => a.status === "yellow").length;
  return {
    intent: "kpi",
    text: `KPI status for ${label}: ${red} red, ${yellow} yellow and ${alerts.length - red - yellow} green.`,
    alerts,
    note: `App rows use the ${app.total} employees registered in this prototype${app.completed.length < MIN_RESULTS ? ` (KPI 2 and KPI 3 need ${MIN_RESULTS} results, ${app.completed.length} so far)` : ""}. Workforce rows use ${fmt(s.employees)} employees from employees_ocean_hr.csv.`,
    suggestions: ["What should we do first?", dept ? `Profile distribution in ${dept}` : "Compare departments", "How many Stars are there?"],
  };
}

function recommend(ctx: BotContext, q: string): BotReply {
  const dept = first(DEPT_ALIASES, q);
  if (dept && !inScope(ctx, dept)) return outOfScope(ctx, dept);
  const depts = dept ? [dept] : scopeDepartments(ctx);
  const app = appSummary(dept ? ctx.employees.filter((e) => e.department === dept) : ctx.employees);
  const alerts: Alert[] = [...appAlerts(app)];
  depts.forEach((d) => alerts.push(...workforceAlerts(d, WORKFORCE_STATS[d])));
  const s = sumStats(depts);
  const order = { red: 0, yellow: 1, green: 2 };
  const flagged = alerts.filter((a) => a.status !== "green").sort((x, y) => order[x.status] - order[y.status]);
  const actions = [
    ...flagged.flatMap((al) => actionsFor([al], depts.length === 1 ? s : WORKFORCE_STATS[al.detail.split(":")[0]] ?? null, app)),
    `Review the ${fmt(s.x1StarExecutiveFit)} Stars who are also executive fit for the succession pool (rule X1).`,
    `Coach the ${fmt(s.x2FitLowPerformance)} executive-fit employees whose performance is Low before any placement (rule X2).`,
    `Offer rotational assignments to the ${fmt(s.x3HighPotentialBalanced)} high-potential Balanced Generalists (rule X3).`,
  ];
  return {
    intent: "recommend",
    text: flagged.length
      ? `${flagged.length} KPI alert(s) need action${dept ? ` in ${dept}` : ""}. In order of severity:`
      : `No KPI is in alert${dept ? ` for ${dept}` : ""}. Standing actions from the talent rules:`,
    alerts: flagged,
    actions,
    suggestions: ["Who should be on the succession shortlist?", "How many Enigmas are there?", "Who hasn't completed the assessment?"],
  };
}

function scenario(raw: string, q: string): BotReply {
  const traits = parseTraitScenario(raw);
  if (traits) {
    const p = Object.fromEntries(TRAIT_ORDER.map((t) => [t, traits[t] ?? 50])) as OceanScores;
    const missing = TRAIT_ORDER.filter((t) => traits[t] === undefined);
    const prof = profileFromPercentiles(p);
    const li = leadershipIndexFromPercentiles(p);
    const fit = li >= EXECUTIVE_FIT_MIN;
    return {
      intent: "scenario",
      text: `With these percentiles the person is ${prof.name} (${prof.decisionStyle.toLowerCase()}), with a Leadership Index of ${li}, so executive fit is ${fit ? "Yes" : "No"}.`,
      table: { headers: ["Trait", "Percentile", "Band"], rows: TRAIT_ORDER.map((t) => [TRAIT_META[t].name, `${p[t]}${traits[t] === undefined ? " (assumed)" : ""}`, traitBand(p[t])]) },
      bullets: [
        `Rule applied: ${prof.code === "B" ? "R6, no trait reaches the 60th percentile" : `strongest of E, C, S (100 − N), O, A is at or above 60, so ${prof.name}`}.`,
        `Rule ${fit ? "L1" : "L2"}: Leadership Index ${li} is ${fit ? "at or above" : "below"} ${EXECUTIVE_FIT_MIN}.`,
        `Fit in a bank: ${prof.description}`,
      ],
      actions: [fit
        ? "Add to the executive-track review and check the 9-Box cell before placement (rules X1 and X2)."
        : `Develop within the current track, in ${prof.code === "B" ? "rotational and generalist roles" : "roles that suit a " + prof.decisionStyle.toLowerCase()}.`],
      note: missing.length ? `${missing.map((t) => TRAIT_META[t].name).join(", ")} not given, assumed at the 50th percentile.` : undefined,
      suggestions: ["How is the Leadership Index calculated?", "What is a Steward?"],
    };
  }
  const liMatch = q.match(/leadership index (?:of|is|=)?\s*(\d{1,3}(?:\.\d)?)/);
  const metrics = parseMetricScenario(q);
  const alerts: Alert[] = [];
  const actions: string[] = [];
  metrics.forEach(({ metric, value }) => {
    switch (metric) {
      case "completion": {
        const st = kpi7(value);
        alerts.push({ status: st, kpi: "KPI 7", detail: `Completion ${value}% (Yellow below 90%, Red below 70%)` });
        if (st !== "green") actions.push("Send reminders to everyone without a result and follow up again after one week.");
        break;
      }
      case "executive_fit": {
        const st = kpi3(value);
        alerts.push({ status: st, kpi: "KPI 3", detail: `Executive fit ${value}% (Red below 10%)` });
        if (st !== "green") actions.push("Widen the succession search to other departments and start leadership development.");
        break;
      }
      case "low_band": {
        const st = kpi4(value);
        alerts.push({ status: st, kpi: "KPI 4", detail: `Low performance band ${value}% (Yellow above 45%, Red above 50%)` });
        if (st !== "green") actions.push("Start a performance review: performance plans with close coaching for Underperformers and Dilemmas.");
        break;
      }
      case "stars": {
        const st = kpi6(value);
        alerts.push({ status: st, kpi: "KPI 6", detail: `Stars ${value}% of rated employees (Yellow below 10%)` });
        if (st !== "green") actions.push("Fast-track Growth Employees with stretch assignments and widen the scope of High Performers.");
        break;
      }
      case "high_potential": {
        const st = kpi5(value);
        alerts.push({ status: st, kpi: "KPI 5", detail: `High potential band ${value}% (Green from 33.3%, Red below 25%)` });
        if (st !== "green") actions.push("Give High Performers and Core Players stretch assignments to build the potential pipeline.");
        break;
      }
      case "profile_share": {
        const st = kpi2(value);
        alerts.push({ status: st, kpi: "KPI 2", detail: `One profile at ${value}% of the team (Yellow above 35%, Red above 50%)` });
        if (st !== "green") actions.push("Balance decision styles in the next hires and promotions, and pair leaders with a different profile on key decisions.");
        break;
      }
    }
  });
  if (liMatch) {
    const li = +liMatch[1];
    const cell = first(CELL_ALIASES, q);
    const fit = li >= EXECUTIVE_FIT_MIN;
    alerts.push({ status: fit ? "green" : "yellow", kpi: fit ? "Rule L1" : "Rule L2", detail: `Leadership Index ${li}: executive fit ${fit ? "Yes" : "No"}` });
    if (fit && cell === 3) actions.push("Rule X1: Star and executive fit. Shortlist for upper-management succession.");
    else if (fit && cell && NINE_BOX[cell].perf === "Low") actions.push(`Rule X2: executive fit but ${NINE_BOX[cell].label} (Low performance). Coach before any placement.`);
    else if (fit) actions.push("Add to the executive-track review and check the 9-Box cell before placement.");
    if (cell) actions.push(`9-Box ${NINE_BOX[cell].label}: ${NINE_BOX[cell].action}.`);
  }
  return {
    intent: "scenario",
    text: alerts.length ? "Here is how the rules read your scenario:" : "I could not match a metric in that scenario.",
    alerts,
    actions: actions.length ? actions : ["All values are within target. Keep monitoring at the next review."],
    suggestions: ["Low performance band is 52% and stars are 9%", "Leadership index 74 and the employee is a Star", "E 80, C 55, O 60, A 40, N 30"],
  };
}

function employeeAnswer(e: User): BotReply {
  if (!e.result) {
    return {
      intent: "employee",
      text: `${e.name} (${e.department}) has not completed the OCEAN assessment yet.`,
      actions: [`Send ${e.name.split(" ")[0]} a reminder from the table on this page (KPI 7).`],
      suggestions: ["Who hasn't completed the assessment?"],
    };
  }
  const s = e.result.scores;
  const p = percentiles(s);
  const prof = getProfile(s);
  const li = leadershipIndex(s);
  const fit = isExecutiveFit(s);
  return {
    intent: "employee",
    text: `${e.name} (${e.department}) is ${prof.name}: ${prof.decisionStyle.toLowerCase()}. Leadership Index ${li}, executive fit ${fit ? "Yes" : "No"}.`,
    table: { headers: ["Trait", "Raw", "Percentile", "Band"], rows: TRAIT_ORDER.map((t) => [TRAIT_META[t].name, String(s[t]), String(p[t]), traitBand(p[t])]) },
    bullets: [prof.decisionStyleDetail, `Fit in a bank: ${prof.description}`],
    actions: [fit
      ? "Rule L1: executive fit. Add to the succession review and confirm performance in the 9-Box before placement (X1, X2)."
      : "Rule L2: not executive fit. Develop in a role that matches this decision style."],
    suggestions: ["Who should be on the succession shortlist?", `Profile distribution in ${e.department}`],
  };
}

function explain(q: string): BotReply {
  const kpiNo = q.match(/kpi\s*(\d)/);
  if (kpiNo && KPI_INFO[+kpiNo[1]]) {
    const k = KPI_INFO[+kpiNo[1]];
    return { intent: "explain", text: `KPI ${kpiNo[1]}, ${k.name}: ${k.meaning}`, bullets: [`Alert rule: ${k.rule}.`], suggestions: ["Show the KPI overview"] };
  }
  if (/leadership index|executive fit/.test(q)) {
    return {
      intent: "explain",
      text: "The Leadership Index weights each trait percentile by its correlation with leadership (Judge et al., 2002).",
      bullets: [
        "LI = (0.31 E + 0.28 C + 0.24 (100 − N) + 0.24 O + 0.08 A) ÷ 1.15",
        "Neuroticism is inverted, so emotional stability counts toward leadership.",
        `Rule L1: LI of ${EXECUTIVE_FIT_MIN} or more means executive fit (about the top 15% of employees).`,
      ],
      suggestions: ["Leadership index 74 and the employee is a Star", "Who should be on the succession shortlist?"],
    };
  }
  const prof = first(PROFILE_ALIASES, q);
  if (prof) {
    const r = profileRules[prof];
    return { intent: "explain", text: `${r.name}: ${r.decisionStyle}.`, bullets: [r.decisionStyleDetail, r.description], suggestions: [`Profile distribution`] };
  }
  const cell = first(CELL_ALIASES, q);
  if (cell || /9-?box|nine.?box/.test(q)) {
    return {
      intent: "explain",
      text: cell
        ? `${NINE_BOX[cell].label} is box ${cell}: ${NINE_BOX[cell].perf} performance and ${NINE_BOX[cell].pot} potential. Action: ${NINE_BOX[cell].action}.`
        : "The 9-Box Talent Grid crosses a performance axis (rating 50%, KPI flag 40%, award 10%) with a potential axis (promotion model). Both are banded into thirds.",
      table: cell ? undefined : { headers: ["Box", "Performance", "Potential", "Label"], rows: Object.entries(NINE_BOX).map(([k, v]) => [k, v.perf, v.pot, v.label]) },
      suggestions: ["How many Stars are there?"],
    };
  }
  const trait = first(TRAIT_ALIASES, q);
  if (trait) {
    const m = TRAIT_META[trait];
    return { intent: "explain", text: `${m.name}. High: ${m.high}. Low: ${m.low}.`, bullets: ["Scores are percentiles against 592,204 IPIP respondents. Below 30 is Low, 30 to 69 Moderate, 70 or more High."] };
  }
  return {
    intent: "explain",
    text: "Decision profiles come from the strongest trait at or above the 60th percentile.",
    bullets: [
      "Emotional stability S = 100 − Neuroticism percentile.",
      "E → The Mobiliser, C → The Steward, S → The Steady Hand, O → The Visionary, A → The Consensus Builder.",
      "No trait at 60 or more → The Balanced Generalist. Ties go to the earlier trait in the order E, C, S, O, A.",
    ],
    suggestions: ["How is the Leadership Index calculated?", "What is KPI 4?"],
  };
}

function pending(ctx: BotContext, q: string): BotReply {
  const dept = first(DEPT_ALIASES, q);
  if (dept && !inScope(ctx, dept)) return outOfScope(ctx, dept);
  const list = ctx.employees.filter((e) => !e.result && (!dept || e.department === dept));
  const total = ctx.employees.filter((e) => !dept || e.department === dept).length;
  const rate = pct(total - list.length, total);
  return {
    intent: "pending",
    text: list.length
      ? `${list.length} employee(s) have not completed the assessment. Completion is ${rate}% (KPI 7).`
      : `Everyone${dept ? ` in ${dept}` : ""} has completed the assessment (${total} of ${total}).`,
    alerts: [{ status: kpi7(rate), kpi: "KPI 7", detail: `Completion ${rate}% (target 95%)` }],
    bullets: list.map((e) => `${e.name}, ${e.department}`),
    actions: list.length ? ["Use Send reminder next to each name in the table below."] : undefined,
    suggestions: ["Show the KPI overview"],
  };
}

function shortlist(ctx: BotContext, q: string): BotReply {
  const dept = first(DEPT_ALIASES, q);
  if (dept && !inScope(ctx, dept)) return outOfScope(ctx, dept);
  const app = ctx.employees
    .filter((e) => e.result && isExecutiveFit(e.result.scores) && (!dept || e.department === dept))
    .sort((a, b) => leadershipIndex(b.result!.scores) - leadershipIndex(a.result!.scores));
  const s = sumStats(dept ? [dept] : scopeDepartments(ctx));
  return {
    intent: "shortlist",
    text: app.length
      ? `${app.length} registered employee(s) are executive fit (rule L1), highest Leadership Index first:`
      : "No registered employee in your scope is executive fit yet (Leadership Index 70 or more).",
    table: app.length ? {
      headers: ["Employee", "Department", "Profile", "LI"],
      rows: app.map((e) => [e.name, e.department, getProfile(e.result!.scores).name, String(leadershipIndex(e.result!.scores))]),
    } : undefined,
    bullets: [
      `Workforce dataset${dept ? `, ${dept}` : ""}: ${fmt(s.executiveFit)} executive fit (${pct(s.executiveFit, s.employees)}%), of whom ${fmt(s.x1StarExecutiveFit)} are also Stars.`,
    ],
    actions: [
      `Rule X1: put the ${fmt(s.x1StarExecutiveFit)} Star and executive-fit employees in the succession pool first.`,
      `Rule X2: coach the ${fmt(s.x2FitLowPerformance)} executive-fit employees with Low performance before placement.`,
    ],
    note: "The 9-Box needs HR records, so the app list shows personality fit only. Confirm performance before placement.",
    suggestions: ["How many Stars are there?", "What is the Leadership Index?"],
  };
}

function nineBox(ctx: BotContext, q: string): BotReply {
  const dept = first(DEPT_ALIASES, q);
  if (dept && !inScope(ctx, dept)) return outOfScope(ctx, dept);
  const s = sumStats(dept ? [dept] : scopeDepartments(ctx));
  const cells = all(CELL_ALIASES, q);
  const label = dept ?? "your scope";
  if (cells.length) {
    return {
      intent: "nine_box",
      text: cells.map((c) => `${NINE_BOX[c].label} (box ${c}): ${fmt(s.nineBox[c])} employees, ${pct(s.nineBox[c], s.rated)}% of ${fmt(s.rated)} rated in ${label}.`).join(" "),
      actions: cells.map((c) => `${NINE_BOX[c].label}: ${NINE_BOX[c].action}.`),
      alerts: cells.includes(3) ? [{ status: kpi6(pct(s.nineBox["3"], s.rated)), kpi: "KPI 6", detail: `Stars ${pct(s.nineBox["3"], s.rated)}% of rated (alert below 10%)` }] : undefined,
      note: "Workforce dataset (employees_ocean_hr.csv). Employees with no rating are not placed.",
      suggestions: ["Show the 9-Box grid", "Who should be on the succession shortlist?"],
    };
  }
  return {
    intent: "nine_box",
    text: `9-Box Talent Grid for ${label}: ${fmt(s.rated)} rated employees.`,
    table: {
      headers: ["Box", "Label", "Employees", "% of rated", "Action"],
      rows: Object.entries(NINE_BOX).map(([k, v]) => [k, v.label, fmt(s.nineBox[k]), `${pct(s.nineBox[k], s.rated)}%`, v.action]),
    },
    alerts: [{ status: kpi6(pct(s.nineBox["3"], s.rated)), kpi: "KPI 6", detail: `Stars ${pct(s.nineBox["3"], s.rated)}% of rated (alert below 10%)` }],
    note: "Workforce dataset (employees_ocean_hr.csv).",
    suggestions: ["What should we do with Enigmas?", "Who should be on the succession shortlist?"],
  };
}

function profiles(ctx: BotContext, q: string): BotReply {
  const dept = first(DEPT_ALIASES, q);
  if (dept && !inScope(ctx, dept)) return outOfScope(ctx, dept);
  const app = appSummary(dept ? ctx.employees.filter((e) => e.department === dept) : ctx.employees);
  const s = sumStats(dept ? [dept] : scopeDepartments(ctx));
  const wfTotal = PROFILE_ORDER.reduce((a, p) => a + s.profiles[p], 0);
  const only = first(PROFILE_ALIASES, q);
  const rows = (only ? [only] : PROFILE_ORDER).map((p) => [
    profileRules[p].name,
    `${app.profiles[p]} (${pct(app.profiles[p], app.completed.length)}%)`,
    `${fmt(s.profiles[p])} (${pct(s.profiles[p], wfTotal)}%)`,
  ]);
  const top = topProfile(s.profiles);
  return {
    intent: "profiles",
    text: `Decision profiles${dept ? ` in ${dept}` : ""}. The most common in the workforce dataset is ${profileRules[top.code].name} at ${top.share}%.`,
    table: { headers: ["Profile", `App (${app.completed.length} results)`, `Workforce (${fmt(wfTotal)})`], rows },
    alerts: [{ status: kpi2(top.share), kpi: "KPI 2", detail: `Largest profile ${top.share}% (alert above 35%)` }],
    suggestions: ["What is a Steward?", "Compare departments"],
  };
}

function department(ctx: BotContext, q: string): BotReply {
  const dept = first(DEPT_ALIASES, q);
  if (dept && !inScope(ctx, dept)) return outOfScope(ctx, dept);
  if (dept) {
    const s = WORKFORCE_STATS[dept];
    const app = appSummary(ctx.employees.filter((e) => e.department === dept));
    const top = topProfile(s.profiles);
    return {
      intent: "department",
      text: `${dept}: ${fmt(s.employees)} employees in the workforce dataset and ${app.total} registered in the app.`,
      bullets: [
        `KPIs met above 80%: ${pct(s.kpiMet, s.employees)}%. Mean training score ${s.meanTrainingScore}.`,
        `Most common profile: ${profileRules[top.code].name} (${top.share}%).`,
        `Mean percentiles: ${TRAIT_ORDER.map((t) => `${t} ${s.meanPercentile[t]}`).join(", ")}.`,
        `9-Box: ${fmt(s.nineBox["3"])} Stars, ${fmt(s.nineBox["1"])} Enigmas, ${fmt(s.nineBox["7"])} Underperformers.`,
      ],
      alerts: [...appAlerts(app), ...workforceAlerts(dept, s)],
      actions: actionsFor(workforceAlerts(dept, s), s, app),
      suggestions: [`What should we do in ${dept}?`, `Profile distribution in ${dept}`],
    };
  }
  const depts = scopeDepartments(ctx);
  return {
    intent: "department",
    text: "Department comparison from the workforce dataset:",
    table: {
      headers: ["Department", "Employees", "KPI met", "Exec fit", "Stars", "Low band"],
      rows: depts.map((d) => {
        const s = WORKFORCE_STATS[d];
        return [d, fmt(s.employees), `${pct(s.kpiMet, s.employees)}%`, `${pct(s.executiveFit, s.employees)}%`,
          `${pct(s.nineBox["3"], s.rated)}%`, `${pct(s.performanceBand.Low, s.rated)}%`];
      }),
    },
    note: "Stars and Low band are shares of rated employees.",
    suggestions: depts.slice(0, 2).map((d) => `Stats for ${d}`),
  };
}

function outOfScope(ctx: BotContext, dept: Department): BotReply {
  return {
    intent: "fallback",
    text: `${dept} is outside your scope as ${ctx.viewer.department}. You can see ${ctx.scope === "all" ? "all departments" : ctx.scope.join(", ")}.`,
    suggestions: ["Show the KPI overview"],
  };
}

function fallback(): BotReply {
  return {
    intent: "fallback",
    text: "Sorry, I did not understand that. Try one of these:",
    bullets: INTENTS.slice(0, 6).map((i) => i.example),
    suggestions: ["Help", "Show the KPI overview", "What should we do first?"],
  };
}

export function answer(input: string, ctx: BotContext): BotReply {
  const q = input.toLowerCase().replace(/[?!]/g, " ").replace(/\s+/g, " ").trim();
  if (!q) return help(ctx);
  switch (detectIntent(q, input, ctx)) {
    case "help": return help(ctx);
    case "scenario": return scenario(input, q);
    case "employee": return employeeAnswer(findEmployee(q, ctx)!);
    case "explain": return explain(q);
    case "pending": return pending(ctx, q);
    case "shortlist": return shortlist(ctx, q);
    case "nine_box": return nineBox(ctx, q);
    case "recommend": return recommend(ctx, q);
    case "profiles": return profiles(ctx, q);
    case "kpi": return kpiOverview(ctx, q);
    case "department": return department(ctx, q);
    default: return fallback();
  }
}
