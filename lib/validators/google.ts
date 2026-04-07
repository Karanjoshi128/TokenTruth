import type { ValidationResult } from "../types";
import { maskKey } from "../utils";
import { fetchWithTimeout } from "../fetch-timeout";

// NOTE: Google AI Studio API requires the key as a query parameter — this is the
// only supported auth mechanism for API keys (not OAuth). The key is protected by
// HTTPS transport encryption. Server logs should be configured to redact query params.
export async function validateGoogle(key: string): Promise<Omit<ValidationResult, "testedAt" | "latencyMs">> {
  const keyPreview = maskKey(key);

  // Encode key to prevent any URL manipulation
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;

  let res: Response;
  try {
    res = await fetchWithTimeout(url);
  } catch (err) {
    return {
      valid: false,
      provider: "google",
      providerName: "Google Gemini",
      keyPreview,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg: string = body?.error?.message ?? "";
    return {
      valid: false,
      provider: "google",
      providerName: "Google Gemini",
      keyPreview,
      error: sanitizeError(res.status, msg),
    };
  }

  const body = await res.json();
  const models: string[] = (body.models ?? [])
    .map((m: { name: string }) => m.name.replace("models/", ""))
    .sort();

  return {
    valid: true,
    provider: "google",
    providerName: "Google Gemini",
    keyPreview,
    models,
  };
}

function sanitizeError(status: number, raw: string): string {
  if (status === 400 && raw.toLowerCase().includes("api key")) return "Invalid API key";
  if (status === 401 || status === 403) return "Invalid or unauthorized API key";
  if (status === 429) return "Rate limited by provider";
  if (status >= 500) return "Provider service error";
  if (raw && raw.length < 200) return raw;
  return `Validation failed (HTTP ${status})`;
}
