// Builds the grounded prompt for the HR Assistant LLM.
//
// The LLM never sees the database directly. Every answer is grounded on:
//   1. the rule-based engine's reply to this exact question (lib/chatbot.ts),
//   2. the KPI overview alerts for the viewer's scope,
//   3. a compact table of the employees the viewer is allowed to see,
//   4. workforce dataset stats for the departments in scope,
//   5. the KPI / profile / 9-Box rule definitions.
// so it can phrase, translate and combine facts, but has nothing else to draw numbers from.

import { BotContext, BotReply, KPI_INFO, NINE_BOX, answer } from "@/lib/chatbot";
import { getProfile, isExecutiveFit, leadershipIndex, percentiles, profileRules } from "@/lib/ocean";
import { Department } from "@/lib/types";
import { WORKFORCE_STATS } from "@/lib/workforceStats";
import { ChatMessage } from "./llm";

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 1000) / 10}%` : "n/a");

export function replyToText(r: BotReply): string {
  const out = [r.text];
  r.alerts?.forEach((a) => out.push(`- [${a.status.toUpperCase()}] ${a.kpi}: ${a.detail}`));
  if (r.table) {
    out.push(r.table.headers.join(" | "));
    r.table.rows.forEach((row) => out.push(row.join(" | ")));
  }
  r.bullets?.forEach((b) => out.push(`- ${b}`));
  r.actions?.forEach((a, i) => out.push(`Action ${i + 1}: ${a}`));
  if (r.note) out.push(`(Note: ${r.note})`);
  return out.join("\n");
}

function employeesBlock(ctx: BotContext): string {
  if (ctx.employees.length === 0) return "(no employees in scope)";
  const rows = ctx.employees.map((e) => {
    if (!e.result) return `${e.name} | ${e.department} | assessment NOT completed`;
    const s = e.result.scores;
    const p = percentiles(s);
    return [
      e.name,
      e.department,
      getProfile(s).name,
      `Leadership Index ${leadershipIndex(s)}`,
      isExecutiveFit(s) ? "executive-fit" : "not executive-fit",
      `percentiles O${p.O} C${p.C} E${p.E} A${p.A} N${p.N}`,
    ].join(" | ");
  });
  return ["name | department | decision profile | leadership index | executive fit | trait percentiles", ...rows].join("\n");
}

function workforceBlock(ctx: BotContext): string {
  const depts = (ctx.scope === "all" ? Object.keys(WORKFORCE_STATS) : ctx.scope) as Department[];
  return depts
    .filter((d) => WORKFORCE_STATS[d])
    .map((d) => {
      const s = WORKFORCE_STATS[d];
      const topProfile = (Object.entries(s.profiles) as [keyof typeof profileRules, number][])
        .sort((a, b) => b[1] - a[1])[0];
      return `${d}: ${s.employees} employees, ${s.rated} rated; executive fit ${pct(s.executiveFit, s.employees)}; ` +
        `low performance band ${pct(s.performanceBand.Low, s.rated)}; high potential ${pct(s.potentialBand.High, s.rated)}; ` +
        `Stars ${pct(s.nineBox["3"], s.rated)}; Enigmas ${s.nineBox["1"]}; ` +
        `top profile ${profileRules[topProfile[0]].name} (${pct(topProfile[1], s.employees)})`;
    })
    .join("\n");
}

function rulesBlock(): string {
  const kpis = Object.entries(KPI_INFO).map(([n, k]) => `KPI ${n} ${k.name}: ${k.rule}.`);
  const profiles = Object.values(profileRules).map((p) => p.name).join(", ");
  const boxes = Object.entries(NINE_BOX).map(([n, b]) => `${n} ${b.label} (${b.perf} perf/${b.pot} pot): ${b.action}`);
  return [
    ...kpis,
    "Executive fit = Leadership Index >= 70 (rule 5-1).",
    "Department situation (rule set 11): any Red KPI = Action needed, else any Yellow = Watch, else Healthy.",
    "Recommendations (rule set 12): REC-3 succession shortlist, REC-4 coaching plan, REC-5 stretch work, REC-6 performance review, REC-7 keep in role, REC-2 develop by profile; REC-8 to REC-13 for a Red KPI 2 to KPI 7, REC-14 Watch, REC-15 Healthy. Rule 12-16 ranks departments by Red KPIs for the CEO budget.",
    `Decision profiles: ${profiles}.`,
    "9-Box cells: " + boxes.join("; "),
  ].join("\n");
}

const SYSTEM = `You are the Meridian HR Assistant for HR executives at Siam Bank Corp. You discuss employees' OCEAN decision styles, KPIs and the 9-Box grid.
Rules:
- Use ONLY facts from DATA and from the "Rule engine answer" in the user's message. Never invent names or numbers.
- GREEN alerts are on target, not problems. Only YELLOW and RED alerts need action.
- If the data doesn't answer the question, say so and suggest something you can answer.
- Reply in the language of the user's question (Thai or English). Keep names, KPI and profile names in English.
- Be concise (under 120 words). Use short bullets for lists. Name the KPI or rule behind any advice.`;

// The system message depends only on the viewer, so it is identical across a
// conversation and the model server can reuse its cached prompt (much faster on CPU).
// Everything specific to the question goes in the final user message.
export function buildMessages(
  question: string,
  history: { role: "user" | "assistant"; content: string }[],
  ctx: BotContext,
): { messages: ChatMessage[]; ruleReply: BotReply } {
  const ruleReply = answer(question, ctx);
  const overview = answer("Show the KPI overview", ctx);
  const scopeLabel = ctx.scope === "all" ? "all departments" : ctx.scope.join(", ");

  const data = [
    `Viewer: ${ctx.viewer.name} (${ctx.viewer.department}), can see ${scopeLabel}.`,
    "",
    "## Rules",
    rulesBlock(),
    "",
    "## Workforce dataset by department (17,414 employees)",
    workforceBlock(ctx),
    "",
    "## Employees registered in Meridian",
    employeesBlock(ctx),
    "",
    "## KPI overview",
    replyToText(overview),
  ].join("\n");

  const grounded =
    ruleReply.intent === "fallback" || ruleReply.intent === "help"
      ? "(the rule engine has no specific answer; use DATA)"
      : replyToText(ruleReply);

  const messages: ChatMessage[] = [
    { role: "system", content: `${SYSTEM}\n\n# DATA\n${data}` },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content.slice(0, 1500) })),
    { role: "user", content: `Rule engine answer for this question:\n${grounded}\n\nQuestion: ${question}` },
  ];
  return { messages, ruleReply };
}
