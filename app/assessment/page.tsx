"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { questionBank } from "@/lib/questions";
import { buildResult } from "@/lib/ocean";
import { getSessionUser, saveUser } from "@/lib/store";
import { LikertAnswer, User } from "@/lib/types";
import TopBar from "@/components/TopBar";

const LIKERT: { value: LikertAnswer; label: string }[] = [
  { value: 1, label: "Disagree" },
  { value: 2, label: "Slightly disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Slightly agree" },
  { value: 5, label: "Agree" },
];

export default function AssessmentPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | undefined>();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<LikertAnswer[]>([]);

  useEffect(() => {
    const u = getSessionUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    if (u.isHrFlow) {
      router.replace("/company");
      return;
    }
    setUser(u);
  }, [router]);

  const total = questionBank.length;
  const question = questionBank[step];
  const progressPct = useMemo(() => Math.round((step / total) * 100), [step, total]);

  function choose(answer: LikertAnswer) {
    const next = [...answers, answer];
    setAnswers(next);

    if (step + 1 < total) {
      setStep(step + 1);
    } else if (user) {
      const result = buildResult(next);
      const updated: User = { ...user, result };
      saveUser(updated);
      router.push("/result");
    }
  }

  function goBack() {
    if (step === 0) return;
    setAnswers(answers.slice(0, -1));
    setStep(step - 1);
  }

  if (!user || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading assessment…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar user={user} tag="OCEAN Personality Assessment" />

      <main className="mx-auto max-w-2xl px-5 sm:px-8 py-10 sm:py-16">
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Statement {step + 1} of {total}</span>
            <span>{progressPct}% complete</span>
          </div>
          <div className="h-1.5 rounded-full bg-hairline/10 overflow-hidden">
            <div
              className="h-full bg-brass transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <p className="text-xs uppercase tracking-widest text-brass mb-3">
          How accurately does this describe you?
        </p>
        <h1 className="font-display text-2xl sm:text-3xl text-slate-50 mb-8 leading-snug">
          {question.prompt}
        </h1>

        <div className="space-y-3">
          {LIKERT.map((option) => (
            <button
              key={option.value}
              onClick={() => choose(option.value)}
              className="w-full text-left rounded-lg border border-hairline/10 bg-ink-800 hover:border-brass hover:bg-ink-700 transition-colors px-5 py-4 flex items-center gap-4"
            >
              <span className="text-sm text-slate-400 tabular-nums">{option.value}</span>
              <span className="text-slate-50">{option.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-8">
          <button
            onClick={goBack}
            disabled={step === 0}
            className="text-sm text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous statement
          </button>
        </div>
      </main>
    </div>
  );
}
