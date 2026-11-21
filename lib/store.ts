"use client";

import { Department, EmailLogEntry, OceanScores, SavedDashboard, User } from "./types";
import { clearDashboardFiles } from "./dashboardFiles";

// =========================================================================
// DATA COMPONENT (DSS) — client side
// -------------------------------------------------------------------------
// Thin wrapper over the app's API routes (app/api/*), which read and write
// the Postgres database (docker-compose.yml, schema in db/init/). The signed-in
// session lives in an httpOnly cookie, so nothing about the user is kept in
// localStorage any more.
// =========================================================================

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Can't reach the Meridian server.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? `Request failed (${res.status}).`, res.status);
  return data as T;
}

// --- Auth / session ----------------------------------------------------------
export async function login(input: { username: string; password: string; department: Department }): Promise<User> {
  const { user } = await api<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(input) });
  return user;
}

export async function register(input: {
  name: string; username: string; password: string; email: string; department: Department;
}): Promise<User> {
  const { user } = await api<{ user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(input) });
  return user;
}

export async function logout(): Promise<void> {
  await api("/api/auth/logout", { method: "POST" }).catch(() => {});
}

export async function getSessionUser(): Promise<User | undefined> {
  const { user } = await api<{ user: User | null }>("/api/session");
  return user ?? undefined;
}

// Changes the signed-in user's username and/or password. Returns an error
// message, or null on success. A blank newPassword keeps the old one.
export async function updateCredentials(input: {
  currentPassword: string; newUsername: string; newPassword: string;
}): Promise<string | null> {
  try {
    await api("/api/account", { method: "PATCH", body: JSON.stringify(input) });
    return null;
  } catch (err) {
    return (err as Error).message;
  }
}

// --- Assessment ----------------------------------------------------------------
export async function saveResult(scores: OceanScores): Promise<User> {
  const { user } = await api<{ user: User }>("/api/me/result", { method: "PUT", body: JSON.stringify({ scores }) });
  return user;
}

// --- Company view (Flow 2) --------------------------------------------------
// Already filtered server-side to the departments the signed-in role may see.
export async function getEmployees(): Promise<User[]> {
  const { users } = await api<{ users: User[] }>("/api/users");
  return users;
}

export async function logEmail(input: { toUserId: string; subject: string; body: string }): Promise<EmailLogEntry> {
  const { email } = await api<{ email: EmailLogEntry }>("/api/emails", { method: "POST", body: JSON.stringify(input) });
  return email;
}

export async function getEmailLog(): Promise<EmailLogEntry[]> {
  const { emails } = await api<{ emails: EmailLogEntry[] }>("/api/emails");
  return emails;
}

// --- Saved BI dashboards (Company > Dashboards page) -----------------------
export async function getDashboards(): Promise<SavedDashboard[]> {
  const { dashboards } = await api<{ dashboards: SavedDashboard[] }>("/api/dashboards");
  return dashboards;
}

export async function saveDashboard(entry: SavedDashboard): Promise<void> {
  await api("/api/dashboards", { method: "POST", body: JSON.stringify(entry) });
}

export async function deleteDashboard(id: string): Promise<void> {
  await api(`/api/dashboards/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// --- Demo -------------------------------------------------------------------
export async function resetAllMockData(): Promise<void> {
  await api("/api/demo/reset", { method: "POST" });
  clearDashboardFiles().catch(() => {});
}
