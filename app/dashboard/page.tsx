"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/store";
import { User } from "@/lib/types";
import TopBar from "@/components/TopBar";
import ArchetypeBadge from "@/components/ArchetypeBadge";
import ArchetypeAvatar from "@/components/ArchetypeAvatar";
import { GROUP_META } from "@/lib/groups";
import { dichotomyPercents } from "@/lib/mbti";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | undefined>();

  useEffect(() => {
    const u = getSessionUser();
    if (!u) { router.replace("/login"); return; }
    if (u.isHrFlow) { router.replace("/company"); return; }
    if (!u.result) { router.replace("/mbti-test"); return; }
    setUser(u);
  }, [router]);

  if (!user || !user.result) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-400 text-sm">Loading dashboard…</p></div>;
  }

  const { mbtiType, archetype, completedAt } = user.result;
  const pct = dichotomyPercents(user.result.scores);

  return (
    <div className="min-h-screen">
      <TopBar user={user} tag="My Dashboard" />
      <main className="mx-auto max-w-5xl px-5 sm:px-8 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-brass mb-2">Welcome back</p>
            <h1 className="font-display text-3xl text-slate-50">{user.name}</h1>
            <p className="text-slate-400 text-sm mt-1">{user.department} · Siam Bank Corp</p>
          </div>
          <button
            onClick={() => router.push("/mbti-test")}
            className="text-sm text-slate-300 border border-hairline/15 rounded-md px-4 py-2 hover:border-brass hover:text-brass transition-colors self-start"
          >
            Retake assessment
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-1 bg-ink-800 border border-brass/30 rounded-lg p-6">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Your type</p>
            <div className="flex items-center gap-3 mb-3">
              <ArchetypeAvatar archetype={archetype} />
              <p className="font-display text-4xl text-slate-50">{mbtiType}</p>
            </div>
            <ArchetypeBadge archetype={archetype} />
            <p className="text-sm text-slate-300 [html.light_&]:text-black mt-4 leading-relaxed">{archetype.description}</p>
            <p className="text-xs text-slate-500 mt-4">
              Assessed on {new Date(completedAt).toLocaleDateString()}
            </p>
          </div>

          <div className="md:col-span-2 bg-ink-800 border border-hairline/10 rounded-lg p-6">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-5">Dichotomy breakdown</p>
            <div className="space-y-5">
              {([
                { key: "EI", ...pct.EI, leftName: "Extraversion", rightName: "Introversion" },
                { key: "SN", ...pct.SN, leftName: "Sensing", rightName: "Intuition" },
                { key: "TF", ...pct.TF, leftName: "Thinking", rightName: "Feeling" },
                { key: "JP", ...pct.JP, leftName: "Judging", rightName: "Perceiving" },
              ] as const).map((r) => (
                <div key={r.key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-300 [html.light_&]:text-black">{r.leftName}</span>
                    <span className="text-slate-300 [html.light_&]:text-black">{r.rightName}</span>
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

            <div className="mt-7 pt-6 border-t border-hairline/10 grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Decision style summary</p>
                <p className="text-sm text-slate-200">{archetype.decisionStyle}</p>
                <p className="text-sm text-slate-300 [html.light_&]:text-black mt-1">{archetype.decisionStyleDetail}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">MBTI colour group</p>
                <p className={`text-sm font-medium ${GROUP_META[archetype.group].text}`}>{archetype.group}s</p>
                <p className="text-sm text-slate-200 mt-1">{GROUP_META[archetype.group].blurb}</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 mt-8">
          Your results are visible to HR Executives and hiring managers reviewing internal candidates for
          upper-management roles, in line with company policy.
        </p>
      </main>
    </div>
  );
}
