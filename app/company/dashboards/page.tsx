"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDashboard, getDashboards, getSessionUser, saveDashboard } from "@/lib/store";
import { SavedDashboard, User } from "@/lib/types";
import TopBar from "@/components/TopBar";

// Accepts either a plain URL or a pasted <iframe ... src="..."> embed snippet
// (what Tableau / Power BI / Looker Studio "Embed" dialogs hand out).
function extractEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  const fromIframe = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
  const candidate = (fromIframe ? fromIframe[1] : trimmed).replace(/&amp;/g, "&");
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") return null;
    // Looker Studio (formerly Data Studio) only allows framing on /embed/reporting/…;
    // a normal share link (/reporting/…) renders blank inside an iframe.
    if (/^(datastudio|lookerstudio)\.google\.com$/.test(url.hostname) && url.pathname.startsWith("/reporting/")) {
      url.pathname = "/embed" + url.pathname;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export default function DashboardsPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | undefined>();
  const [dashboards, setDashboards] = useState<SavedDashboard[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u = getSessionUser();
    if (!u) { router.replace("/login"); return; }
    if (!u.isHrFlow) { router.replace("/dashboard"); return; }
    setMe(u);
    const list = getDashboards();
    setDashboards(list);
    setSelectedId(list[0]?.id ?? null);
    if (list.length === 0) setShowForm(true);
  }, [router]);

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!me) return;
    if (!title.trim()) { setError("Give the dashboard a name."); return; }
    const url = extractEmbedUrl(urlInput);
    if (!url) { setError("Paste an https:// embed link or the <iframe> embed code."); return; }

    const entry: SavedDashboard = {
      id: "d-" + Date.now(),
      title: title.trim(),
      url,
      description: description.trim() || undefined,
      createdAt: new Date().toISOString(),
      createdBy: me.name,
    };
    saveDashboard(entry);
    setDashboards(getDashboards());
    setSelectedId(entry.id);
    setTitle(""); setUrlInput(""); setDescription(""); setError(null);
    setShowForm(false);
  }

  function handleDelete(d: SavedDashboard) {
    if (!window.confirm(`Remove "${d.title}" from saved dashboards?`)) return;
    deleteDashboard(d.id);
    const list = getDashboards();
    setDashboards(list);
    if (selectedId === d.id) setSelectedId(null);
  }

  if (!me) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-400 text-sm">Loading dashboards…</p></div>;
  }

  const selected = dashboards.find((d) => d.id === selectedId) ?? null;
  const inputClass =
    "w-full rounded-md bg-ink-800 border border-hairline/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-brass outline-none";

  return (
    <div className="min-h-screen">
      <TopBar user={me} tag="Company Decision-Style Oversight" />

      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-brass mb-2">HR Executive · Visual Analytics</p>
            <h1 className="font-display text-3xl text-slate-50">Dashboards</h1>
            <p className="text-slate-400 text-sm mt-1">
              Keep the Tableau, Power BI or Looker Studio dashboards built from the "Export for Visualize" data in one place.
            </p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setError(null); }}
            className="text-sm px-4 py-2.5 rounded-md bg-brass text-midnight font-medium hover:bg-brass-light transition-colors self-start whitespace-nowrap"
          >
            {showForm ? "Cancel" : "Add dashboard"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="bg-ink-800 border border-hairline/10 rounded-lg p-5 sm:p-6 mb-8 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs uppercase tracking-widest text-slate-400 mb-1.5">Name</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Executive-fit by department" className={inputClass} />
              </label>
              <label className="block">
                <span className="block text-xs uppercase tracking-widest text-slate-400 mb-1.5">Description (optional)</span>
                <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this dashboard answers" className={inputClass} />
              </label>
            </div>
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-slate-400 mb-1.5">Embed link or embed code</span>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                rows={3}
                placeholder={'https://public.tableau.com/views/…?:embed=y   or   <iframe src="https://app.powerbi.com/view?r=…"></iframe>'}
                className={`${inputClass} font-mono text-xs`}
              />
            </label>
            {error && <p className="text-sm text-signal-red">{error}</p>}
            <div className="flex justify-end">
              <button type="submit" className="text-sm px-4 py-2 rounded-md bg-brass text-midnight font-medium hover:bg-brass-light transition-colors">
                Save dashboard
              </button>
            </div>
          </form>
        )}

        {dashboards.length === 0 ? (
          <div className="bg-ink-800 border border-dashed border-hairline/15 rounded-lg px-6 py-12 text-center">
            <p className="text-slate-200 mb-1">No dashboards saved yet.</p>
            <p className="text-sm text-slate-500">
              Export the data from Overview, build a dashboard in your BI tool, then paste its embed link here.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[260px_1fr] gap-5">
            <ul className="space-y-2">
              {dashboards.map((d) => {
                const active = d.id === selectedId;
                return (
                  <li key={d.id}>
                    <button
                      onClick={() => setSelectedId(active ? null : d.id)}
                      aria-expanded={active}
                      title={active ? "Click to close" : "Click to open"}
                      className={`w-full text-left rounded-md border px-4 py-3 transition-colors ${
                        active ? "border-brass/60 bg-brass/10" : "border-hairline/10 bg-ink-800 hover:border-brass/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${active ? "text-brass" : "text-slate-50"}`}>{d.title}</p>
                        <span
                          aria-hidden
                          className={`shrink-0 text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
                            active ? "bg-brass/20 text-brass" : "text-slate-500"
                          }`}
                        >
                          {active ? "Open" : "Closed"}
                        </span>
                      </div>
                      {d.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{d.description}</p>}
                      <p className="text-[11px] text-slate-500 mt-1">
                        {d.createdBy} · {new Date(d.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>

            {!selected && (
              <div className="bg-ink-800 border border-dashed border-hairline/15 rounded-lg flex items-center justify-center min-h-[240px] px-6 text-center">
                <p className="text-sm text-slate-500">Click a dashboard name to open it. Click it again to close it.</p>
              </div>
            )}

            {selected && (
              <section className="bg-ink-800 border border-hairline/10 rounded-lg overflow-hidden min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-hairline/10">
                  <div className="min-w-0">
                    <p className="text-slate-50 truncate">{selected.title}</p>
                    <p className="text-xs text-slate-500 truncate">{new URL(selected.url).hostname}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={selected.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-md border border-hairline/15 text-slate-200 hover:border-brass hover:text-brass transition-colors"
                    >
                      Open in new tab
                    </a>
                    <button
                      onClick={() => handleDelete(selected)}
                      className="text-xs px-3 py-1.5 rounded-md border border-hairline/15 text-slate-200 hover:border-signal-red hover:text-signal-red transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <iframe
                  key={selected.id}
                  src={selected.url}
                  title={selected.title}
                  className="w-full h-[70vh] min-h-[480px] bg-white"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
