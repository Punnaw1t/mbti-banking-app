"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/store";
import { User } from "@/lib/types";
import TopBar from "@/components/TopBar";
import OceanPanel from "@/components/OceanPanel";
import ProfileBadge from "@/components/ProfileBadge";
import { getProfile } from "@/lib/ocean";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | undefined>();

  useEffect(() => {
    const u = getSessionUser();
    if (!u) { router.replace("/login"); return; }
    if (u.isHrFlow) { router.replace("/company"); return; }
    if (!u.result) { router.replace("/assessment"); return; }
    setUser(u);
  }, [router]);

  if (!user || !user.result) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-400 text-sm">Loading dashboard…</p></div>;
  }

  const { scores, completedAt } = user.result;
  const profile = getProfile(scores);

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
            onClick={() => router.push("/assessment")}
            className="text-sm text-slate-300 border border-hairline/15 rounded-md px-4 py-2 hover:border-brass hover:text-brass transition-colors self-start"
          >
            Retake assessment
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-1 bg-ink-800 border border-brass/30 rounded-lg p-6">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Your decision profile</p>
            <p className="font-display text-3xl text-slate-50 mb-3">{profile.name}</p>
            <ProfileBadge scores={scores} />
            <p className="text-sm text-slate-300 [html.light_&]:text-black mt-4 leading-relaxed">{profile.description}</p>
            <div className="mt-5 pt-5 border-t border-hairline/10">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Decision style summary</p>
              <p className="text-sm text-slate-200">{profile.decisionStyle}</p>
              <p className="text-sm text-slate-300 [html.light_&]:text-black mt-1">{profile.decisionStyleDetail}</p>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Assessed on {new Date(completedAt).toLocaleDateString()}
            </p>
          </div>

          <div className="md:col-span-2 bg-ink-800 border border-hairline/10 rounded-lg p-6">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">OCEAN profile</p>
            <OceanPanel scores={scores} />
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
