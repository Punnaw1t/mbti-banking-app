"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUser, findByUsername, setSession } from "@/lib/store";
import { Department } from "@/lib/types";

const DEPARTMENTS: Department[] = [
  "Retail Banking",
  "Corporate Banking",
  "Customer Service",
  "Finance & Accounting",
  "IT Support",
  "Human Resources",
  "Engineering Manager",
  "Product Owner",
  "Chief Technology Officer",
  "Risk/Compliance Officer",
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState<Department>("Retail Banking");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (findByUsername(username.trim())) {
      setError("That username is already taken.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    const user = createUser({ name: name.trim(), username: username.trim(), password, email: email.trim(), department });
    setSession(user.id);

    // Flow 1: register -> login (implicit) -> do MBTI test -> result -> dashboard
    // Flow 2 accounts created here still go straight into oversight, matching the login rule.
    if (user.isHrFlow) {
      router.push("/company");
    } else {
      router.push("/mbti-test");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-widest text-brass mb-2">Siam Bank Corp · Internal Tool</p>
          <h1 className="font-display text-3xl text-slate-50">Create your account</h1>
          <p className="text-slate-400 text-sm mt-2">Step 1 of the executive decision-style assessment</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-ink-800 border border-white/10 rounded-lg shadow-panel p-6 sm:p-8 space-y-5"
        >
          <div>
            <label className="block text-sm text-slate-200 mb-1.5" htmlFor="name">Full name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full rounded-md bg-ink-700 border border-white/10 px-3.5 py-2.5 text-sm text-slate-50 focus:border-brass outline-none" />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1.5" htmlFor="username">Username</label>
            <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required
              className="w-full rounded-md bg-ink-700 border border-white/10 px-3.5 py-2.5 text-sm text-slate-50 focus:border-brass outline-none" />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1.5" htmlFor="email">Work email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="name@siambankcorp.com"
              className="w-full rounded-md bg-ink-700 border border-white/10 px-3.5 py-2.5 text-sm text-slate-50 placeholder:text-slate-600 focus:border-brass outline-none" />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1.5" htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full rounded-md bg-ink-700 border border-white/10 px-3.5 py-2.5 text-sm text-slate-50 focus:border-brass outline-none" />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1.5" htmlFor="department">Department</label>
            <select id="department" value={department} onChange={(e) => setDepartment(e.target.value as Department)}
              className="w-full rounded-md bg-ink-700 border border-white/10 px-3.5 py-2.5 text-sm text-slate-50 focus:border-brass outline-none">
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {error && (
            <p className="text-sm text-signal-red bg-signal-red/10 border border-signal-red/30 rounded-md px-3 py-2">{error}</p>
          )}

          <button type="submit"
            className="w-full rounded-md bg-brass text-ink font-medium py-2.5 text-sm hover:bg-brass-light transition-colors">
            Create account &amp; continue
          </button>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-brass hover:text-brass-light">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
