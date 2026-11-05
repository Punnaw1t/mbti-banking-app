"use client";

import { TestResult, User } from "@/lib/types";
import { getProfile, isExecutiveFit, leadershipIndex } from "@/lib/ocean";
import OceanPanel from "./OceanPanel";
import ProfileBadge from "./ProfileBadge";

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
            This employee hasn't completed the OCEAN personality assessment yet.
          </p>
        ) : (
          <EmployeeResultDetail result={result} />
        )}
      </div>
    </div>
  );
}

function EmployeeResultDetail({ result }: { result: TestResult }) {
  const { scores } = result;
  const profile = getProfile(scores);

  return (
    <>
      <div className="mb-4">
        <p className="font-display text-2xl text-slate-50 mb-2">{profile.name}</p>
        <ProfileBadge scores={scores} />
      </div>

      <p className="text-sm text-slate-300 [html.light_&]:text-black leading-relaxed mb-6">
        {profile.description}
      </p>

      <div className="grid sm:grid-cols-2 gap-6 mb-6 pb-6 border-b border-hairline/10">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Decision style summary</p>
          <p className="text-sm text-slate-200">{profile.decisionStyle}</p>
          <p className="text-sm text-slate-300 [html.light_&]:text-black mt-1">
            {profile.decisionStyleDetail}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Leadership index</p>
          <p className="font-display text-2xl text-slate-50">{leadershipIndex(scores)}</p>
          <p className="text-sm text-slate-300 [html.light_&]:text-black mt-1">
            OCEAN percentiles weighted by their link to leadership. 70 or above is executive-track.
          </p>
        </div>
      </div>

      <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">OCEAN profile</p>
      <div className="mb-6">
        <OceanPanel scores={scores} />
      </div>

      {isExecutiveFit(scores) && (
        <p className="text-xs text-brass-light border-t border-hairline/10 pt-3 mb-2">
          Flagged as a core executive-track profile for upper-management review.
        </p>
      )}

      <p className="text-xs text-slate-500">
        Assessed on {new Date(result.completedAt).toLocaleDateString()}
      </p>
    </>
  );
}
