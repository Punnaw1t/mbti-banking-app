"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/store";
import { User } from "@/lib/types";
import ThemeToggle from "@/components/ThemeToggle";

const HR_NAV = [
  { href: "/company", label: "Overview" },
  { href: "/company/dashboards", label: "Dashboards" },
];

export default function TopBar({ user, tag, boldTag = false }: { user?: User; tag?: string; boldTag?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    await logout();
    router.push("/login");
  }

  return (
    // Solid ink underlay keeps the bar looking exactly as it did before the
    // site-wide background photo was added (bg-ink-800/60 over plain ink).
    <header className="border-b border-hairline/10 bg-ink">
      <div className="bg-ink-800/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="font-brand text-lg tracking-tight text-slate-50">Meridian</span>
          <span className={`hidden lg:inline text-xs uppercase tracking-widest text-brass ${boldTag ? "font-bold" : ""}`}>
            {tag ?? "Executive Decision-Style DSS"}
          </span>
          {/* Inline nav from tablet up; on phones it moves to its own row below. */}
          {user?.isHrFlow && <HrNav pathname={pathname} className="hidden md:flex ml-2 lg:ml-4 self-center" />}
        </div>
        <div className="flex items-center gap-2 lg:gap-4 shrink-0">
          {user && (
            <>
              <div className="text-right leading-tight hidden xl:block">
                <p className="text-sm text-slate-50">{user.name}</p>
                <p className="text-xs text-slate-400">{user.department}</p>
              </div>
              {pathname !== "/account" && (
                <Link
                  href="/account"
                  className="whitespace-nowrap text-sm px-3 py-1.5 rounded-md border border-hairline/15 text-slate-200 hover:border-brass hover:text-brass transition-colors"
                >
                  Account
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="whitespace-nowrap text-sm px-3 py-1.5 rounded-md border border-hairline/15 text-slate-200 hover:border-brass hover:text-brass transition-colors"
              >
                Sign out
              </button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
      {user?.isHrFlow && (
        <div className="md:hidden border-t border-hairline/10 px-4 py-2">
          <HrNav pathname={pathname} className="flex" stretch />
        </div>
      )}
      </div>
    </header>
  );
}

function HrNav({ pathname, className = "", stretch = false }: { pathname: string; className?: string; stretch?: boolean }) {
  return (
    <nav className={`items-center gap-1 ${className}`}>
      {HR_NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap text-sm px-3 py-1.5 rounded-md transition-colors ${stretch ? "flex-1 text-center" : ""} ${
              active ? "bg-brass/15 text-brass" : "text-slate-400 hover:text-brass"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
