"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Alert, BotContext, BotReply, answer } from "@/lib/chatbot";

// A bot message carries the rule-engine reply (tables, alerts) and, when the
// LLM is available, its natural-language answer streamed on top.
type BotMessage = {
  from: "bot";
  reply: BotReply;
  ai?: string;
  state: "local" | "waiting" | "streaming" | "done" | "error";
  error?: string;
};
type Message = { from: "user"; text: string } | BotMessage;

type LlmStatus = { available: boolean; model: string; reason?: string } | null;

const STATUS: Record<Alert["status"], { icon: string; label: string; className: string }> = {
  green: { icon: "✓", label: "Green", className: "text-signal-green border-signal-green/40" },
  yellow: { icon: "!", label: "Yellow", className: "text-signal-amber border-signal-amber/50" },
  red: { icon: "✕", label: "Red", className: "text-signal-red border-signal-red/50" },
};

// Chatbot logo (the Meridian emblem) used on the launcher and in the panel header.
// The PNG is a round badge on a transparent background with a little padding,
// so it is scaled up slightly to fill its circle.
function BotLogo({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/meridian-logo.png" alt="" aria-hidden className={`object-contain scale-110 ${className}`} />
  );
}

export default function HrChatbot({ context }: { context: BotContext }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [llm, setLlm] = useState<LlmStatus>(null);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open && messages.length === 0) setMessages([{ from: "bot", reply: answer("help", context), state: "local" }]);
  }, [open, messages.length, context]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  // Check whether the AI model is ready each time the panel opens.
  useEffect(() => {
    if (!open) return;
    fetch("/api/chat", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setLlm)
      .catch(() => setLlm(null));
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function updateLast(patch: (m: BotMessage) => BotMessage) {
    setMessages((list) => {
      const copy = [...list];
      const i = copy.length - 1;
      if (i >= 0 && copy[i].from === "bot") copy[i] = patch(copy[i] as BotMessage);
      return copy;
    });
  }

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    // Conversation so far, for follow-up questions ("and in Retail?").
    const history = messages.flatMap((m): { role: "user" | "assistant"; content: string }[] =>
      m.from === "user"
        ? [{ role: "user", content: m.text }]
        : m.ai ? [{ role: "assistant", content: m.ai }] : [],
    );

    // Show the local rule answer instantly; the server replaces it with its own
    // (computed from the database) and streams the AI answer on top.
    setMessages((m) => [
      ...m,
      { from: "user", text: trimmed },
      { from: "bot", reply: answer(trimmed, context), state: "waiting" },
    ]);
    setInput("");
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status}).`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const evt = JSON.parse(line);
          if (evt.type === "rule") updateLast((m) => ({ ...m, reply: evt.reply }));
          else if (evt.type === "delta") updateLast((m) => ({ ...m, ai: (m.ai ?? "") + evt.text, state: "streaming" }));
          else if (evt.type === "done") updateLast((m) => ({ ...m, state: "done" }));
          else if (evt.type === "error") updateLast((m) => ({ ...m, state: "error", error: evt.message }));
        }
      }
      updateLast((m) => (m.state === "waiting" || m.state === "streaming" ? { ...m, state: m.ai ? "done" : "error" } : m));
    } catch (err) {
      if (controller.signal.aborted) return;
      updateLast((m) => ({ ...m, state: "error", error: `${(err as Error).message} Showing the rule-based answer.` }));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  const last = [...messages].reverse().find((m) => m.from === "bot") as BotMessage | undefined;

  const subtitle =
    llm === null
      ? "Answers from the KPI and decision rules"
      : llm.available
        ? `AI · ${llm.model} · grounded on KPI rules`
        : `Rule-based only · AI ${llm.reason === "model not downloaded yet" ? "model still downloading" : "offline"}`;

  const launcher = (
    <button
      onClick={() => setOpen(!open)}
      className={`group fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full text-midnight shadow-panel ring-4 ring-brass/20 hover:scale-105 transition flex items-center justify-center ${
        open ? "bg-brass hover:bg-brass-light" : "bg-midnight"
      }`}
      aria-label={open ? "Close the HR assistant" : "Open the HR assistant"}
      aria-expanded={open}
    >
      {open ? <span className="text-2xl leading-none" aria-hidden>×</span> : <BotLogo className="h-14 w-14" />}
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
          <span className="h-9 w-9 shrink-0 rounded-full bg-midnight flex items-center justify-center">
            <BotLogo className="h-9 w-9" />
          </span>
          <div>
            <p className="text-sm text-slate-50 font-medium">HR Assistant</p>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${llm?.available ? "bg-signal-green" : "bg-slate-600"}`}
                aria-hidden
              />
              {subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { abortRef.current?.abort(); setBusy(false); setMessages([]); }}
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
            <BotBubble key={i} message={m} />
          ),
        )}
        <div ref={endRef} />
      </div>

      {last?.reply.suggestions && !busy && (
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
          placeholder="Ask in English or Thai — KPIs, departments, employees…"
          className="flex-1 rounded-md bg-ink border border-hairline/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-brass outline-none"
          aria-label="Message"
        />
        <button type="submit" disabled={busy} className="text-sm px-4 py-2 rounded-md bg-brass text-midnight font-medium hover:bg-brass-light transition-colors disabled:opacity-50">
          {busy ? "…" : "Send"}
        </button>
      </form>
    </section>
    </>
  );
}

