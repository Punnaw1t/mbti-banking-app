"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { questionBank } from "@/lib/questions";
import { buildResult } from "@/lib/mbti";
import { getSessionUser, saveUser } from "@/lib/store";
import { Trait, User } from "@/lib/types";
import TopBar from "@/components/TopBar";

export default function MbtiTestPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | undefined>();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Trait[]>([]);

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

  function choose(trait: Trait) {
    const next = [...answers, trait];
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
      <TopBar user={user} tag="Personality &amp; Decision-Style Assessment" />

      <main className="mx-auto max-w-2xl px-5 sm:px-8 py-10 sm:py-16">
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Question {step + 1} of {total}</span>
            <span>{progressPct}% complete</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-brass transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <p className="text-xs uppercase tracking-widest text-brass mb-3">
          Dimension: {dichotomyLabel(question.dichotomy)}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl text-slate-50 mb-8 leading-snug">
          {question.prompt}
        </h1>

        <div className="space-y-4">
          <button
            onClick={() => choose(question.optionA.trait)}
            className="w-full text-left rounded-lg border border-white/10 bg-ink-800 hover:border-brass hover:bg-ink-700 transition-colors p-5"
          >
            <p className="text-sm text-slate-400 mb-1">A</p>
            <p className="text-slate-50">{question.optionA.label}</p>
          </button>
          <button
            onClick={() => choose(question.optionB.trait)}
            className="w-full text-left rounded-lg border border-white/10 bg-ink-800 hover:border-brass hover:bg-ink-700 transition-colors p-5"
          >
            <p className="text-sm text-slate-400 mb-1">B</p>
            <p className="text-slate-50">{question.optionB.label}</p>
          </button>
        </div>

        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={goBack}
            disabled={step === 0}
            className="text-sm text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous question
          </button>
          <p className="text-xs text-slate-600">
            {dichotomyLabel(question.dichotomy)} · item {step + 1}/{total}
          </p>
        </div>
      </main>
    </div>
  );
}

function dichotomyLabel(d: "EI" | "SN" | "TF" | "JP") {
  return {
    EI: "Extraversion vs. Introversion",
    SN: "Sensing vs. Intuition",
    TF: "Thinking vs. Feeling",
    JP: "Judging vs. Perceiving",
  }[d];
}
