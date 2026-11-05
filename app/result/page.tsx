"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/store";
import { User } from "@/lib/types";
import { getProfile, isExecutiveFit } from "@/lib/ocean";
import TopBar from "@/components/TopBar";
import OceanPanel from "@/components/OceanPanel";
import ProfileBadge from "@/components/ProfileBadge";

export default function ResultPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | undefined>();

  useEffect(() => {
    const u = getSessionUser();
    if (!u) { router.replace("/login"); return; }
    if (!u.result) { router.replace("/assessment"); return; }
    setUser(u);
  }, [router]);

  if (!user || !user.result) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-400 text-sm">Loading result…</p></div>;
  }

  const { scores } = user.result;
  const profile = getProfile(scores);

  return (
    <div className="min-h-screen">
      <TopBar user={user} tag="Assessment Result" />
      <main className="mx-auto max-w-4xl px-5 sm:px-8 py-10 sm:py-16">
        <p className="text-xs uppercase tracking-widest text-brass mb-3">Your result</p>
        <h1 className="font-display text-3xl sm:text-4xl text-slate-50 mb-2">{profile.name}</h1>
        <p className="text-slate-400 mb-8">{profile.decisionStyle}</p>

        <div className="grid md:grid-cols-[1fr_18rem] gap-8 items-start">
          <div className="bg-ink-800 border border-hairline/10 rounded-lg p-6 sm:p-8">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">OCEAN profile</p>
            <OceanPanel scores={scores} />
          </div>

          <div className="bg-ink-800 border border-brass/30 rounded-lg p-6">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Decision profile</p>
            <ProfileBadge scores={scores} size="lg" />
            <p className="text-sm text-slate-300 [html.light_&]:text-black mt-4 leading-relaxed">{profile.description}</p>
            {isExecutiveFit(scores) && (
              <p className="mt-4 text-xs text-brass-light border-t border-hairline/10 pt-3">
                Flagged as a core executive-track profile for upper-management review.
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
