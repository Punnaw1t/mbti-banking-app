# Meridian — MBTI Executive Decision-Support System (DSS)

**Business domain:** Banking (Siam Bank Corp, fictional) — Retail Banking, Corporate Banking,
Customer Service, Finance & Accounting, IT, Human Resources, Engineering, Product, and
Executive/Risk functions.

**Purpose:** A mock-up prototype that helps an **HR Executive** use MBTI temperament results to
understand the decision-making personality and style of candidates being considered for
**upper-management roles**, and to manage follow-up communication with staff.

Stack: **Next.js 14 (App Router) + TypeScript + Tailwind CSS**, fully responsive, mock
localStorage-backed data layer (no external DB/API needed to run the prototype).

---

## 1. Application flows

**Flow 1 — Individual assessment (normal employees)**
```
Register → Login → MBTI Test → Result → Dashboard
```

**Flow 2 — HR / management oversight**
```
Login → Company MBTI Overview (all staff) → Send email follow-up
```

**Routing rule at Login** (also enforced at Register):
- Department = *Human Resources, Engineering Manager, Product Owner,
  Chief Technology Officer, Risk/Compliance Officer* → **Flow 2**
- Any other department → **Flow 1**

---

## 2. DSS architecture (Data / Model / Knowledge / Interface)

```
┌───────────────────────────────────────────────────────────────────────┐
│                          INTERFACE COMPONENT                          │
│   Next.js pages: /login /register /mbti-test /result /dashboard       │
│   /company   +   shared components (TopBar, ArchetypeBadge, Modal)    │
└───────────────▲───────────────────────────────────────▲───────────────┘
                │                                        │
┌───────────────┴───────────────┐        ┌───────────────┴───────────────┐
│         MODEL COMPONENT        │        │       KNOWLEDGE COMPONENT      │
│ lib/mbti.ts                    │        │ lib/mbti.ts — archetypeRules   │
│  • scoreAnswers()               │        │  IF-THEN production rules      │
│  • typeFromScores()             │        │  mapping MBTI code →           │
│  • dichotomyPercents()          │        │  decision-maker archetype      │
└───────────────▲───────────────┘        └───────────────▲───────────────┘
                │                                        │
                └───────────────────┬────────────────────┘
                                     │
                        ┌────────────┴────────────┐
                        │      DATA COMPONENT      │
                        │ lib/store.ts             │
                        │  Users, Test Results,    │
                        │  Email Log (localStorage │
                        │  mock; swap for a real   │
                        │  DB/API in production)   │
                        └──────────────────────────┘
```

---

## 3. Structure chart

```mermaid
flowchart TB
  A[Meridian DSS] --> B[Interface Module]
  A --> C[Model Module]
  A --> D[Knowledge Module]
  A --> E[Data Module]

  B --> B1[Auth Screens<br/>Login / Register]
  B --> B2[Assessment Screen<br/>MBTI Test]
  B --> B3[Result Screen]
  B --> B4[Employee Dashboard]
  B --> B5[Company Oversight Screen]
  B --> B6[Send-Email Modal]

  C --> C1[scoreAnswers]
  C --> C2[typeFromScores]
  C --> C3[dichotomyPercents]

  D --> D1[archetypeRules<br/>IF-THEN table]
  D --> D2[getArchetype]

  E --> E1[User records]
  E --> E2[Test Result records]
  E --> E3[Email Log records]
```

---

## 4. Use case diagram

```mermaid
flowchart LR
  Employee((Employee))
  HR((HR Executive))
  Mgr((Engineering Manager /<br/>Product Owner / CTO /<br/>Risk-Compliance Officer))

  subgraph Meridian DSS
    UC1([Register account])
    UC2([Log in])
    UC3([Take MBTI test])
    UC4([View own result])
    UC5([View personal dashboard])
    UC6([View company MBTI overview])
    UC7([Filter staff by dept / archetype])
    UC8([Send follow-up email])
    UC9([Identify executive-fit candidates])
  end

  Employee --> UC1
  Employee --> UC2
  Employee --> UC3
  Employee --> UC4
  Employee --> UC5

  HR --> UC2
  HR --> UC6
  HR --> UC7
  HR --> UC8
  HR --> UC9

  Mgr --> UC2
  Mgr --> UC6
  Mgr --> UC7
  Mgr --> UC8
  Mgr --> UC9

  UC3 -.include.-> UC4
  UC8 -.include.-> UC6
```

---

## 5. ER diagram (database design)

The prototype stores this shape in `localStorage`; the same schema maps directly onto
relational tables for a production build.

