import { Question } from "./types";

// -----------------------------------------------------------------------
// QUESTION BANK — from mbti_rule_base.md (ITCS454 Project 1)
// -----------------------------------------------------------------------
// 32 banking-contextualised items (EI 9 / SN 7 / TF 9 / JP 7 — all odd, so no
// dichotomy can tie). Option A always scores the first letter
// of the dichotomy (E/S/T/J), option B the second (I/N/F/P), matching the
// 64 Layer-1 scoring rules R1–R64 in the rule base.
// -----------------------------------------------------------------------

export const questionBank: Question[] = [
  // Extraversion (E) vs. Introversion (I) — EI_Q1–EI_Q8
  { id: 1, dichotomy: "EI", prompt: "Facing a decision on launching a new mobile banking feature, I prefer to...", optionA: { label: "Talk it through with colleagues out loud", trait: "E" }, optionB: { label: "Work through it alone first", trait: "I" } },
  { id: 2, dichotomy: "EI", prompt: "In risk-committee meetings, I usually...", optionA: { label: "Speak up as ideas occur to me", trait: "E" }, optionB: { label: "Listen first, share after reflecting", trait: "I" } },
  { id: 3, dichotomy: "EI", prompt: "After a day of stakeholder meetings on a digital transformation initiative, I recharge by...", optionA: { label: "Socializing with others", trait: "E" }, optionB: { label: "Spending quiet time alone", trait: "I" } },
  { id: 4, dichotomy: "EI", prompt: "I feel most energized when...", optionA: { label: "Collaborating with the fintech project team", trait: "E" }, optionB: { label: "Focusing independently on a compliance report", trait: "I" } },
  { id: 5, dichotomy: "EI", prompt: "Kicking off a new core-banking upgrade, I prefer to...", optionA: { label: "Brainstorm out loud with the team", trait: "E" }, optionB: { label: "Draft my own approach in writing first", trait: "I" } },
  { id: 6, dichotomy: "EI", prompt: "In a branch strategy discussion, I tend to...", optionA: { label: "Engage in several conversations at once", trait: "E" }, optionB: { label: "Go deep on one issue at a time", trait: "I" } },
  { id: 7, dichotomy: "EI", prompt: "Presenting the quarterly risk report to the board, I would rather...", optionA: { label: "Present live in front of the committee", trait: "E" }, optionB: { label: "Submit a detailed written report", trait: "I" } },
  { id: 8, dichotomy: "EI", prompt: "My ideal workspace for reviewing loan portfolios is...", optionA: { label: "Open and interactive with the team", trait: "E" }, optionB: { label: "Private and quiet", trait: "I" } },
  { id: 9, dichotomy: "EI", prompt: "When a core-system outage hits the branch network, I respond by...", optionA: { label: "Pulling everyone onto a call to work it out together", trait: "E" }, optionB: { label: "Reading the incident log myself before responding", trait: "I" } },

  // Sensing (S) vs. Intuition (N) — SN_Q1–SN_Q7
  { id: 10, dichotomy: "SN", prompt: "Analyzing a rise in loan defaults, I focus on...", optionA: { label: "Concrete transaction data and current figures", trait: "S" }, optionB: { label: "Underlying patterns and future risk trends", trait: "N" } },
  { id: 11, dichotomy: "SN", prompt: "Evaluating a new fraud-detection model, I trust...", optionA: { label: "Proven methods with a track record", trait: "S" }, optionB: { label: "New approaches even if untested", trait: "N" } },
  { id: 12, dichotomy: "SN", prompt: "Reading a credit-risk report, I pay most attention to...", optionA: { label: "Specific figures and default rates", trait: "S" }, optionB: { label: "Big-picture implications for the loan book", trait: "N" } },
  { id: 13, dichotomy: "SN", prompt: "Rolling out a new compliance procedure, I prefer instructions that are...", optionA: { label: "Step-by-step and explicit", trait: "S" }, optionB: { label: "General, leaving room for branch managers to interpret", trait: "N" } },
  { id: 14, dichotomy: "SN", prompt: "Planning next year's digital banking roadmap, I focus on...", optionA: { label: "What's worked in past rollouts", trait: "S" }, optionB: { label: "What could work differently with emerging fintech", trait: "N" } },
  { id: 15, dichotomy: "SN", prompt: "I'm more comfortable...", optionA: { label: "Working within established banking regulations and procedures", trait: "S" }, optionB: { label: "Exploring untested approaches like open banking APIs", trait: "N" } },
  { id: 16, dichotomy: "SN", prompt: "I'd describe my approach to product design as...", optionA: { label: "Practical and realistic", trait: "S" }, optionB: { label: "Imaginative and conceptual", trait: "N" } },

  // Thinking (T) vs. Feeling (F) — TF_Q1–TF_Q8
  { id: 17, dichotomy: "TF", prompt: "Deciding whether to approve a borderline loan application, I prioritize...", optionA: { label: "The logical, data-driven outcome", trait: "T" }, optionB: { label: "The applicant's personal circumstances", trait: "F" } },
  { id: 18, dichotomy: "TF", prompt: "Giving feedback to a teller on a customer-service mistake, I am...", optionA: { label: "Direct and objective", trait: "T" }, optionB: { label: "Diplomatic and encouraging", trait: "F" } },
  { id: 19, dichotomy: "TF", prompt: "When my team disagrees on a new customer-fee policy, I focus on...", optionA: { label: "Finding the most rational solution", trait: "T" }, optionB: { label: "Maintaining team harmony and morale", trait: "F" } },
  { id: 20, dichotomy: "TF", prompt: "I judge a disputed transaction case on...", optionA: { label: "Fairness via consistent bank policy", trait: "T" }, optionB: { label: "Fairness via the customer's individual circumstances", trait: "F" } },
  { id: 21, dichotomy: "TF", prompt: "When a teller is stressed after a difficult customer complaint, my instinct is to...", optionA: { label: "Help them resolve the issue efficiently", trait: "T" }, optionB: { label: "Acknowledge how they're feeling first", trait: "F" } },
  { id: 22, dichotomy: "TF", prompt: "In my role, I want to be seen as...", optionA: { label: "Competent and clear-headed", trait: "T" }, optionB: { label: "Compassionate and supportive", trait: "F" } },
  { id: 23, dichotomy: "TF", prompt: "When two analysts disagree on a credit-scoring model, I...", optionA: { label: "Check the data to see who's right", trait: "T" }, optionB: { label: "Look at how to keep both comfortable with the outcome", trait: "F" } },
  { id: 24, dichotomy: "TF", prompt: "My decisions on branch closures are more influenced by...", optionA: { label: "Cost-efficiency analysis", trait: "T" }, optionB: { label: "Impact on staff and the local community", trait: "F" } },
  { id: 25, dichotomy: "TF", prompt: "Setting next quarter's sales target for the branch team, I weigh...", optionA: { label: "What the performance numbers say is achievable", trait: "T" }, optionB: { label: "How the target will land with the people who must hit it", trait: "F" } },

  // Judging (J) vs. Perceiving (P) — JP_Q1–JP_Q7
  { id: 26, dichotomy: "JP", prompt: "Rolling out a new core-banking system upgrade, I prefer the timeline to be...", optionA: { label: "Planned well in advance", trait: "J" }, optionB: { label: "Flexible and adjusted as issues surface", trait: "P" } },
  { id: 27, dichotomy: "JP", prompt: "Before a regulatory filing deadline, I usually...", optionA: { label: "Finish well ahead of time", trait: "J" }, optionB: { label: "Work best under last-minute pressure", trait: "P" } },
  { id: 28, dichotomy: "JP", prompt: "I prefer investment-committee decisions to be...", optionA: { label: "Made and settled quickly", trait: "J" }, optionB: { label: "Kept open pending new market data", trait: "P" } },
  { id: 29, dichotomy: "JP", prompt: "My approach to managing a loan portfolio is...", optionA: { label: "Organized and structured", trait: "J" }, optionB: { label: "Adaptable, shifting with conditions", trait: "P" } },
  { id: 30, dichotomy: "JP", prompt: "Starting a new fintech partnership project, I...", optionA: { label: "Create a clear implementation plan first", trait: "J" }, optionB: { label: "Dive in and adapt as we go", trait: "P" } },
  { id: 31, dichotomy: "JP", prompt: "I feel more comfortable when...", optionA: { label: "A merger decision is finalized", trait: "J" }, optionB: { label: "Options for the deal structure stay open", trait: "P" } },
  { id: 32, dichotomy: "JP", prompt: "My approach to a digital-transformation rollout is...", optionA: { label: "Follow a structured timeline", trait: "J" }, optionB: { label: "Stay flexible and adjust as needed", trait: "P" } },
];
