"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllUsers, getSessionUser, logEmail, getEmailLog } from "@/lib/store";
import { User, EmailLogEntry } from "@/lib/types";
import TopBar from "@/components/TopBar";
import ArchetypeBadge from "@/components/ArchetypeBadge";
import ArchetypeAvatar from "@/components/ArchetypeAvatar";
import SendEmailModal from "@/components/SendEmailModal";

const DEPT_FILTERS = [
  "All departments", "Retail Banking", "Corporate Banking", "Customer Service",
  "Finance & Accounting", "IT Support",
];

export default function CompanyPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | undefined>();
  const [employees, setEmployees] = useState<User[]>([]);
  const [deptFilter, setDeptFilter] = useState("All departments");
  const [executiveOnly, setExecutiveOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");
  const [target, setTarget] = useState<User | null>(null);
  const [log, setLog] = useState<EmailLogEntry[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const u = getSessionUser();
    if (!u) { router.replace("/login"); return; }
    if (!u.isHrFlow) { router.replace("/dashboard"); return; }
    setMe(u);
    refresh();
  }, [router]);

  function refresh() {
    const all = getAllUsers().filter((u) => !u.isHrFlow);
    setEmployees(all);
    setLog(getEmailLog());
  }

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (deptFilter !== "All departments" && e.department !== deptFilter) return false;
      if (executiveOnly && !e.result?.archetype.executiveFit) return false;
      if (statusFilter === "completed" && !e.result) return false;
      if (statusFilter === "pending" && e.result) return false;
      return true;
    });
  }, [employees, deptFilter, executiveOnly, statusFilter]);

  const stats = useMemo(() => {
    const completed = employees.filter((e) => e.result).length;
    const executiveFit = employees.filter((e) => e.result?.archetype.executiveFit).length;
    return { total: employees.length, completed, pending: employees.length - completed, executiveFit };
  }, [employees]);

  function handleSend(subject: string, body: string) {
    if (!target || !me) return;
    logEmail({
      id: "e-" + Date.now(),
      toUserId: target.id,
      toEmail: target.email,
      subject,
      body,
      sentAt: new Date().toISOString(),
      sentBy: me.name,
    });
    setTarget(null);
    setToast(`Email sent to ${target.name} (mock — no real message was dispatched).`);
    refresh();
    setTimeout(() => setToast(null), 4000);
  }

  if (!me) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-400 text-sm">Loading company view…</p></div>;
  }

  return (
    <div className="min-h-screen">
      <TopBar user={me} tag="Company Decision-Style Oversight" />

      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-10 sm:py-14">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-brass mb-2">HR Executive · Recruitment &amp; Talent Review</p>
          <h1 className="font-display text-3xl text-slate-50">Company MBTI Overview</h1>
          <p className="text-slate-400 text-sm mt-1">
            Review decision-making personality and style across candidates for upper-management roles, and follow up
            with employees directly.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Employees" value={stats.total} />
          <StatCard label="Assessed" value={stats.completed} />
          <StatCard label="Pending" value={stats.pending} accent="amber" />
          <StatCard label="Executive-fit types" value={stats.executiveFit} accent="brass" />
        </div>

        <div className="flex flex-wrap gap-3 mb-5">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-md bg-ink-800 border border-hairline/10 px-3 py-2 text-sm text-slate-50 focus:border-brass outline-none"
          >
            {DEPT_FILTERS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-md bg-ink-800 border border-hairline/10 px-3 py-2 text-sm text-slate-50 focus:border-brass outline-none"
          >
            <option value="all">All statuses</option>
            <option value="completed">Assessment completed</option>
            <option value="pending">Assessment pending</option>
          </select>

          <label className="flex items-center gap-2 rounded-md bg-ink-800 border border-hairline/10 px-3 py-2 text-sm text-slate-200 cursor-pointer">
            <input type="checkbox" checked={executiveOnly} onChange={(e) => setExecutiveOnly(e.target.checked)} />
            Executive-fit archetypes only
          </label>
        </div>

        <div className="bg-ink-800 border border-hairline/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-hairline/10">
                  <th className="px-5 py-3 font-normal">Employee</th>
                  <th className="px-5 py-3 font-normal">Department</th>
                  <th className="px-5 py-3 font-normal">MBTI &amp; archetype</th>
                  <th className="px-5 py-3 font-normal">Status</th>
                  <th className="px-5 py-3 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="border-b border-hairline/5 last:border-0">
                    <td className="px-5 py-4">
                      <p className="text-slate-50">{emp.name}</p>
                      <p className="text-xs text-slate-500">{emp.email}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{emp.department}</td>
                    <td className="px-5 py-4">
                      {emp.result ? (
                        <div className="flex items-center gap-2">
                          <ArchetypeAvatar archetype={emp.result.archetype} size="sm" />
                          <ArchetypeBadge archetype={emp.result.archetype} size="sm" />
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">Not assessed</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {emp.result ? (
                        <span className="text-signal-green text-xs">Completed</span>
                      ) : (
                        <span className="text-signal-amber text-xs">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setTarget(emp)}
                        className="text-xs px-3 py-1.5 rounded-md border border-hairline/15 text-slate-200 hover:border-brass hover:text-brass transition-colors"
                      >
                        {emp.result ? "Send follow-up" : "Send reminder"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500 text-sm">No employees match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {log.length > 0 && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Recent outbound emails (mock log)</p>
            <div className="space-y-2">
              {log.slice(0, 5).map((entry) => (
                <div key={entry.id} className="bg-ink-800 border border-hairline/10 rounded-md px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-slate-200">{entry.subject} <span className="text-slate-500">→ {entry.toEmail}</span></span>
                  <span className="text-xs text-slate-500">{new Date(entry.sentAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {target && (
        <SendEmailModal
          target={target}
          fromName={me.name}
          onClose={() => setTarget(null)}
          onSend={handleSend}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink-700 border border-brass/40 text-slate-50 text-sm px-5 py-3 rounded-md shadow-panel">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: "amber" | "brass" }) {
  const color = accent === "amber" ? "text-signal-amber" : accent === "brass" ? "text-brass" : "text-slate-50";
  return (
    <div className="bg-ink-800 border border-hairline/10 rounded-lg p-4 sm:p-5">
      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1.5">{label}</p>
      <p className={`font-display text-2xl sm:text-3xl ${color}`}>{value}</p>
    </div>
  );
}
