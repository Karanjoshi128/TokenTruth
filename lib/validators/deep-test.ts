import type { DeepTestResult, ProviderId } from "../types";
import { fetchWithTimeout } from "../fetch-timeout";

/** Longer timeout for inference calls vs. simple auth checks. */
const INFERENCE_TIMEOUT = 20_000;

/**
 * Runs a minimal generation call (1 token) to confirm the key can actually
 * produce output — not just authenticate. Returns null for providers that
 * don't support a simple chat interface (Replicate, HuggingFace) or that
 * already validate via generation (Perplexity).
 */
export async function runDeepTest(key: string, provider: ProviderId): Promise<DeepTestResult | null> {
  switch (provider) {
    case "openai":     return deepTestOpenAI(key);
    case "anthropic":  return deepTestAnthropic(key);
    case "google":     return deepTestGoogle(key);
    case "cohere":     return deepTestCohere(key);
    case "mistral":    return deepTestMistral(key);
    case "groq":       return deepTestGroq(key);
    case "together":   return deepTestTogether(key);
    // Perplexity: base validator already calls /chat/completions — no extra call needed.
    // HuggingFace / Replicate: no simple single-turn chat endpoint; skip.
    default:           return null;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function sanitizeError(msg: string | undefined, status?: number): string {
  if (msg && msg.length < 200 && !msg.includes("sk-")) return msg;
  if (status) return `Generation failed (HTTP ${status})`;
  return "Generation failed";
}

// ── Per-provider implementations ───────────────────────────────────────────────

async function deepTestOpenAI(key: string): Promise<DeepTestResult> {
  const model = "gpt-4o-mini";
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: "hi" }], max_tokens: 1 }),
      },
      INFERENCE_TIMEOUT
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, model, latencyMs, error: sanitizeError(body?.error?.message, res.status) };
    }
    const body = await res.json();
    return { success: true, model, latencyMs, tokensUsed: body?.usage?.total_tokens };
  } catch (err) {
    return { success: false, model, latencyMs: Date.now() - start, error: err instanceof Error ? err.message : "Request failed" };
  }
}

async function deepTestAnthropic(key: string): Promise<DeepTestResult> {
  const model = "claude-haiku-4-5-20251001";
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
      },
      INFERENCE_TIMEOUT
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, model, latencyMs, error: sanitizeError(body?.error?.message, res.status) };
    }
    const body = await res.json();
    const tokensUsed = body?.usage ? (body.usage.input_tokens ?? 0) + (body.usage.output_tokens ?? 0) : undefined;
    return { success: true, model, latencyMs, tokensUsed };
  } catch (err) {
    return { success: false, model, latencyMs: Date.now() - start, error: err instanceof Error ? err.message : "Request failed" };
  }
}

async function deepTestGoogle(key: string): Promise<DeepTestResult> {
  const model = "gemini-1.5-flash";
  const start = Date.now();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "hi" }] }],
          generationConfig: { maxOutputTokens: 1 },
        }),
      },
      INFERENCE_TIMEOUT
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, model, latencyMs, error: sanitizeError(body?.error?.message, res.status) };
    }
    const body = await res.json();
    return { success: true, model, latencyMs, tokensUsed: body?.usageMetadata?.totalTokenCount };
  } catch (err) {
    return { success: false, model, latencyMs: Date.now() - start, error: err instanceof Error ? err.message : "Request failed" };
  }
}

async function deepTestCohere(key: string): Promise<DeepTestResult> {
  const model = "command-r";
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(
      "https://api.cohere.com/v2/chat",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: "hi" }], max_tokens: 1 }),
      },
      INFERENCE_TIMEOUT
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, model, latencyMs, error: sanitizeError(body?.message, res.status) };
    }
    const body = await res.json();
    const t = body?.usage?.tokens;
    const tokensUsed = t ? (t.input_tokens ?? 0) + (t.output_tokens ?? 0) : undefined;
    return { success: true, model, latencyMs, tokensUsed };
  } catch (err) {
    return { success: false, model, latencyMs: Date.now() - start, error: err instanceof Error ? err.message : "Request failed" };
  }
}

async function deepTestMistral(key: string): Promise<DeepTestResult> {
  const model = "mistral-small-latest";
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: "hi" }], max_tokens: 1 }),
      },
      INFERENCE_TIMEOUT
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, model, latencyMs, error: sanitizeError(body?.message, res.status) };
    }
    const body = await res.json();
    return { success: true, model, latencyMs, tokensUsed: body?.usage?.total_tokens };
  } catch (err) {
    return { success: false, model, latencyMs: Date.now() - start, error: err instanceof Error ? err.message : "Request failed" };
  }
}

async function deepTestGroq(key: string): Promise<DeepTestResult> {
  const model = "llama-3.1-8b-instant";
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: "hi" }], max_tokens: 1 }),
      },
      INFERENCE_TIMEOUT
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, model, latencyMs, error: sanitizeError(body?.error?.message, res.status) };
    }
    const body = await res.json();
    return { success: true, model, latencyMs, tokensUsed: body?.usage?.total_tokens };
  } catch (err) {
    return { success: false, model, latencyMs: Date.now() - start, error: err instanceof Error ? err.message : "Request failed" };
  }
}

async function deepTestTogether(key: string): Promise<DeepTestResult> {
  const model = "meta-llama/Llama-3.2-3B-Instruct-Turbo";
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(
      "https://api.together.xyz/v1/chat/completions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: "hi" }], max_tokens: 1 }),
      },
      INFERENCE_TIMEOUT
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, model, latencyMs, error: sanitizeError(body?.error?.message ?? body?.message, res.status) };
    }
    const body = await res.json();
    return { success: true, model, latencyMs, tokensUsed: body?.usage?.total_tokens };
  } catch (err) {
    return { success: false, model, latencyMs: Date.now() - start, error: err instanceof Error ? err.message : "Request failed" };
  }
}
