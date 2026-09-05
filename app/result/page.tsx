"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/store";
import { User } from "@/lib/types";
import { dichotomyPercents } from "@/lib/mbti";
import TopBar from "@/components/TopBar";
import ArchetypeBadge from "@/components/ArchetypeBadge";
import { GROUP_META } from "@/lib/groups";

export default function ResultPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | undefined>();

  useEffect(() => {
    const u = getSessionUser();
    if (!u) { router.replace("/login"); return; }
    if (!u.result) { router.replace("/mbti-test"); return; }
    setUser(u);
  }, [router]);

  if (!user || !user.result) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-400 text-sm">Loading result…</p></div>;
  }

  const { mbtiType, archetype, scores } = user.result;
  const pct = dichotomyPercents(scores);

  const rows = [
    { key: "EI", ...pct.EI, leftName: "Extraversion", rightName: "Introversion" },
    { key: "SN", ...pct.SN, leftName: "Sensing", rightName: "Intuition" },
    { key: "TF", ...pct.TF, leftName: "Thinking", rightName: "Feeling" },
    { key: "JP", ...pct.JP, leftName: "Judging", rightName: "Perceiving" },
  ] as const;

  return (
    <div className="min-h-screen">
      <TopBar user={user} tag="Assessment Result" />
      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-10 sm:py-16">
        <p className="text-xs uppercase tracking-widest text-brass mb-3">Your result</p>
        <h1 className="font-display text-3xl sm:text-4xl text-slate-50 mb-2">
          {mbtiType} — {archetype.name}
        </h1>
        <p className="text-slate-400 mb-8">{archetype.decisionStyle}</p>

        <div className="grid sm:grid-cols-[1fr_auto] gap-8 items-start">
          <div className="bg-ink-800 border border-hairline/10 rounded-lg p-6 sm:p-8 space-y-6">
            {rows.map((r) => (
              <div key={r.key}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-300 [html.light_&]:text-black">{r.leftName} ({r.leftLabel})</span>
                  <span className="text-slate-300 [html.light_&]:text-black">{r.rightName} ({r.rightLabel})</span>
                </div>
                <div className="h-2.5 rounded-full bg-hairline/10 overflow-hidden flex">
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

          <div className="bg-ink-800 border border-brass/30 rounded-lg p-6 w-full sm:w-64">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Decision-maker archetype</p>
            <ArchetypeBadge archetype={archetype} size="lg" />
            <p className="text-sm text-slate-300 [html.light_&]:text-black mt-4 leading-relaxed">{archetype.description}</p>
            <div className="mt-4 pt-4 border-t border-hairline/10">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-1.5">MBTI colour group</p>
              <p className={`text-sm font-medium ${GROUP_META[archetype.group].text}`}>{archetype.group}s</p>
              <p className="text-sm text-slate-300 [html.light_&]:text-black mt-1">{GROUP_META[archetype.group].blurb}</p>
            </div>
            {archetype.executiveFit && (
              <p className="mt-4 text-xs text-brass-light border-t border-hairline/10 pt-3">
                Flagged as a core executive-track decision style for upper-management review.
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="mt-10 rounded-md bg-brass text-midnight font-medium px-5 py-2.5 text-sm hover:bg-brass-light transition-colors"
        >
          Continue to dashboard →
        </button>
      </main>
    </div>
  );
}