// Renders the small subset of Markdown the model tends to use: paragraphs,
// "-"/"*"/"1." lists and **bold**.
function AiText({ text }: { text: string }) {
  const blocks: { list: boolean; lines: string[] }[] = [];
  text.split("\n").forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const item = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    const content = item ? item[1] : line.replace(/^#+\s*/, "");
    const lastBlock = blocks[blocks.length - 1];
    if (lastBlock && lastBlock.list === !!item) lastBlock.lines.push(content);
    else blocks.push({ list: !!item, lines: [content] });
  });
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? <strong key={i} className="text-slate-50 font-semibold">{part.slice(2, -2)}</strong> : part,
    );
  return (
    <div className="space-y-2 text-slate-50 leading-relaxed">
      {blocks.map((b, i) =>
        b.list ? (
          <ul key={i} className="list-disc pl-5 space-y-1">{b.lines.map((l, j) => <li key={j}>{inline(l)}</li>)}</ul>
        ) : (
          b.lines.map((l, j) => <p key={`${i}-${j}`}>{inline(l)}</p>)
        ),
      )}
    </div>
  );
}

function BotBubble({ message }: { message: BotMessage }) {
  const { reply, ai, state, error } = message;
  const hasAi = !!ai;
  const thinking = state === "waiting";

  return (
    <div className="max-w-[95%] space-y-2 text-sm text-slate-200" data-intent={reply.intent}>
      {thinking && (
        <p className="flex items-center gap-2 text-xs text-slate-400">
          <span className="chat-dots" aria-hidden><span /><span /><span /></span>
          Thinking…
        </p>
      )}
      {hasAi && (
        <div>
          <AiText text={ai!} />
          {state === "streaming" && <span className="chat-caret" aria-hidden />}
        </div>
      )}
      {error && <p className="text-[11px] text-signal-amber">{error}</p>}

      {/* Rule-engine output: the main answer when there is no AI text, otherwise
          the evidence the AI answer was grounded on. */}
      {hasAi ? (
        reply.intent !== "fallback" && (reply.alerts || reply.table || reply.actions) ? (
          <details className="rounded-md border border-hairline/10 px-3 py-2">
            <summary className="cursor-pointer text-[11px] uppercase tracking-widest text-slate-400 hover:text-brass">
              Data from the rule engine
            </summary>
            <div className="mt-2"><RuleDetails reply={reply} /></div>
          </details>
        ) : null
      ) : (
        !thinking && <RuleDetails reply={reply} />
      )}
    </div>
  );
}

function RuleDetails({ reply }: { reply: BotReply }) {
  return (
    <div className="space-y-2">
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
