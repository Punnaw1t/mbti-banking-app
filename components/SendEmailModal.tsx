"use client";

import { useState } from "react";
import { User } from "@/lib/types";

export default function SendEmailModal({
  target,
  fromName,
  onClose,
  onSend,
}: {
  target: User;
  fromName: string;
  onClose: () => void;
  onSend: (subject: string, body: string) => void;
}) {
  const defaultSubject = target.result
    ? "Follow-up on your executive decision-style assessment"
    : "Reminder: complete your MBTI decision-style assessment";

  const defaultBody = target.result
    ? `Hi ${target.name.split(" ")[0]},\n\nThanks for completing the assessment. Your result (${target.result.mbtiType} — ${target.result.archetype.name}) is being reviewed as part of our upper-management planning. I'd like to schedule 20 minutes to discuss it — let me know a time that works this week.\n\nBest,\n${fromName}`
    : `Hi ${target.name.split(" ")[0]},\n\nAs part of our upper-management recruitment and development review, please complete the MBTI decision-style assessment in Meridian at your earliest convenience.\n\nBest,\n${fromName}`;

  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg bg-ink-800 border border-hairline/10 rounded-lg shadow-panel p-6">
        <p className="text-xs uppercase tracking-widest text-brass mb-1">Mock outbound email</p>
        <h2 className="font-display text-xl text-slate-50 mb-4">To: {target.name} &lt;{target.email}&gt;</h2>

        <label className="block text-sm text-slate-200 mb-1.5">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full mb-4 rounded-md bg-ink-700 border border-hairline/10 px-3.5 py-2.5 text-sm text-slate-50 focus:border-brass outline-none"
        />

        <label className="block text-sm text-slate-200 mb-1.5">Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={7}
          className="w-full mb-5 rounded-md bg-ink-700 border border-hairline/10 px-3.5 py-2.5 text-sm text-slate-50 focus:border-brass outline-none resize-none"
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-md border border-hairline/15 text-slate-300 hover:text-slate-100">
            Cancel
          </button>
          <button
            onClick={() => onSend(subject, body)}
            className="text-sm px-4 py-2 rounded-md bg-brass text-midnight font-medium hover:bg-brass-light"
          >
            Send email
          </button>
        </div>
      </div>
    </div>
  );
}
