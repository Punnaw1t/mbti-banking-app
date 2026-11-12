"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/store";
import { User } from "@/lib/types";
import ThemeToggle from "@/components/ThemeToggle";

export default function TopBar({ user, tag }: { user?: User; tag?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function handleSignOut() {
    clearSession();
    router.push("/login");
  }

  return (
    <header className="border-b border-hairline/10 bg-ink-800/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-lg tracking-tight text-slate-50">Meridian</span>
          <span className="hidden sm:inline text-xs uppercase tracking-widest text-brass">
            {tag ?? "Executive Decision-Style DSS"}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {user && (
            <>
              <div className="text-right leading-tight hidden sm:block">
                <p className="text-sm text-slate-50">{user.name}</p>
                <p className="text-xs text-slate-400">{user.department}</p>
              </div>
              {pathname !== "/account" && (
                <Link
                  href="/account"
                  className="text-sm px-3 py-1.5 rounded-md border border-hairline/15 text-slate-200 hover:border-brass hover:text-brass transition-colors"
                >
                  Account
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="text-sm px-3 py-1.5 rounded-md border border-hairline/15 text-slate-200 hover:border-brass hover:text-brass transition-colors"
              >
                Sign out
              </button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
