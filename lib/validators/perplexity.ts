import type { ValidationResult } from "../types";
import { maskKey } from "../utils";
import { fetchWithTimeout } from "../fetch-timeout";

// Perplexity does not currently expose a dedicated key-validation or models-list
// endpoint for API keys. We use a minimal chat completion with max_tokens=1 as the
// validation probe. This is a single, minimal call — not a fallback chain.
export async function validatePerplexity(key: string): Promise<Omit<ValidationResult, "testedAt" | "latencyMs">> {
  const keyPreview = maskKey(key);

  let res: Response;
  try {
    res = await fetchWithTimeout("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
      }),
    });
  } catch (err) {
    return {
      valid: false,
      provider: "perplexity",
      providerName: "Perplexity AI",
      keyPreview,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }

  if (!res.ok) {
    return {
      valid: false,
      provider: "perplexity",
      providerName: "Perplexity AI",
      keyPreview,
      error: sanitizeError(res.status),
    };
  }

  return {
    valid: true,
    provider: "perplexity",
    providerName: "Perplexity AI",
    keyPreview,
    models: ["sonar", "sonar-pro", "sonar-reasoning", "sonar-reasoning-pro"],
  };
}

function sanitizeError(status: number): string {
  if (status === 401) return "Invalid API key";
  if (status === 403) return "Access forbidden";
  if (status === 429) return "Rate limited by provider";
  if (status >= 500) return "Provider service error";
  return `Validation failed (HTTP ${status})`;
}
