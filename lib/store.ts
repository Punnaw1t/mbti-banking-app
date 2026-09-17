"use client";

import { Department, EmailLogEntry, User } from "./types";

// =========================================================================
// DATA COMPONENT (DSS)
// -------------------------------------------------------------------------
// This is a MOCK persistence layer using the browser's localStorage so the
// prototype runs with zero backend/database setup. In a production build
// this module is the seam to swap for real API calls to a bank's HRIS /
// identity provider and a proper relational database (see README ER
// diagram: USERS, TEST_RESULTS, DEPARTMENTS, EMAIL_LOG).
// =========================================================================

const USERS_KEY = "mbti_dss_users";
const SESSION_KEY = "mbti_dss_session";
const EMAIL_LOG_KEY = "mbti_dss_email_log";

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
function seedEmployees(): User[] {
  const rows: Array<[string, string, Department, string | undefined]> = [
    ["Aran Suksawat", "aran.suksawat", "Retail Banking", "ISTJ"],
    ["Nutcha Boonmee", "nutcha.boonmee", "Corporate Banking", "ENTJ"],
    ["Pim Charoensuk", "pim.charoensuk", "Customer Service", "ESFJ"],
    ["Somchai Rattanakul", "somchai.rattanakul", "Finance & Accounting", "ISTJ"],
    ["Kanya Wattana", "kanya.wattana", "IT Support", "ISTP"],
    ["Nathan Wells", "nathan.wells", "Corporate Banking", "ESTJ"],
    ["Ploy Sirichai", "ploy.sirichai", "Retail Banking", "ESFP"],
    ["David Chan", "david.chan", "Finance & Accounting", "INTJ"],
    ["Warut Phetchara", "warut.phetchara", undefined as unknown as Department, undefined],
  ];

  const employees: User[] = [
    {
      id: "u-1001", name: "Aran Suksawat", username: "aran.suksawat", password: "password123",
      email: "aran.suksawat@siambankcorp.com", department: "Retail Banking", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: { E: 2, I: 4, S: 6, N: 0, T: 5, F: 1, J: 6, P: 0 }, mbtiType: "ISTJ", completedAt: new Date().toISOString() },
    },
    {
      id: "u-1002", name: "Nutcha Boonmee", username: "nutcha.boonmee", password: "password123",
      email: "nutcha.boonmee@siambankcorp.com", department: "Corporate Banking", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: { E: 5, I: 1, S: 1, N: 5, T: 6, F: 0, J: 5, P: 1 }, mbtiType: "ENTJ", completedAt: new Date().toISOString() },
    },
    {
      id: "u-1003", name: "Pim Charoensuk", username: "pim.charoensuk", password: "password123",
      email: "pim.charoensuk@siambankcorp.com", department: "Customer Service", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: { E: 4, I: 2, S: 5, N: 1, T: 1, F: 5, J: 4, P: 2 }, mbtiType: "ESFJ", completedAt: new Date().toISOString() },
    },
    {
      id: "u-1004", name: "Somchai Rattanakul", username: "somchai.rattanakul", password: "password123",
      email: "somchai.rattanakul@siambankcorp.com", department: "Finance & Accounting", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: { E: 1, I: 5, S: 6, N: 0, T: 5, F: 1, J: 6, P: 0 }, mbtiType: "ISTJ", completedAt: new Date().toISOString() },
    },
    {
      id: "u-1005", name: "Kanya Wattana", username: "kanya.wattana", password: "password123",
      email: "kanya.wattana@siambankcorp.com", department: "IT Support", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: { E: 1, I: 5, S: 5, N: 1, T: 5, F: 1, J: 1, P: 5 }, mbtiType: "ISTP", completedAt: new Date().toISOString() },
    },
    {
      id: "u-1006", name: "Nathan Wells", username: "nathan.wells", password: "password123",
      email: "nathan.wells@siambankcorp.com", department: "Corporate Banking", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: { E: 5, I: 1, S: 5, N: 1, T: 6, F: 0, J: 6, P: 0 }, mbtiType: "ESTJ", completedAt: new Date().toISOString() },
    },
    {
      id: "u-1007", name: "Ploy Sirichai", username: "ploy.sirichai", password: "password123",
      email: "ploy.sirichai@siambankcorp.com", department: "Retail Banking", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: { E: 5, I: 1, S: 5, N: 1, T: 1, F: 5, J: 1, P: 5 }, mbtiType: "ESFP", completedAt: new Date().toISOString() },
    },
    {
      id: "u-1008", name: "David Chan", username: "david.chan", password: "password123",
      email: "david.chan@siambankcorp.com", department: "Finance & Accounting", isHrFlow: false,
      createdAt: new Date().toISOString(),
      result: { scores: { E: 1, I: 5, S: 0, N: 6, T: 6, F: 0, J: 5, P: 1 }, mbtiType: "INTJ", completedAt: new Date().toISOString() },
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
