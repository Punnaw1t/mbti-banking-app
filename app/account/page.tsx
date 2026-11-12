"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSessionUser, updateCredentials } from "@/lib/store";
import { User } from "@/lib/types";
import TopBar from "@/components/TopBar";

const inputClass =
  "w-full rounded-md bg-ink-700 border border-hairline/10 px-3.5 py-2.5 text-sm text-slate-50 placeholder:text-slate-600 focus:border-brass outline-none";

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | undefined>();
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    const u = getSessionUser();
    if (!u) { router.replace("/login"); return; }
    setMe(u);
    setUsername(u.username);
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(null);
    if (!me) return;
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    const problem = updateCredentials(me.id, { currentPassword, newUsername: username, newPassword });
    if (problem) {
      setError(problem);
      return;
    }
    const updated = getSessionUser();
    const changed = [
      updated && updated.username !== me.username ? "username" : null,
      newPassword ? "password" : null,
    ].filter(Boolean).join(" and ");
    setMe(updated);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSaved(`Your ${changed} ${changed.includes(" and ") ? "were" : "was"} updated. Use the new details next time you sign in.`);
  }

  if (!me) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-400 text-sm">Loading account…</p></div>;
  }

  const backHref = me.isHrFlow ? "/company" : "/dashboard";

  return (
    <div className="min-h-screen">
      <TopBar user={me} tag="Account settings" />

      <main className="mx-auto max-w-md px-5 sm:px-0 py-10 sm:py-14">
        <Link href={backHref} className="text-sm text-slate-400 hover:text-brass">
          ← Back to {me.isHrFlow ? "Company Overview" : "Dashboard"}
        </Link>
        <h1 className="font-display text-3xl text-slate-50 mt-4">Account settings</h1>
        <p className="text-slate-400 text-sm mt-1 mb-8">Change the username and password you sign in with.</p>

        <div className="bg-ink-800 border border-hairline/10 rounded-lg p-5 mb-6 text-sm grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
          <span className="text-slate-400">Name</span><span className="text-slate-50">{me.name}</span>
          <span className="text-slate-400">Email</span><span className="text-slate-50 break-all">{me.email}</span>
          <span className="text-slate-400">Department</span><span className="text-slate-50">{me.department}</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-ink-800 border border-hairline/10 rounded-lg shadow-panel p-6 sm:p-8 space-y-5">
          <div>
            <label className="block text-sm text-slate-200 mb-1.5" htmlFor="username">Username</label>
            <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required
              autoComplete="username" className={inputClass} />
          </div>

          <div className="pt-1 border-t border-hairline/10">
            <p className="text-xs uppercase tracking-widest text-slate-400 mt-4 mb-3">Change password (optional)</p>
            <label className="block text-sm text-slate-200 mb-1.5" htmlFor="new-password">New password</label>
            <input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password" placeholder="Leave blank to keep your current password" className={inputClass} />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1.5" htmlFor="confirm-password">Confirm new password</label>
            <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password" className={inputClass} />
          </div>

          <div className="pt-1 border-t border-hairline/10">
            <label className="block text-sm text-slate-200 mb-1.5 mt-4" htmlFor="current-password">Current password</label>
            <input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              required autoComplete="current-password" className={inputClass} />
            <p className="text-xs text-slate-500 mt-1.5">Required to save any change.</p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-signal-red bg-signal-red/10 border border-signal-red/30 rounded-md px-3 py-2">{error}</p>
          )}
          {saved && (
            <p role="status" className="text-sm text-signal-green bg-signal-green/10 border border-signal-green/30 rounded-md px-3 py-2">{saved}</p>
          )}

          <button type="submit"
            className="w-full rounded-md bg-brass text-midnight font-medium py-2.5 text-sm hover:bg-brass-light transition-colors">
            Save changes
          </button>
        </form>
      </main>
    </div>
  );
}
