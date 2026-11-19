"use client";

import { DragEvent, FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDashboard, getDashboards, getSessionUser, saveDashboard } from "@/lib/store";
import { SavedDashboard, User } from "@/lib/types";
import {
  DASHBOARD_FILE_ACCEPT,
  MAX_DASHBOARD_FILE_BYTES,
  dashboardFileKind,
  deleteDashboardFile,
  formatBytes,
  getDashboardFile,
  putDashboardFile,
} from "@/lib/dashboardFiles";
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

// BI source files a browser can't render: point people at an export instead.
const UNRENDERABLE: Record<string, string> = {
  twb: "Tableau", twbx: "Tableau", pbix: "Power BI", pbit: "Power BI",
};

function checkFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (UNRENDERABLE[ext]) {
    return `${UNRENDERABLE[ext]} .${ext} files can't be shown in a browser. Export the dashboard as PDF or an image (PNG) and upload that instead.`;
  }
  if (!dashboardFileKind(file.name)) return "Upload a PDF, an image (PNG, JPG, GIF, WebP, SVG) or an exported HTML file.";
  if (file.size > MAX_DASHBOARD_FILE_BYTES) {
    return `This file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_DASHBOARD_FILE_BYTES)}.`;
  }
  return null;
}

type Mode = "link" | "file";

export default function DashboardsPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | undefined>();
  const [dashboards, setDashboards] = useState<SavedDashboard[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<Mode>("link");
  const [title, setTitle] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function resetForm() {
    setTitle(""); setUrlInput(""); setDescription(""); setFile(null); setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function pickFile(f: File | undefined) {
    if (!f) return;
    const problem = checkFile(f);
    if (problem) { setFile(null); setError(problem); return; }
    setFile(f);
    setError(null);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files[0]);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!me || saving) return;

    const base = {
      id: "d-" + Date.now(),
      description: description.trim() || undefined,
      createdAt: new Date().toISOString(),
      createdBy: me.name,
    };
    let entry: SavedDashboard;

    if (mode === "link") {
      if (!title.trim()) { setError("Give the dashboard a name."); return; }
      const url = extractEmbedUrl(urlInput);
      if (!url) { setError("Paste an https:// embed link or the <iframe> embed code."); return; }
      entry = { ...base, title: title.trim(), source: "link", url };
    } else {
      if (!file) { setError("Choose a file to upload."); return; }
      entry = {
        ...base,
        title: title.trim() || file.name.replace(/\.[^.]+$/, ""),
        source: "file",
        url: "",
        file: { name: file.name, type: file.type, size: file.size },
      };
      setSaving(true);
      try {
        await putDashboardFile(entry.id, file);
      } catch {
        setError("Couldn't save the file in this browser. It may be out of storage space.");
        return;
      } finally {
        setSaving(false);
      }
    }

    saveDashboard(entry);
    setDashboards(getDashboards());
    setSelectedId(entry.id);
    resetForm();
    setShowForm(false);
  }

  function handleDelete(d: SavedDashboard) {
    if (!window.confirm(`Remove "${d.title}" from saved dashboards?`)) return;
    deleteDashboard(d.id);
    if (d.source === "file") deleteDashboardFile(d.id).catch(() => {});
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
  const tabClass = (active: boolean) =>
    `text-sm px-3 py-1.5 rounded-md transition-colors ${active ? "bg-brass/15 text-brass" : "text-slate-400 hover:text-brass"}`;

  return (
    <div className="min-h-screen">
      <TopBar user={me} tag="Company Decision-Style Oversight" boldTag />

      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brass mb-2">HR Executive · Visual Analytics</p>
            <h1 className="font-display text-3xl text-slate-50">Dashboards</h1>
            <p className="text-slate-400 text-sm mt-1">
              Keep the Tableau, Power BI or Looker Studio dashboards built from the "Export for Visualize" data in one place.
            </p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); resetForm(); }}
            className="text-sm px-4 py-2.5 rounded-md bg-brass text-midnight font-medium hover:bg-brass-light transition-colors self-start whitespace-nowrap"
          >
            {showForm ? "Cancel" : "Add dashboard"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="bg-ink-800 border border-hairline/10 rounded-lg p-5 sm:p-6 mb-8 space-y-4">
            <div className="flex gap-1" role="tablist" aria-label="Dashboard source">
              <button type="button" role="tab" aria-selected={mode === "link"} className={tabClass(mode === "link")}
                onClick={() => { setMode("link"); setError(null); }}>
                Embed link
              </button>
              <button type="button" role="tab" aria-selected={mode === "file"} className={tabClass(mode === "file")}
                onClick={() => { setMode("file"); setError(null); }}>
                Upload file
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs uppercase tracking-widest text-slate-400 mb-1.5">
                  Name{mode === "file" && " (optional)"}
                </span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={mode === "file" && file ? file.name.replace(/\.[^.]+$/, "") : "e.g. Executive-fit by department"}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="block text-xs uppercase tracking-widest text-slate-400 mb-1.5">Description (optional)</span>
                <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this dashboard answers" className={inputClass} />
              </label>
            </div>

            {mode === "link" ? (
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
            ) : (
              <div>
                <span className="block text-xs uppercase tracking-widest text-slate-400 mb-1.5">File</span>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`rounded-md border-2 border-dashed px-5 py-8 text-center cursor-pointer transition-colors ${
                    dragging ? "border-brass bg-brass/10" : "border-hairline/15 hover:border-brass/60"
                  }`}
                >
                  {file ? (
                    <>
                      <p className="text-sm text-slate-50 break-all">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatBytes(file.size)} · click or drop another file to replace it</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-200">Drop a file here, or click to choose one</p>
                      <p className="text-xs text-slate-500 mt-1">
                        PDF, image (PNG, JPG, GIF, WebP, SVG) or exported HTML · up to {formatBytes(MAX_DASHBOARD_FILE_BYTES)}
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={DASHBOARD_FILE_ACCEPT}
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Uploaded files are kept in this browser only. From Tableau or Power BI, export the dashboard as PDF or PNG first.
                </p>
              </div>
            )}

            {error && <p className="text-sm text-signal-red">{error}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="text-sm px-4 py-2 rounded-md bg-brass text-midnight font-medium hover:bg-brass-light transition-colors disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save dashboard"}
              </button>
            </div>
          </form>
        )}

        {dashboards.length === 0 ? (
          <div className="bg-ink-800 border border-dashed border-hairline/15 rounded-lg px-6 py-12 text-center">
            <p className="text-slate-200 mb-1">No dashboards saved yet.</p>
            <p className="text-sm text-slate-500">
              Export the data from Overview, build a dashboard in your BI tool, then paste its embed link or upload an export here.
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
                        {d.source === "file" ? "File" : "Link"} · {d.createdBy} · {new Date(d.createdAt).toLocaleDateString()}
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

            {selected && <DashboardViewer key={selected.id} dashboard={selected} onDelete={() => handleDelete(selected)} />}
          </div>
        )}
      </main>
    </div>
  );
}

