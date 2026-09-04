// Core domain types for the MBTI Executive Decision-Support System (DSS)
// Domain: Banking Company — HR Executive support tool for
// upper-management recruitment & internal talent decision-style mapping.

export type Trait = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

export type Department =
  | "Retail Banking"
  | "Corporate Banking"
  | "Customer Service"
  | "Finance & Accounting"
  | "IT Support"
  | "Human Resources"
  | "Engineering Manager"
  | "Product Owner"
  | "Chief Technology Officer"
  | "Risk/Compliance Officer";

// Departments that are routed to Flow 2 (company-wide MBTI oversight / recruitment support)
export const HR_ACCESS_DEPARTMENTS: Department[] = [
  "Human Resources",
  "Engineering Manager",
  "Product Owner",
  "Chief Technology Officer",
  "Risk/Compliance Officer",
];

export function hasHrAccess(dept: Department): boolean {
  return HR_ACCESS_DEPARTMENTS.includes(dept);
}

export interface Scores {
  E: number;
  I: number;
  S: number;
  N: number;
  T: number;
  F: number;
  J: number;
  P: number;
}

export interface Question {
  id: number;
  // Which dichotomy this placeholder question measures
  dichotomy: "EI" | "SN" | "TF" | "JP";
  prompt: string;
  optionA: { label: string; trait: Trait };
  optionB: { label: string; trait: Trait };
}

export type MbtiCode =
  | "ISTJ" | "ISFJ" | "INFJ" | "INTJ"
  | "ISTP" | "ISFP" | "INFP" | "INTP"
  | "ESTP" | "ESFP" | "ENFP" | "ENTP"
  | "ESTJ" | "ESFJ" | "ENFJ" | "ENTJ";

export interface Archetype {
  code: MbtiCode;
  name: string;          // e.g. "Commander"
  group: "Analyst" | "Diplomat" | "Sentinel" | "Explorer";
  decisionStyle: string; // short label used on dashboards
  description: string;
  executiveFit: boolean; // highlighted as a core upper-management archetype
}

export interface TestResult {
  scores: Scores;
  mbtiType: MbtiCode;
  archetype: Archetype;
  completedAt: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string; // mock-only, plaintext for prototype purposes
  email: string;
  department: Department;
  isHrFlow: boolean;
  result?: TestResult;
  createdAt: string;
}

export interface EmailLogEntry {
  id: string;
  toUserId: string;
  toEmail: string;
  subject: string;
  body: string;
  sentAt: string;
  sentBy: string;
}
