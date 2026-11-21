import { NextResponse } from "next/server";
import { handle, jsonError, requireHr } from "@/lib/server/auth";
import { getScopedEmployees } from "@/lib/server/db";
import { buildMessages } from "@/lib/server/chatPrompt";
import { llmStatus, streamChat } from "@/lib/server/llm";
import { getViewableDepartments } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/chat — is the LLM ready? (shown in the chatbot header)
export const GET = handle(async () => {
  const g = await requireHr();
  if (g.error) return g.error;
  return NextResponse.json(await llmStatus());
});

// POST /api/chat — { message, history } -> NDJSON stream:
//   {"type":"rule","reply":BotReply}   rule-engine answer (always sent first)
//   {"type":"delta","text":"…"}        LLM text chunks
//   {"type":"done"} | {"type":"error","message":"…"}
export const POST = handle(async (req: Request) => {
  const g = await requireHr();
  if (g.error) return g.error;

  const body = await req.json().catch(() => ({}));
  const message = String(body.message ?? "").trim().slice(0, 1000);
  if (!message) return jsonError("Type a question first.", 400);
  const history = Array.isArray(body.history)
    ? body.history
        .filter((m: { role?: string; content?: unknown }) =>
          (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-6)
    : [];

  // Data comes from the database, scoped by the viewer's role — never from the client.
  const ctx = {
    viewer: g.user,
    employees: await getScopedEmployees(g.user),
    scope: getViewableDepartments(g.user.department),
  };
  const { messages, ruleReply } = buildMessages(message, history, ctx);

  const encoder = new TextEncoder();
  const send = (c: ReadableStreamDefaultController, obj: unknown) =>
    c.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

  const stream = new ReadableStream({
    async start(controller) {
      send(controller, { type: "rule", reply: ruleReply });
      try {
        for await (const text of streamChat(messages, req.signal)) send(controller, { type: "delta", text });
        send(controller, { type: "done" });
      } catch (err) {
        if (!req.signal.aborted) {
          console.error("[chat]", err);
          send(controller, { type: "error", message: "The AI model is unavailable, so this answer comes from the rule engine only." });
        }
      } finally {
        try { controller.close(); } catch { /* client went away */ }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
});
