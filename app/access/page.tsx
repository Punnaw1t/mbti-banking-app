"use client";

import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

// Access-code gate shown after the splash and before /login.
export default function AccessPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCode, setShowCode] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Incorrect access code.");
      }
      // Full page load, not router.replace: the client router may have cached
      // the earlier "/login → /access" middleware redirect, which would bounce
      // us straight back here and leave the button stuck on "Checking…".
      window.location.replace("/login");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <ThemeToggle className="bg-ink-800" />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brass mb-2">Siam Bank Corp · Internal Tool</p>
          <h1 className="font-brand text-3xl text-slate-50 inline-flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/meridian-logo.png"
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
            />
            Meridian
          </h1>
          <p className="text-slate-400 text-sm mt-2">Enter the access code to continue.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-ink-800 border border-hairline/10 rounded-lg shadow-panel p-6 sm:p-8 space-y-5"
        >
          <div>
            <label className="block text-sm text-slate-200 mb-1.5" htmlFor="access-code">Access code</label>
            <div className="relative">
            <input
              id="access-code"
              type={showCode ? "text" : "password"}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
              autoComplete="off"
              placeholder="••••••••"
              className="w-full rounded-md bg-ink-700 border border-hairline/10 pl-3.5 pr-11 py-2.5 text-sm text-slate-50 placeholder:text-slate-600 focus:border-brass outline-none"
            />
            <button
              type="button"
              onClick={() => setShowCode((v) => !v)}
              aria-label={showCode ? "Hide access code" : "Show access code"}
              aria-pressed={showCode}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-brass transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
                {showCode && <line x1="3" y1="3" x2="21" y2="21" />}
              </svg>
            </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-signal-red bg-signal-red/10 border border-signal-red/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-brass text-midnight font-medium py-2.5 text-sm hover:bg-brass-light transition-colors disabled:opacity-60"
          >
            {busy ? "Checking…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
