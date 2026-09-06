import { User } from "./types";
import { getArchetype } from "./mbti";

// Default follow-up / reminder copy for a given employee, sent by the HR
// Executive currently signed in.
export function buildFollowUpEmail(target: User, fromName: string): { subject: string; body: string } {
  const subject = target.result
    ? "Follow-up on your executive decision-style assessment"
    : "Reminder: complete your MBTI decision-style assessment";

  const body = target.result
    ? `Hi ${target.name.split(" ")[0]},\n\nThanks for completing the assessment. Your result (${target.result.mbtiType} — ${getArchetype(target.result.mbtiType).name}) is being reviewed as part of our upper-management planning. I'd like to schedule 20 minutes to discuss it — let me know a time that works this week.\n\nBest,\n${fromName}`
    : `Hi ${target.name.split(" ")[0]},\n\nAs part of our upper-management recruitment and development review, please complete the MBTI decision-style assessment in Meridian at your earliest convenience.\n\nBest,\n${fromName}`;

  return { subject, body };
}

// mailto: link that hands the message off to the user's own email client —
// Meridian never transmits the message itself.
export function buildMailtoHref(toEmail: string, subject: string, body: string): string {
  return `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
