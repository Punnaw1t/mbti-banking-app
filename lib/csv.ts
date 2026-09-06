import { User } from "./types";
import { dichotomyPercents, getArchetype } from "./mbti";

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const CSV_HEADERS = [
  "Employee Name",
  "Email",
  "Department",
  "Assessment Status",
  "MBTI Type",
  "Archetype",
  "MBTI Colour Group",
  "Decision Style Summary",
  "Decision Style Detail",
  "Executive Fit",
  "Completed At",
  "Extraversion %",
  "Introversion %",
  "Sensing %",
  "Intuition %",
  "Thinking %",
  "Feeling %",
  "Judging %",
  "Perceiving %",
];

// Flat, one-row-per-employee export designed for BI tools (Tableau, Power BI,
// etc.) rather than for human reading — every dichotomy is its own numeric
// column so it can be dropped straight onto a shelf without reshaping.
export function buildEmployeeCsv(employees: User[]): string {
  const rows = employees.map((e) => {
    const r = e.result;
    const archetype = r ? getArchetype(r.mbtiType) : null;
    const pct = r ? dichotomyPercents(r.scores) : null;
    const cells: (string | number)[] = [
      e.name,
      e.email,
      e.department,
      r ? "Completed" : "Pending",
      r?.mbtiType ?? "",
      archetype?.name ?? "",
      archetype?.group ?? "",
      archetype?.decisionStyle ?? "",
      archetype?.decisionStyleDetail ?? "",
      archetype ? (archetype.executiveFit ? "Yes" : "No") : "",
      r ? new Date(r.completedAt).toISOString() : "",
      pct ? pct.EI.leftPct : "",
      pct ? 100 - pct.EI.leftPct : "",
      pct ? pct.SN.leftPct : "",
      pct ? 100 - pct.SN.leftPct : "",
      pct ? pct.TF.leftPct : "",
      pct ? 100 - pct.TF.leftPct : "",
      pct ? pct.JP.leftPct : "",
      pct ? 100 - pct.JP.leftPct : "",
    ];
    return cells.map(csvCell).join(",");
  });
  return [CSV_HEADERS.map(csvCell).join(","), ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  // Leading BOM so Excel/Tableau reliably detect UTF-8 on Windows.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
