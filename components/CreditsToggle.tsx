"use client";

import { useEffect, useState } from "react";

// ── Edit the About Us content here ────────────────────────────────────────────────
// photo:    put the image in /public/team/ (e.g. public/team/punnawich.jpg).
//           If the file is missing, the card falls back to the person's initials.
// linkedin: full profile URL. Leave "" to hide the LinkedIn button.
// github:   full profile URL. Leave "" to hide the GitHub button.
type Creator = { name: string; roles: string[]; photo: string; linkedin: string; github: string };

const CREATORS: Creator[] = [
  {
    name: "Mr. Punnawich Kanogpornwanich",
    roles: ["DataOps", "Data Engineer", "Software Developer", "Project Manager"],
    photo: "/team/punnawich.jpg",
    linkedin: "https://www.linkedin.com/in/punnawit-kanogpornwanich-823bb3281/",
    github: "https://github.com/Punnaw1t",
  },
  {
    name: "Mr. Bhumipat Bengpaiboon",
    roles: ["Data Analysis", "Project Consultant", "BI Developer", "Software Developer"],
    photo: "/team/bhumipat.jpg",
    linkedin: "https://www.linkedin.com/in/bhumipat-pengpaiboon-143902288/",
    github: "https://github.com/Garf1e1d",
  },
  {
    name: "Mr. Napas Siripaskrittakul",
    roles: ["Data Analysis", "LLM Tester", "Business Analysis", "AI Engineer"],
    photo: "/team/napas.jpg",
    linkedin: "https://www.linkedin.com/in/greatnapas/",
    github: "https://github.com/greatnapas",
  },
];

// Course this mini project was made for. Leave "" to hide the line.
const COURSE = "ITCS454 Special Topics in Database Systems, ICT Mahidol University";

const BUILT_WITH = ["Next.js 14", "React 18", "TypeScript", "Tailwind CSS"];
// ─────────────────────────────────────────────────────────────────────────

function initials(fullName: string) {
  return fullName
    .replace(/^(Mr|Mrs|Ms|Miss|Dr)\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function Avatar({ name, photo }: { name: string; photo: string }) {
  const [failed, setFailed] = useState(!photo);
  if (failed) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-brass/50 bg-ink-700 font-display text-lg text-brass">
        {initials(name)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo}
      alt={name}
      width={56}
      height={56}
      onError={() => setFailed(true)}
      className="h-14 w-14 shrink-0 rounded-full border border-brass/50 object-cover"
    />
  );
}

function GitHubIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

export default function CreditsToggle({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close About Us" : "Show About Us"}
        aria-expanded={open}
        title="About Us"
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          open
            ? "border-brass text-brass"
            : "border-hairline/15 text-slate-200 hover:border-brass hover:text-brass"
        } ${className}`}
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="credits-backdrop fixed inset-0 z-40 flex items-center justify-center bg-midnight/60 backdrop-blur-sm px-5"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="credits-title"
            onClick={(e) => e.stopPropagation()}
            className="credits-panel relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-ink-800 border border-hairline/10 rounded-lg shadow-panel p-6 sm:p-8 text-center"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close About Us"
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-brass transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/meridian-logo.png" alt="" width={48} height={48} className="mx-auto h-12 w-12 mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-brass mb-1">About Us</p>
            <h2 id="credits-title" className="font-brand text-2xl text-slate-50">Meridian DSS</h2>
            <p className="text-slate-400 text-xs mt-1">Executive Decision-Style Assessment</p>
            {COURSE && (
              <p className="mt-3 inline-block rounded-full border border-brass/40 bg-brass/10 px-3 py-1 text-xs text-brass-light">
                Mini project · {COURSE}
              </p>
            )}

            <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-brass/60 to-transparent" />

            <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Created by</p>
            <ul className="space-y-2.5 text-left">
              {CREATORS.map((c) => (
                <li
                  key={c.name}
                  className="flex items-start gap-3.5 rounded-lg border border-hairline/10 bg-ink-700/60 p-3"
                >
                  <Avatar name={c.name} photo={c.photo} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base text-slate-50 leading-snug">{c.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.roles.map((r) => (
                        <span
                          key={r}
                          className="rounded-full border border-brass/30 bg-brass/10 px-2 py-0.5 text-[10.5px] leading-tight text-brass-light"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  {(c.linkedin || c.github) && (
                    <div className="flex shrink-0 flex-col gap-1.5">
                      {c.linkedin && (
                        <a
                          href={c.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${c.name} on LinkedIn`}
                          title="LinkedIn"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline/15 text-slate-200 hover:border-brass hover:text-brass transition-colors"
                        >
                          <LinkedInIcon />
                        </a>
                      )}
                      {c.github && (
                        <a
                          href={c.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${c.name} on GitHub`}
                          title="GitHub"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline/15 text-slate-200 hover:border-brass hover:text-brass transition-colors"
                        >
                          <GitHubIcon />
                        </a>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <p className="text-xs uppercase tracking-widest text-slate-400 mt-6 mb-2">Built with</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {BUILT_WITH.map((t) => (
                <span key={t} className="rounded-full border border-hairline/15 px-2.5 py-0.5 text-xs text-slate-200">
                  {t}
                </span>
              ))}
            </div>

            <p className="text-[11px] text-slate-600 mt-6">
              © {new Date().getFullYear()} Meridian · Siam Bank Corp
            </p>
          </div>
        </div>
      )}
    </>
  );
}
