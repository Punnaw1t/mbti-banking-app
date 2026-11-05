import { User } from "./types";
import { getProfile, isExecutiveFit, leadershipIndex, percentiles, TRAIT_META, TRAIT_ORDER } from "./ocean";

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const CSV_HEADERS = [
  "Employee Name",
  "Email",
  "Department",
  "Assessment Status",
  "Decision Profile",
  "Decision Style Summary",
  "Decision Style Detail",
  "Leadership Index",
  "Executive Fit",
  "Completed At",
  ...TRAIT_ORDER.map((t) => `${TRAIT_META[t].name} Raw`),
  ...TRAIT_ORDER.map((t) => `${TRAIT_META[t].name} Percentile`),
];

// Flat, one-row-per-employee export designed for BI tools (Tableau, Power BI,
// etc.) rather than for human reading — every trait is its own numeric
// column so it can be dropped straight onto a shelf without reshaping.
export function buildEmployeeCsv(employees: User[]): string {
  const rows = employees.map((e) => {
    const r = e.result;
    const profile = r ? getProfile(r.scores) : null;
    const pct = r ? percentiles(r.scores) : null;
    const cells: (string | number)[] = [
      e.name,
      e.email,
      e.department,
      r ? "Completed" : "Pending",
      profile?.name ?? "",
      profile?.decisionStyle ?? "",
      profile?.decisionStyleDetail ?? "",
      r ? leadershipIndex(r.scores) : "",
      r ? (isExecutiveFit(r.scores) ? "Yes" : "No") : "",
      r ? new Date(r.completedAt).toISOString() : "",
      ...TRAIT_ORDER.map((t) => r?.scores[t] ?? ""),
      ...TRAIT_ORDER.map((t) => pct?.[t] ?? ""),
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
