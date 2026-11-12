"use client";

import { Department, EmailLogEntry, OceanScores, User } from "./types";

// =========================================================================
// DATA COMPONENT (DSS)
// -------------------------------------------------------------------------
// This is a MOCK persistence layer using the browser's localStorage so the
// prototype runs with zero backend/database setup. In a production build
// this module is the seam to swap for real API calls to a bank's HRIS /
// identity provider and a proper relational database (see README ER
// diagram: USERS, TEST_RESULTS, DEPARTMENTS, EMAIL_LOG).
// =========================================================================

// Renamed from mbti_dss_*: MBTI results can't be converted to OCEAN scores, so
// browsers holding the old data start again from the seed.
const USERS_KEY = "ocean_dss_users";
const SESSION_KEY = "ocean_dss_session";
const EMAIL_LOG_KEY = "ocean_dss_email_log";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// --- Seed data: mock banking-org employees for the Flow 2 company view ----
// Names are invented. Each scores object is copied from a row of
// data/employees_ocean_hr.csv; the trailing number is that row's employee_id.
const SEED_SCORES: Record<string, OceanScores> = {
  "u-1001": { O: 37, C: 27, E: 21, A: 40, N: 28 }, // 6
  "u-1002": { O: 49, C: 41, E: 45, A: 40, N: 37 }, // 939
  "u-1003": { O: 44, C: 36, E: 33, A: 48, N: 26 }, // 68
  "u-1004": { O: 38, C: 50, E: 42, A: 50, N: 22 }, // 970
  "u-1005": { O: 48, C: 39, E: 21, A: 30, N: 43 }, // 87
  "u-1006": { O: 42, C: 37, E: 24, A: 32, N: 40 }, // 3
  "u-1007": { O: 46, C: 38, E: 42, A: 40, N: 40 }, // 63
  "u-1008": { O: 49, C: 38, E: 35, A: 30, N: 24 }, // 1746
};

function seedEmployees(): User[] {
  const employees: User[] = [
    {
      id: "u-1001", name: "Aran Suksawat", username: "aran.suksawat", password: "password123",
      email: "aran.suksawat@siambankcorp.com", department: "Retail Banking", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: SEED_SCORES["u-1001"], completedAt: new Date().toISOString() },
    },
    {
      id: "u-1002", name: "Nutcha Boonmee", username: "nutcha.boonmee", password: "password123",
      email: "nutcha.boonmee@siambankcorp.com", department: "Corporate Banking", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: SEED_SCORES["u-1002"], completedAt: new Date().toISOString() },
    },
    {
      id: "u-1003", name: "Pim Charoensuk", username: "pim.charoensuk", password: "password123",
      email: "pim.charoensuk@siambankcorp.com", department: "Customer Service", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: SEED_SCORES["u-1003"], completedAt: new Date().toISOString() },
    },
    {
      id: "u-1004", name: "Somchai Rattanakul", username: "somchai.rattanakul", password: "password123",
      email: "somchai.rattanakul@siambankcorp.com", department: "Finance & Accounting", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: SEED_SCORES["u-1004"], completedAt: new Date().toISOString() },
    },
    {
      id: "u-1005", name: "Kanya Wattana", username: "kanya.wattana", password: "password123",
      email: "kanya.wattana@siambankcorp.com", department: "IT Support", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: SEED_SCORES["u-1005"], completedAt: new Date().toISOString() },
    },
    {
      id: "u-1006", name: "Nathan Wells", username: "nathan.wells", password: "password123",
      email: "nathan.wells@siambankcorp.com", department: "Corporate Banking", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: SEED_SCORES["u-1006"], completedAt: new Date().toISOString() },
    },
    {
      id: "u-1007", name: "Ploy Sirichai", username: "ploy.sirichai", password: "password123",
      email: "ploy.sirichai@siambankcorp.com", department: "Retail Banking", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: SEED_SCORES["u-1007"], completedAt: new Date().toISOString() },
    },
    {
      id: "u-1008", name: "David Chan", username: "david.chan", password: "password123",
      email: "david.chan@siambankcorp.com", department: "Finance & Accounting", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: SEED_SCORES["u-1008"], completedAt: new Date().toISOString() },
    },
    {
      id: "u-1009", name: "Warut Phetchara", username: "warut.phetchara", password: "password123",
      email: "warut.phetchara@siambankcorp.com", department: "Retail Banking", isHrFlow: false,
      createdAt: new Date().toISOString(),
      // no result yet -> demonstrates "test not completed" state in the company view
    },
  ];
  return employees;
}

