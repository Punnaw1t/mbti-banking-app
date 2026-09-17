"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { findByUsername, setSession, ensureSeeded, resetAllMockData } from "@/lib/store";
import { Department } from "@/lib/types";
import ThemeToggle from "@/components/ThemeToggle";

const DEPARTMENTS: Department[] = [
  "Retail Banking",
  "Corporate Banking",
  "Customer Service",
  "Finance & Accounting",
  "IT Support",
  "Human Resources",
  "Engineering Manager",
  "Chief Technology Officer",
  "Chief Executive Officer",
];

export default function LoginPage() {
  const router = useRouter();
  ensureSeeded();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState<Department>("Retail Banking");
  const [error, setError] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

  function handleResetDemoData() {
    resetAllMockData();
    setUsername("");
    setPassword("");
    setError(null);
    setResetDone(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResetDone(false);

    const user = findByUsername(username.trim());
    if (!user || user.password !== password) {
      setError("Incorrect username or password.");
      return;
    }
    if (user.department !== department) {
      setError("Selected department does not match this account's record.");
      return;
    }

    setSession(user.id);

    // Routing rule:
    // Normal employee departments -> Flow 1 (assess -> result -> dashboard)
    // HR / Engineering Manager / CTO / CEO -> Flow 2 (company oversight)
    if (user.isHrFlow) {
      router.push("/company");
    } else if (user.result) {
      router.push("/dashboard");
    } else {
      router.push("/mbti-test");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12">
      <ThemeToggle className="fixed top-4 right-4 bg-ink-800" />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-widest text-brass mb-2">Siam Bank Corp · Internal Tool</p>
          <h1 className="font-display text-3xl text-slate-50">Meridian</h1>
          <p className="text-slate-400 text-sm mt-2">
            Executive Decision-Style Assessment &amp; DSS for HR Executives
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-ink-800 border border-hairline/10 rounded-lg shadow-panel p-6 sm:p-8 space-y-5"
        >
          <div>
            <label className="block text-sm text-slate-200 mb-1.5" htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="e.g. aran.suksawat"
              className="w-full rounded-md bg-ink-700 border border-hairline/10 px-3.5 py-2.5 text-sm text-slate-50 placeholder:text-slate-600 focus:border-brass outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1.5" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-md bg-ink-700 border border-hairline/10 px-3.5 py-2.5 text-sm text-slate-50 placeholder:text-slate-600 focus:border-brass outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1.5" htmlFor="department">Department</label>
            <select
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value as Department)}
              className="w-full rounded-md bg-ink-700 border border-hairline/10 px-3.5 py-2.5 text-sm text-slate-50 focus:border-brass outline-none"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-signal-red bg-signal-red/10 border border-signal-red/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-brass text-midnight font-medium py-2.5 text-sm hover:bg-brass-light transition-colors"
          >
            Sign in
          </button>

          <p className="text-center text-sm text-slate-400">
            New employee?{" "}
            <Link href="/register" className="text-brass hover:text-brass-light">
              Create an account
            </Link>
          </p>
        </form>

        <div className="mt-6 text-xs text-slate-600 text-center leading-relaxed">
          Demo accounts — employee: <span className="text-slate-400">aran.suksawat / password123 / Retail Banking</span><br />
          HR Executive: <span className="text-slate-400">hr.suda / hrpass123 / Human Resources</span><br />
          CEO: <span className="text-slate-400">ceo.malee / hrpass123 / Chief Executive Officer</span><br />
          CTO: <span className="text-slate-400">cto.peter / hrpass123 / Chief Technology Officer</span><br />
          Engineering Manager: <span className="text-slate-400">em.nan / hrpass123 / Engineering Manager</span>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleResetDemoData}
            className="text-xs text-slate-500 underline hover:text-brass transition-colors"
          >
            Reset demo data
          </button>
          {resetDone && (
            <p className="text-xs text-signal-green mt-1">
              Demo data reset — the accounts above are ready to use.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
