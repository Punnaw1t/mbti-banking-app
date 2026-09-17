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
  | "Chief Technology Officer"
  | "Chief Executive Officer";

// Departments that are routed to Flow 2 (company-wide MBTI oversight / recruitment support)
export const HR_ACCESS_DEPARTMENTS: Department[] = [
  "Human Resources",
  "Engineering Manager",
  "Chief Technology Officer",
  "Chief Executive Officer",
];

export function hasHrAccess(dept: Department): boolean {
  return HR_ACCESS_DEPARTMENTS.includes(dept);
}

// Business departments (as opposed to Flow 2 oversight roles) shown in the Company MBTI Overview.
export const BUSINESS_DEPARTMENTS: Department[] = [
  "Retail Banking",
  "Corporate Banking",
  "Customer Service",
  "Finance & Accounting",
  "IT Support",
];

// Which business departments each Flow 2 role is scoped to see in the Company MBTI Overview.
// A role not listed here (HR, CEO) has unrestricted visibility across all business departments.
const ROLE_DEPARTMENT_SCOPE: Partial<Record<Department, Department[]>> = {
  "Chief Technology Officer": ["IT Support"],
  "Engineering Manager": ["Retail Banking", "Corporate Banking", "Customer Service", "Finance & Accounting"],
};

export function getViewableDepartments(role: Department): Department[] | "all" {
  return ROLE_DEPARTMENT_SCOPE[role] ?? "all";
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

export type MbtiGroup = "Analyst" | "Diplomat" | "Sentinel" | "Explorer";

export interface Archetype {
  code: MbtiCode;
  name: string;          // e.g. "Commander"
  group: MbtiGroup;
  decisionStyle: string;       // short label used on dashboards
  decisionStyleDetail: string; // one sentence elaborating on the label
  description: string;
  executiveFit: boolean; // highlighted as a core upper-management archetype
  icon: string;          // path to the archetype's SVG icon (public/mbti-icons/*.svg)
}

export interface TestResult {
  scores: Scores;
  mbtiType: MbtiCode;
  // Archetype is intentionally NOT stored here — it's derived live from
  // mbtiType via getArchetype() everywhere it's needed. Storing a snapshot
  // would go stale whenever archetypeRules changes (e.g. a new icon), even
  // for results that were saved long before the change.
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
