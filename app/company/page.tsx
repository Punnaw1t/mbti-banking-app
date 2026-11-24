"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getEmployees, getSessionUser, logEmail, getEmailLog } from "@/lib/store";
import { User, EmailLogEntry, BUSINESS_DEPARTMENTS, getViewableDepartments } from "@/lib/types";
import { buildEmployeeCsv, downloadCsv } from "@/lib/csv";
import { buildFollowUpEmail, buildMailtoHref } from "@/lib/email";
import { isExecutiveFit, percentiles } from "@/lib/ocean";
import TopBar from "@/components/TopBar";
import { OceanRadarMini } from "@/components/OceanRadar";
import ProfileBadge from "@/components/ProfileBadge";
import EmployeeDetailModal from "@/components/EmployeeDetailModal";
import HrChatbot from "@/components/HrChatbot";

export default function CompanyPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | undefined>();
  const [employees, setEmployees] = useState<User[]>([]);
  const [deptFilter, setDeptFilter] = useState("All departments");
  const [nameQuery, setNameQuery] = useState("");
  const [executiveOnly, setExecutiveOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");
  const [log, setLog] = useState<EmailLogEntry[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [viewing, setViewing] = useState<User | null>(null);

  useEffect(() => {
    getSessionUser().then((u) => {
      if (!u) { router.replace("/login"); return; }
      if (!u.isHrFlow) { router.replace("/dashboard"); return; }
      setMe(u);
      refresh();
    }).catch(() => router.replace("/login"));
  }, [router]);

  async function refresh() {
    try {
      const [all, emails] = await Promise.all([getEmployees(), getEmailLog()]);
      setEmployees(all);
      setLog(emails);
    } catch (err) {
      flash((err as Error).message);
    }
  }

  function flash(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }

  // Departments this signed-in role is permitted to see: HR/CEO see everything,
  // CTO is scoped to IT Support, Engineering Manager to the non-IT business departments.
  const scope = useMemo(() => (me ? getViewableDepartments(me.department) : "all"), [me]);

  const scopedEmployees = useMemo(() => {
    if (scope === "all") return employees;
    return employees.filter((e) => scope.includes(e.department));
  }, [employees, scope]);

  const deptOptions = useMemo(() => {
    const depts = scope === "all" ? BUSINESS_DEPARTMENTS : scope;
    return ["All departments", ...depts];
  }, [scope]);

  const filtered = useMemo(() => {
    const query = nameQuery.trim().toLowerCase();
    return scopedEmployees.filter((e) => {
      if (query && !e.name.toLowerCase().includes(query)) return false;
      if (deptFilter !== "All departments" && e.department !== deptFilter) return false;
      if (executiveOnly && !(e.result && isExecutiveFit(e.result.scores))) return false;
      if (statusFilter === "completed" && !e.result) return false;
      if (statusFilter === "pending" && e.result) return false;
      return true;
    });
  }, [scopedEmployees, nameQuery, deptFilter, executiveOnly, statusFilter]);

  const stats = useMemo(() => {
    const completed = scopedEmployees.filter((e) => e.result).length;
    const executiveFit = scopedEmployees.filter((e) => e.result && isExecutiveFit(e.result.scores)).length;
    return { total: scopedEmployees.length, completed, pending: scopedEmployees.length - completed, executiveFit };
  }, [scopedEmployees]);

  const botContext = useMemo(
    () => (me ? { viewer: me, employees: scopedEmployees, scope } : null),
    [me, scopedEmployees, scope],
  );

  function handleExportCsv() {
    const csv = buildEmployeeCsv(filtered);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`meridian-decision-style-summary-${date}.csv`, csv);
  }

  function handleFollowUpClick(target: User) {
    if (!me) return;
    const { subject, body } = buildFollowUpEmail(target, me.name);
    flash(`Opening your email client to message ${target.name}…`);
    logEmail({ toUserId: target.id, subject, body })
      .then(() => refresh())
      .catch((err) => flash(`Couldn't log the email: ${(err as Error).message}`));
  }

  if (!me) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-400 text-sm">Loading company view…</p></div>;
  }

  return (
    <div className="min-h-screen">
      <TopBar user={me} tag="Company Decision-Style Oversight" boldTag />

      <main className="mx-auto max-w-6xl px-4 sm:px-8 pt-8 sm:pt-14 pb-28">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brass mb-2">HR Executive · Recruitment &amp; Talent Review</p>
            <h1 className="font-display text-2xl sm:text-3xl text-slate-50">Company OCEAN Overview</h1>
            <p className="text-slate-400 text-sm mt-1">
              Review decision-making personality and style across candidates for upper-management roles, and follow up
              with employees directly.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Viewing as <span className="text-slate-300">{me.department}</span> ·{" "}
              {scope === "all" ? "all departments" : scope.join(", ")}
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            className="w-full sm:w-auto text-sm px-4 py-2.5 rounded-md bg-brass text-midnight font-medium hover:bg-brass-light transition-colors self-start whitespace-nowrap"
          >
            Export for Visualize
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard label="Employees" value={stats.total} />
          <StatCard label="Assessed" value={stats.completed} />
          <StatCard label="Pending" value={stats.pending} accent="amber" />
          <StatCard label="Executive-fit profiles" value={stats.executiveFit} accent="brass" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 mb-5">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-md bg-ink-800 border border-hairline/10 px-3 py-2 text-sm text-slate-50 focus:border-brass outline-none"
          >
            {deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}
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
            Executive-fit profiles only
          </label>

          <input
            type="text"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="Search employee name…"
            className="lg:min-w-[220px] rounded-md bg-ink-800 border border-hairline/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-brass outline-none"
          />
        </div>
        <p className="text-xs text-slate-500 -mt-3 mb-5">
          "Export CSV" downloads the {filtered.length} employee{filtered.length === 1 ? "" : "s"} matching the filters above.
        </p>

        {/* Phones and portrait tablets: one card per employee. */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              role="button"
              tabIndex={0}
              onClick={() => setViewing(emp)}
              onKeyDown={(e) => { if (e.key === "Enter") setViewing(emp); }}
              className="bg-ink-800 border border-hairline/10 rounded-lg p-4 cursor-pointer active:bg-hairline/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-slate-50 truncate">{emp.name}</p>
                  <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                  <p className="text-xs text-slate-300 [html.light_&]:text-black mt-1">{emp.department}</p>
                </div>
                {emp.result ? (
                  <span className="text-signal-green text-xs shrink-0">Completed</span>
                ) : (
                  <span className="text-signal-amber text-xs shrink-0">Pending</span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                {emp.result ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <OceanRadarMini percentiles={percentiles(emp.result.scores)} />
                    <ProfileBadge scores={emp.result.scores} size="sm" />
                  </div>
                ) : (
                  <span className="text-slate-600 text-xs">Not assessed</span>
                )}
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                  <FollowUpLink employee={emp} fromName={me.name} onClick={() => handleFollowUpClick(emp)} />
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="md:col-span-2 bg-ink-800 border border-hairline/10 rounded-lg px-5 py-8 text-center text-slate-500 text-sm">No employees match these filters.</p>
          )}
        </div>

        <div className="hidden lg:block bg-ink-800 border border-hairline/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-hairline/10">
                  <th className="px-5 py-3 font-normal">Employee</th>
                  <th className="px-5 py-3 font-normal">Department</th>
                  <th className="px-5 py-3 font-normal">OCEAN profile</th>
                  <th className="px-5 py-3 font-normal">Status</th>
                  <th className="px-5 py-3 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => setViewing(emp)}
                    className="border-b border-hairline/5 last:border-0 cursor-pointer hover:bg-hairline/5 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="text-slate-50">{emp.name}</p>
                      <p className="text-xs text-slate-500">{emp.email}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-300 [html.light_&]:text-black">{emp.department}</td>
                    <td className="px-5 py-4">
                      {emp.result ? (
                        <div className="flex items-center gap-2">
                          <OceanRadarMini percentiles={percentiles(emp.result.scores)} />
                          <ProfileBadge scores={emp.result.scores} size="sm" />
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
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <FollowUpLink employee={emp} fromName={me.name} onClick={() => handleFollowUpClick(emp)} />
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
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Recent follow-ups (opened in your email client)</p>
            <div className="space-y-2">
              {log.slice(0, 5).map((entry) => (
                <div key={entry.id} className="bg-ink-800 border border-hairline/10 rounded-md px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-slate-200 min-w-0 break-words">{entry.subject} <span className="text-slate-500 break-all">→ {entry.toEmail}</span></span>
                  <span className="text-xs text-slate-500 shrink-0">{new Date(entry.sentAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {viewing && <EmployeeDetailModal employee={viewing} onClose={() => setViewing(null)} />}

      {botContext && <HrChatbot context={botContext} />}

      {toast && (
        <div className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 text-center bg-ink-700 border border-brass/40 text-slate-50 text-sm px-5 py-3 rounded-md shadow-panel">
          {toast}
        </div>
      )}
    </div>
  );
}

function FollowUpLink({
  employee,
  fromName,
  onClick,
}: {
  employee: User;
  fromName: string;
  onClick: () => void;
}) {
  const { subject, body } = buildFollowUpEmail(employee, fromName);
  return (
    <a
      href={buildMailtoHref(employee.email, subject, body)}
      onClick={onClick}
      className="inline-block whitespace-nowrap text-xs px-3 py-1.5 rounded-md border border-hairline/15 text-slate-200 hover:border-brass hover:text-brass transition-colors"
    >
      {employee.result ? "Send follow-up" : "Send reminder"}
    </a>
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