const smallButton =
  "text-xs px-3 py-1.5 rounded-md border border-hairline/15 text-slate-200 hover:border-brass hover:text-brass transition-colors";

function DashboardViewer({ dashboard: d, onDelete }: { dashboard: SavedDashboard; onDelete: () => void }) {
  const isFile = d.source === "file";
  const kind = isFile && d.file ? dashboardFileKind(d.file.name) : null;
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!isFile) return;
    let url: string | null = null;
    let cancelled = false;
    getDashboardFile(d.id)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) { setMissing(true); return; }
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch(() => { if (!cancelled) setMissing(true); });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [d.id, isFile]);

  const subtitle = isFile && d.file ? `${d.file.name} · ${formatBytes(d.file.size)}` : new URL(d.url).hostname;
  const frameClass = "w-full h-[70vh] min-h-[480px] bg-white";

  let body: ReactNode;
  if (!isFile) {
    body = <iframe src={d.url} title={d.title} className={frameClass} allowFullScreen referrerPolicy="no-referrer-when-downgrade" />;
  } else if (missing) {
    body = (
      <div className="min-h-[240px] flex items-center justify-center px-6 text-center">
        <p className="text-sm text-slate-500">This file isn't stored in this browser. It may have been uploaded on another computer or browser, or the browser data was cleared.</p>
      </div>
    );
  } else if (!blobUrl) {
    body = <div className="min-h-[240px] flex items-center justify-center"><p className="text-sm text-slate-500">Loading file…</p></div>;
  } else if (kind === "image") {
    body = (
      <div className="bg-white overflow-auto max-h-[80vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={blobUrl} alt={d.title} className="block mx-auto max-w-full h-auto" />
      </div>
    );
  } else if (kind === "html") {
    // Sandboxed without allow-same-origin: scripts in an exported chart still run,
    // but the page can't read this app's storage (sessions, employee data).
    body = <iframe src={blobUrl} title={d.title} className={frameClass} sandbox="allow-scripts allow-popups" />;
  } else {
    body = <iframe src={blobUrl} title={d.title} className={frameClass} />;
  }

  return (
    <section className="bg-ink-800 border border-hairline/10 rounded-lg overflow-hidden min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-hairline/10">
        <div className="min-w-0">
          <p className="text-slate-50 truncate">{d.title}</p>
          <p className="text-xs text-slate-500 truncate">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          {!isFile && (
            <a href={d.url} target="_blank" rel="noopener noreferrer" className={smallButton}>Open in new tab</a>
          )}
          {/* An HTML file opened from a blob: URL would run with this app's origin, so it is download-only. */}
          {isFile && blobUrl && kind !== "html" && (
            <a href={blobUrl} target="_blank" rel="noopener noreferrer" className={smallButton}>Open in new tab</a>
          )}
          {isFile && blobUrl && d.file && (
            <a href={blobUrl} download={d.file.name} className={smallButton}>Download</a>
          )}
          <button
            onClick={onDelete}
            className="text-xs px-3 py-1.5 rounded-md border border-hairline/15 text-slate-200 hover:border-signal-red hover:text-signal-red transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
      {body}
    </section>
  );
}
