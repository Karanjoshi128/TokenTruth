import type { ValidationResult } from "../types";
import { maskKey } from "../utils";
import { fetchWithTimeout } from "../fetch-timeout";

export async function validateOpenAI(key: string): Promise<Omit<ValidationResult, "testedAt" | "latencyMs">> {
  const keyPreview = maskKey(key);

  let res: Response;
  try {
    res = await fetchWithTimeout("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
  } catch (err) {
    return {
      valid: false,
      provider: "openai",
      providerName: "OpenAI",
      keyPreview,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg: string = body?.error?.message ?? "";
    return {
      valid: false,
      provider: "openai",
      providerName: "OpenAI",
      keyPreview,
      error: sanitizeProviderError(res.status, msg),
    };
  }

  const body = await res.json();
  const models: string[] = (body.data ?? []).map((m: { id: string }) => m.id).sort();

  const rpm = res.headers.get("x-ratelimit-limit-requests");
  const tpd = res.headers.get("x-ratelimit-limit-tokens");

  return {
    valid: true,
    provider: "openai",
    providerName: "OpenAI",
    keyPreview,
    models,
    rateLimitRpm: rpm ? (parseInt(rpm, 10) || undefined) : undefined,
    rateLimitTpd: tpd ? (parseInt(tpd, 10) || undefined) : undefined,
  };
}

function sanitizeProviderError(status: number, raw: string): string {
  if (status === 401) return "Invalid API key";
  if (status === 403) return "Access forbidden — key may lack required permissions";
  if (status === 429) return "Rate limited by provider";
  if (status >= 500) return "Provider service error";
  // Allow safe informational messages through (no key material, no stack traces)
  if (raw && raw.length < 200 && !raw.includes("sk-")) return raw;
  return `Validation failed (HTTP ${status})`;
}
