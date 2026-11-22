"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/store";

// Total splash duration before leaving the intro screen.
const SPLASH_MS = 5000;
// The last part of the splash is a fade-out so the hand-off feels smooth.
const FADE_OUT_MS = 600;

export default function Home() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Look up the session while the splash plays; fall back to /login if the
    // server or database can't be reached.
    const targetPromise = getSessionUser()
      .then((user) =>
        !user ? "/login" : user.isHrFlow ? "/company" : user.result ? "/dashboard" : "/assessment",
      )
      .catch(() => "/login");
    targetPromise.then((t) => router.prefetch(t));

    let cancelled = false;
    const fadeTimer = window.setTimeout(() => setLeaving(true), SPLASH_MS - FADE_OUT_MS);
    const navTimer = window.setTimeout(async () => {
      const target = await targetPromise;
      if (!cancelled) router.replace(target);
    }, SPLASH_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(fadeTimer);
      window.clearTimeout(navTimer);
    };
  }, [router]);

  return (
    <div
      className={`splash min-h-screen flex items-center justify-center px-5 overflow-hidden ${
        leaving ? "splash-leave" : ""
      }`}
      role="status"
      aria-label="Loading Meridian"
    >
      <div className="relative flex flex-col items-center text-center">
        {/* Rotating meridian rings behind the logo */}
        <div className="relative h-36 w-36 mb-8">
          <span className="splash-ring splash-ring-outer" aria-hidden />
          <span className="splash-ring splash-ring-inner" aria-hidden />
          <span className="splash-glow" aria-hidden />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/meridian-logo.png"
            alt=""
            width={80}
            height={80}
            className="splash-logo absolute inset-0 m-auto h-20 w-20 drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
          />
        </div>

        <p className="splash-eyebrow text-xs font-bold uppercase tracking-widest text-brass mb-3">
          Siam Bank Corp · Internal Tool
        </p>

        <h1 className="font-brand text-5xl sm:text-6xl text-slate-50 flex" aria-label="Meridian">
          {"Meridian".split("").map((ch, i) => (
            <span
              key={i}
              className="splash-letter"
              style={{ animationDelay: `${900 + i * 90}ms` }}
              aria-hidden
            >
              {ch}
            </span>
          ))}
        </h1>

        <span className="splash-rule mt-4" aria-hidden />

        <p className="splash-tagline text-slate-400 text-sm mt-4">
          Executive Decision-Style Assessment &amp; DSS
        </p>

        {/* Progress bar that fills over the full splash duration */}
        <div className="splash-track mt-10 h-[2px] w-48 rounded-full bg-hairline/10 overflow-hidden" aria-hidden>
          <div
            className="splash-progress h-full bg-brass"
            style={{ animationDuration: `${SPLASH_MS - FADE_OUT_MS}ms` }}
          />
        </div>
      </div>
    </div>
  );
}
