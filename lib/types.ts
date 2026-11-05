// Core domain types for the OCEAN Executive Decision-Support System (DSS)
// Domain: Banking Company — HR Executive support tool for
// upper-management recruitment & internal talent decision-style mapping.

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

// Departments that are routed to Flow 2 (company-wide OCEAN oversight / recruitment support)
export const HR_ACCESS_DEPARTMENTS: Department[] = [
  "Human Resources",
  "Engineering Manager",
  "Chief Technology Officer",
  "Chief Executive Officer",
];

export function hasHrAccess(dept: Department): boolean {
  return HR_ACCESS_DEPARTMENTS.includes(dept);
}

// Business departments (as opposed to Flow 2 oversight roles) shown in the Company OCEAN Overview.
export const BUSINESS_DEPARTMENTS: Department[] = [
  "Retail Banking",
  "Corporate Banking",
  "Customer Service",
  "Finance & Accounting",
  "IT Support",
];

// Which business departments each Flow 2 role is scoped to see in the Company OCEAN Overview.
// A role not listed here (HR, CEO) has unrestricted visibility across all business departments.
const ROLE_DEPARTMENT_SCOPE: Partial<Record<Department, Department[]>> = {
  "Chief Technology Officer": ["IT Support"],
  "Engineering Manager": ["Retail Banking", "Corporate Banking", "Customer Service", "Finance & Accounting"],
};

export function getViewableDepartments(role: Department): Department[] | "all" {
  return ROLE_DEPARTMENT_SCOPE[role] ?? "all";
}

export type OceanTrait = "O" | "C" | "E" | "A" | "N";

// Raw trait totals: 10 items each on a 1–5 scale, so every value is 10–50.
export type OceanScores = Record<OceanTrait, number>;

// 1 = Disagree, 3 = Neutral, 5 = Agree — the IPIP-50 response scale.
export type LikertAnswer = 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: number;
  trait: OceanTrait;
  prompt: string;
  reverse: boolean; // scored as 6 - answer
}

// E, C, O and A are the trait itself; S is low Neuroticism (emotional
// stability); B is the balanced profile, where no trait stands out.
export type ProfileCode = "E" | "C" | "S" | "O" | "A" | "B";

export interface DecisionProfile {
  code: ProfileCode;
  name: string;                // e.g. "The Steward"
  decisionStyle: string;       // short label used on dashboards
  decisionStyleDetail: string; // one sentence elaborating on the label
  description: string;
}

export interface TestResult {
  scores: OceanScores;
  // Percentiles, the decision profile and executive fit are intentionally NOT
  // stored here — they're derived live from scores via lib/ocean.ts. Storing a
  // snapshot would go stale whenever the norms or rules change.
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