function seedHrUsers(): User[] {
  return [
    {
      id: "u-2001", name: "Suda Anantasin (HR Executive)", username: "hr.suda", password: "hrpass123",
      email: "suda.anantasin@siambankcorp.com", department: "Human Resources", isHrFlow: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "u-2002", name: "Peter Lindqvist (CTO)", username: "cto.peter", password: "hrpass123",
      email: "peter.lindqvist@siambankcorp.com", department: "Chief Technology Officer", isHrFlow: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "u-2003", name: "Malee Jitpakdee (CEO)", username: "ceo.malee", password: "hrpass123",
      email: "malee.jitpakdee@siambankcorp.com", department: "Chief Executive Officer", isHrFlow: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "u-2004", name: "Nan Suriyawong (Engineering Manager)", username: "em.nan", password: "hrpass123",
      email: "nan.suriyawong@siambankcorp.com", department: "Engineering Manager", isHrFlow: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

export function ensureSeeded() {
  const existing = read<User[] | null>(USERS_KEY, null);
  if (!existing) {
    write(USERS_KEY, [...seedEmployees(), ...seedHrUsers()]);
  }
}

// --- Users ---------------------------------------------------------------
export function getAllUsers(): User[] {
  ensureSeeded();
  return read<User[]>(USERS_KEY, []);
}

export function saveUser(user: User) {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  write(USERS_KEY, users);
}

export function findByUsername(username: string): User | undefined {
  return getAllUsers().find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function createUser(input: {
  name: string; username: string; password: string; email: string; department: Department;
}): User {
  const isHrFlow =
    input.department === "Human Resources" ||
    input.department === "Engineering Manager" ||
    input.department === "Chief Technology Officer" ||
    input.department === "Chief Executive Officer";

  const user: User = {
    id: "u-" + Date.now(),
    name: input.name,
    username: input.username,
    password: input.password,
    email: input.email,
    department: input.department,
    isHrFlow,
    createdAt: new Date().toISOString(),
  };
  saveUser(user);
  return user;
}

// Changes a user's own username and/or password. The current password must match.
// Returns an error message, or null on success. A blank newPassword keeps the old one.
export function updateCredentials(
  userId: string,
  input: { currentPassword: string; newUsername: string; newPassword: string },
): string | null {
  const user = getAllUsers().find((u) => u.id === userId);
  if (!user) return "Your session has expired. Please sign in again.";
  if (input.currentPassword !== user.password) return "Current password is incorrect.";

  const username = input.newUsername.trim();
  if (!username) return "Username cannot be empty.";
  if (/\s/.test(username)) return "Username cannot contain spaces.";
  const taken = findByUsername(username);
  if (taken && taken.id !== user.id) return "That username is already taken.";

  if (input.newPassword && input.newPassword.length < 6) return "New password should be at least 6 characters.";
  if (username === user.username && (!input.newPassword || input.newPassword === user.password)) {
    return "Nothing to change. Enter a new username or a new password.";
  }

  saveUser({ ...user, username, password: input.newPassword || user.password });
  return null;
}

// --- Session ---------------------------------------------------------------
export function setSession(userId: string) {
  write(SESSION_KEY, { userId });
}

export function getSessionUser(): User | undefined {
  const s = read<{ userId: string } | null>(SESSION_KEY, null);
  if (!s) return undefined;
  return getAllUsers().find((u) => u.id === s.userId);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

// --- Email log (mock outbound email for Flow 2 follow-up) -----------------
export function logEmail(entry: EmailLogEntry) {
  const log = read<EmailLogEntry[]>(EMAIL_LOG_KEY, []);
  log.unshift(entry);
  write(EMAIL_LOG_KEY, log);
}

export function getEmailLog(): EmailLogEntry[] {
  return read<EmailLogEntry[]>(EMAIL_LOG_KEY, []);
}

export function resetAllMockData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USERS_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(EMAIL_LOG_KEY);
  ensureSeeded();
}
