// Minimal client for any OpenAI-compatible chat API (Ollama, Groq, Gemini, OpenRouter…).
// Configured with LLM_BASE_URL / LLM_MODEL / LLM_API_KEY (see .env.example).

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function llmConfig() {
  return {
    disabled: process.env.LLM_DISABLED === "true",
    baseUrl: (process.env.LLM_BASE_URL || "http://localhost:11434/v1").replace(/\/+$/, ""),
    model: process.env.LLM_MODEL || "qwen2.5:3b",
    apiKey: process.env.LLM_API_KEY || "",
  };
}

function headers(apiKey: string) {
  return {
    "Content-Type": "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };
}

// Is the endpoint up and does it serve the configured model?
export async function llmStatus(): Promise<{ available: boolean; model: string; reason?: string }> {
  const cfg = llmConfig();
  if (cfg.disabled) return { available: false, model: cfg.model, reason: "disabled" };
  try {
    const res = await fetch(`${cfg.baseUrl}/models`, { headers: headers(cfg.apiKey), signal: AbortSignal.timeout(3000), cache: "no-store" });
    if (!res.ok) return { available: false, model: cfg.model, reason: `HTTP ${res.status}` };
    const data = await res.json().catch(() => ({}));
    const ids: string[] = (data.data ?? []).map((m: { id: string }) => m.id);
    // Some providers list ids with a prefix (e.g. "models/gemini-…"), so match on the suffix.
    const found = ids.length === 0 || ids.some((id) => id === cfg.model || id.endsWith(`/${cfg.model}`));
    return found
      ? { available: true, model: cfg.model }
      : { available: false, model: cfg.model, reason: "model not downloaded yet" };
  } catch {
    return { available: false, model: cfg.model, reason: "unreachable" };
  }
}

// Streams the assistant's reply as text chunks.
export async function* streamChat(messages: ChatMessage[], signal?: AbortSignal): AsyncGenerator<string> {
  const cfg = llmConfig();
  if (cfg.disabled) throw new Error("LLM is disabled (LLM_DISABLED=true).");

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: headers(cfg.apiKey),
    body: JSON.stringify({ model: cfg.model, messages, stream: true, temperature: 0.2, max_tokens: 600 }),
    signal,
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LLM request failed (HTTP ${res.status}) ${detail.slice(0, 200)}`);
  }

  // Server-sent events: lines of "data: {json}", ending with "data: [DONE]".
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
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        // ignore keep-alive or partial lines
      }
    }
  }
}
