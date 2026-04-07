import type { ValidationResult } from "../types";
import { maskKey } from "../utils";
import { fetchWithTimeout } from "../fetch-timeout";

export async function validateAnthropic(key: string): Promise<Omit<ValidationResult, "testedAt" | "latencyMs">> {
  const keyPreview = maskKey(key);

  let res: Response;
  try {
    res = await fetchWithTimeout("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
    });
  } catch (err) {
    return {
      valid: false,
      provider: "anthropic",
      providerName: "Anthropic",
      keyPreview,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg: string = body?.error?.message ?? "";
    return {
      valid: false,
      provider: "anthropic",
      providerName: "Anthropic",
      keyPreview,
      error: sanitizeError(res.status, msg),
    };
  }

  const body = await res.json();
  const models: string[] = (body.data ?? []).map((m: { id: string }) => m.id).sort();

  return {
    valid: true,
    provider: "anthropic",
    providerName: "Anthropic",
    keyPreview,
    models,
  };
}

function sanitizeError(status: number, raw: string): string {
  if (status === 401) return "Invalid API key";
  if (status === 403) return "Access forbidden";
  if (status === 429) return "Rate limited by provider";
  if (status >= 500) return "Provider service error";
  if (raw && raw.length < 200 && !raw.includes("sk-")) return raw;
  return `Validation failed (HTTP ${status})`;
}
