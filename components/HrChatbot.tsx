"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Alert, BotContext, BotReply, answer } from "@/lib/chatbot";

type Message = { from: "user"; text: string } | { from: "bot"; reply: BotReply };

const STATUS: Record<Alert["status"], { icon: string; label: string; className: string }> = {
  green: { icon: "✓", label: "Green", className: "text-signal-green border-signal-green/40" },
  yellow: { icon: "!", label: "Yellow", className: "text-signal-amber border-signal-amber/50" },
  red: { icon: "✕", label: "Red", className: "text-signal-red border-signal-red/50" },
};

// Chatbot logo used on the launcher and in the panel header.
function BotLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <path d="M16 3.5v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="3" r="1.8" fill="currentColor" />
      <rect x="5" y="7.5" width="22" height="17" rx="6" fill="currentColor" />
      <path d="M11 24.5 9 29l6-4.5" fill="currentColor" />
      <circle cx="12" cy="15.5" r="2.2" className="fill-brass" />
      <circle cx="20" cy="15.5" r="2.2" className="fill-brass" />
      <path d="M12.5 20.2c2 1.3 5 1.3 7 0" stroke="#B08D57" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="2" y="13" width="3" height="6" rx="1.5" fill="currentColor" />
      <rect x="27" y="13" width="3" height="6" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export default function HrChatbot({ context }: { context: BotContext }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) setMessages([{ from: "bot", reply: answer("help", context) }]);
  }, [open, messages.length, context]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { from: "user", text: trimmed }, { from: "bot", reply: answer(trimmed, context) }]);
    setInput("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  const last = [...messages].reverse().find((m) => m.from === "bot") as { reply: BotReply } | undefined;

  const launcher = (
    <button
      onClick={() => setOpen(!open)}
      className="group fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-brass text-midnight shadow-panel ring-4 ring-brass/20 hover:bg-brass-light hover:scale-105 transition flex items-center justify-center"
      aria-label={open ? "Close the HR assistant" : "Open the HR assistant"}
      aria-expanded={open}
    >
      {open ? <span className="text-2xl leading-none" aria-hidden>×</span> : <BotLogo className="h-8 w-8" />}
      {!open && (
        <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md bg-ink-700 border border-hairline/10 px-2.5 py-1 text-xs text-slate-50 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
          Ask HR Assistant
        </span>
      )}
    </button>
  );

  if (!open) return launcher;

  return (
    <>
    {launcher}
    <section
      className="fixed z-40 bottom-24 right-4 left-4 sm:left-auto sm:right-6 sm:w-[420px] h-[min(600px,calc(100vh-8rem))] flex flex-col bg-ink-800 border border-hairline/15 rounded-lg shadow-panel"
      aria-label="HR assistant"
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-hairline/10">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 shrink-0 rounded-full bg-brass text-midnight flex items-center justify-center">
            <BotLogo className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm text-slate-50 font-medium">HR Assistant</p>
            <p className="text-xs text-slate-400">Answers from the KPI and decision rules</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMessages([])}
            className="text-xs px-2 py-1 rounded-md text-slate-400 hover:text-slate-50"
          >
            Clear
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-lg leading-none px-2 py-1 rounded-md text-slate-400 hover:text-slate-50"
            aria-label="Minimise the HR assistant"
          >
            –
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" aria-live="polite">
        {messages.map((m, i) =>
          m.from === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-lg bg-brass/15 border border-brass/30 px-3 py-2 text-sm text-slate-50">{m.text}</p>
            </div>
          ) : (
            <BotBubble key={i} reply={m.reply} />
          ),
        )}
        <div ref={endRef} />
      </div>

      {last?.reply.suggestions && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {last.reply.suggestions.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="text-xs px-2.5 py-1 rounded-full border border-hairline/15 text-slate-200 hover:border-brass hover:text-brass transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex gap-2 p-3 border-t border-hairline/10">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about KPIs, departments, employees…"
          className="flex-1 rounded-md bg-ink border border-hairline/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-brass outline-none"
          aria-label="Message"
        />
        <button type="submit" className="text-sm px-4 py-2 rounded-md bg-brass text-midnight font-medium hover:bg-brass-light transition-colors">
          Send
        </button>
      </form>
    </section>
    </>
  );
}

function BotBubble({ reply }: { reply: BotReply }) {
  return (
    <div className="max-w-[95%] space-y-2 text-sm text-slate-200" data-intent={reply.intent}>
      <p className="text-slate-50">{reply.text}</p>

      {reply.alerts && reply.alerts.length > 0 && (
        <ul className="space-y-1.5">
          {reply.alerts.map((a, i) => {
            const s = STATUS[a.status];
            return (
              <li key={i} className="flex items-start gap-2">
                <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${s.className}`}>
                  <span aria-hidden>{s.icon}</span>{s.label}
                </span>
                <span className="text-xs leading-5"><span className="text-slate-400">{a.kpi} · </span>{a.detail}</span>
              </li>
            );
          })}
        </ul>
      )}

      {reply.table && (
        <div className="overflow-x-auto rounded-md border border-hairline/10">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400 border-b border-hairline/10">
                {reply.table.headers.map((h) => <th key={h} className="px-2 py-1.5 font-normal whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {reply.table.rows.map((r, i) => (
                <tr key={i} className="border-b border-hairline/5 last:border-0">
                  {r.map((c, j) => <td key={j} className={`px-2 py-1.5 ${j === 0 ? "text-slate-50" : ""}`}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reply.bullets && reply.bullets.length > 0 && (
        <ul className="list-disc pl-5 space-y-1 text-xs leading-5">
          {reply.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}

      {reply.actions && reply.actions.length > 0 && (
        <div className="rounded-md border border-brass/30 bg-brass/5 px-3 py-2">
          <p className="text-[11px] uppercase tracking-widest text-brass mb-1">Recommended action</p>
          <ol className="list-decimal pl-4 space-y-1 text-xs leading-5">
            {reply.actions.map((a, i) => <li key={i}>{a}</li>)}
          </ol>
        </div>
      )}

      {reply.note && <p className="text-[11px] text-slate-400">{reply.note}</p>}
    </div>
  );
}