```mermaid
erDiagram
  DEPARTMENT ||--o{ USER : "employs"
  USER ||--o| TEST_RESULT : "has"
  TEST_RESULT }o--|| ARCHETYPE : "classified as"
  USER ||--o{ EMAIL_LOG : "receives"
  HR_USER ||--o{ EMAIL_LOG : "sends"

  DEPARTMENT {
    string department_name PK
    boolean is_hr_flow
  }
  USER {
    string id PK
    string name
    string username
    string email
    string password
    string department_name FK
    datetime created_at
  }
  TEST_RESULT {
    string id PK
    string user_id FK
    int score_E
    int score_I
    int score_S
    int score_N
    int score_T
    int score_F
    int score_J
    int score_P
    string mbti_code FK
    datetime completed_at
  }
  ARCHETYPE {
    string mbti_code PK
    string name
    string group
    string decision_style
    string description
    boolean executive_fit
  }
  EMAIL_LOG {
    string id PK
    string to_user_id FK
    string sent_by_user_id FK
    string subject
    string body
    datetime sent_at
  }
```

---

## 6. Model: question classification tree

Each test item targets exactly one of four dichotomies; every dichotomy resolves to one
letter of the 4-letter MBTI code, which the knowledge base then maps to a decision-maker
archetype.

```mermaid
flowchart TB
  Q[MBTI Question Bank] --> EI[Dichotomy: E–I<br/>Energy orientation]
  Q --> SN[Dichotomy: S–N<br/>Information gathering]
  Q --> TF[Dichotomy: T–F<br/>Decision basis]
  Q --> JP[Dichotomy: J–P<br/>Lifestyle / structure]

  EI --> E[Extraversion]
  EI --> I[Introversion]
  SN --> S[Sensing]
  SN --> N[Intuition]
  TF --> T[Thinking]
  TF --> F[Feeling]
  JP --> J[Judging]
  JP --> P[Perceiving]

  E & I & S & N & T & F & J & P --> Code[4-letter MBTI code]
  Code --> Rules[IF-THEN Knowledge Base]
  Rules --> Arch[Decision-maker archetype]
```

> The real question bank is intentionally **not included** in this prototype
> (per project scope) — see `lib/questions.ts`, which documents the exact shape
> to drop your own question set into.

---

## 7. Knowledge base: IF-THEN rules (excerpt)

The full table lives in `lib/mbti.ts` (`archetypeRules`). The four archetypes called out
in the assignment brief are the ones flagged `executiveFit: true`:

| Rule | Condition (MBTI code) | Conclusion (Archetype) | Executive fit |
|---|---|---|---|
| R1 | IF code = ENTJ | THEN archetype = **The Commander** — decisive strategic driver | ✅ |
| R2 | IF code = ESTJ | THEN archetype = **The Executive** — structured operational commander | ✅ |
| R3 | IF code = INTJ | THEN archetype = **The Architect** — long-horizon systems planner | ✅ |
| R4 | IF code = ISTJ | THEN archetype = **The Logistician** — methodical compliance-first executor | ✅ |
| R5 | IF code = ENTP | THEN archetype = The Debater | — |
| R6 | IF code = INTP | THEN archetype = The Logician | — |
| … | … (16 rules total, one per MBTI code) | … | — |

HR Executives can filter the company view to **executive-fit archetypes only** when
shortlisting candidates for upper-management roles.

---

## 8. UI / dashboard design notes

The interface uses a deep-navy / brass banking palette (`Fraunces` display serif +
`Inter` body sans) to read as a trustworthy internal executive tool rather than a
generic SaaS template. Screens included in this prototype (design these further in
Figma if a high-fidelity mock is required for submission):

- **Login** — username, password, department selector, routing hint
- **Register** — Flow 1 entry point
- **MBTI Test** — one question at a time, progress bar, dichotomy label
- **Result** — 4-letter type, dichotomy bar charts, archetype card
- **Dashboard** (employee) — personal type, breakdown, retake option
- **Company Overview** (HR/managers) — stats, filters, staff table, email log

---

## 9. Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

**Demo accounts** (seeded automatically on first load):

| Username | Password | Department | Flow |
|---|---|---|---|
| aran.suksawat | password123 | Retail Banking | Flow 1 (has a result) |
| warut.phetchara | password123 | Retail Banking | Flow 1 (no result yet) |
| hr.suda | hrpass123 | Human Resources | Flow 2 |
| cto.peter | hrpass123 | Chief Technology Officer | Flow 2 |
| risk.malee | hrpass123 | Risk/Compliance Officer | Flow 2 |

All data is mock and stored in the browser's `localStorage` — no backend required.
