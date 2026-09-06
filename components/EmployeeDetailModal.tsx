"use client";

import { TestResult, User } from "@/lib/types";
import { dichotomyPercents, getArchetype } from "@/lib/mbti";
import { GROUP_META } from "@/lib/groups";
import ArchetypeAvatar from "./ArchetypeAvatar";
import ArchetypeBadge from "./ArchetypeBadge";

export default function EmployeeDetailModal({
  employee,
  onClose,
}: {
  employee: User;
  onClose: () => void;
}) {
  const result = employee.result;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-full overflow-y-auto bg-ink-800 border border-hairline/10 rounded-lg shadow-panel p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-brass mb-1">Employee detail</p>
            <h2 className="font-display text-2xl text-slate-50">{employee.name}</h2>
            <p className="text-sm text-slate-400 mt-1">{employee.email}</p>
            <p className="text-sm text-slate-400">{employee.department}</p>
          </div>
          <button
            onClick={onClose}
            className="text-sm px-3 py-1.5 rounded-md border border-hairline/15 text-slate-300 hover:text-slate-100 hover:border-brass transition-colors shrink-0"
          >
            Close
          </button>
        </div>

        {!result ? (
          <p className="text-sm text-slate-300 [html.light_&]:text-black">
            This employee hasn't completed the MBTI decision-style assessment yet.
          </p>
        ) : (
          <EmployeeResultDetail result={result} />
        )}
      </div>
    </div>
  );
}

function EmployeeResultDetail({ result }: { result: TestResult }) {
  const archetype = getArchetype(result.mbtiType);
  const pct = dichotomyPercents(result.scores);
  const rows = [
    { key: "EI", ...pct.EI, leftName: "Extraversion", rightName: "Introversion" },
    { key: "SN", ...pct.SN, leftName: "Sensing", rightName: "Intuition" },
    { key: "TF", ...pct.TF, leftName: "Thinking", rightName: "Feeling" },
    { key: "JP", ...pct.JP, leftName: "Judging", rightName: "Perceiving" },
  ] as const;

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <ArchetypeAvatar archetype={archetype} size="lg" />
        <div>
          <p className="font-display text-2xl text-slate-50">
            {result.mbtiType} — {archetype.name}
          </p>
          <ArchetypeBadge archetype={archetype} />
        </div>
      </div>

      <p className="text-sm text-slate-300 [html.light_&]:text-black leading-relaxed mb-6">
        {archetype.description}
      </p>

      <div className="grid sm:grid-cols-2 gap-6 mb-6 pb-6 border-b border-hairline/10">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Decision style summary</p>
          <p className="text-sm text-slate-200">{archetype.decisionStyle}</p>
          <p className="text-sm text-slate-300 [html.light_&]:text-black mt-1">
            {archetype.decisionStyleDetail}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">MBTI colour group</p>
          <p className={`text-sm font-medium ${GROUP_META[archetype.group].text}`}>
            {archetype.group}s
          </p>
          <p className="text-sm text-slate-200 mt-1">{GROUP_META[archetype.group].blurb}</p>
        </div>
      </div>

      <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">Dichotomy breakdown</p>
      <div className="space-y-5 mb-6">
        {rows.map((r) => (
          <div key={r.key}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-300 [html.light_&]:text-black">
                {r.leftName} ({r.leftLabel})
              </span>
              <span className="text-slate-300 [html.light_&]:text-black">
                {r.rightName} ({r.rightLabel})
              </span>
            </div>
            <div className="h-2 rounded-full bg-hairline/10 overflow-hidden flex">
              <div className="h-full bg-brass" style={{ width: `${r.leftPct}%` }} />
              <div className="h-full bg-slate-400/40" style={{ width: `${100 - r.leftPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{r.leftPct}%</span>
              <span>{100 - r.leftPct}%</span>
            </div>
          </div>
        ))}
      </div>

      {archetype.executiveFit && (
        <p className="text-xs text-brass-light border-t border-hairline/10 pt-3 mb-2">
          Flagged as a core executive-track decision style for upper-management review.
        </p>
      )}

      <p className="text-xs text-slate-500">
        Assessed on {new Date(result.completedAt).toLocaleDateString()}
      </p>
    </>
  );
}
