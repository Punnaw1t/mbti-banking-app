"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/store";
import { User } from "@/lib/types";

export default function TopBar({ user, tag }: { user?: User; tag?: string }) {
  const router = useRouter();

  function handleSignOut() {
    clearSession();
    router.push("/login");
  }

  return (
    <header className="border-b border-white/10 bg-ink-800/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-lg tracking-tight text-slate-50">Meridian</span>
          <span className="hidden sm:inline text-xs uppercase tracking-widest text-brass">
            {tag ?? "Executive Decision-Style DSS"}
          </span>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <div className="text-right leading-tight hidden sm:block">
              <p className="text-sm text-slate-50">{user.name}</p>
              <p className="text-xs text-slate-400">{user.department}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm px-3 py-1.5 rounded-md border border-white/15 text-slate-200 hover:border-brass hover:text-brass transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
