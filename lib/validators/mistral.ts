import type { ValidationResult } from "../types";
import { maskKey } from "../utils";
import { fetchWithTimeout } from "../fetch-timeout";

export async function validateMistral(key: string): Promise<Omit<ValidationResult, "testedAt" | "latencyMs">> {
  const keyPreview = maskKey(key);

  let res: Response;
  try {
    res = await fetchWithTimeout("https://api.mistral.ai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
  } catch (err) {
    return {
      valid: false,
      provider: "mistral",
      providerName: "Mistral AI",
      keyPreview,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg: string = body?.message ?? "";
    return {
      valid: false,
      provider: "mistral",
      providerName: "Mistral AI",
      keyPreview,
      error: sanitizeError(res.status, msg),
    };
  }

  const body = await res.json();
  const models: string[] = (body.data ?? []).map((m: { id: string }) => m.id).sort();

  return {
    valid: true,
    provider: "mistral",
    providerName: "Mistral AI",
    keyPreview,
    models,
  };
}

function sanitizeError(status: number, raw: string): string {
  if (status === 401) return "Invalid API key";
  if (status === 403) return "Access forbidden";
  if (status === 429) return "Rate limited by provider";
  if (status >= 500) return "Provider service error";
  if (raw && raw.length < 200) return raw;
  return `Validation failed (HTTP ${status})`;
}
