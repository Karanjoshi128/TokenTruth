import type { ValidationResult } from "../types";
import { maskKey } from "../utils";
import { fetchWithTimeout } from "../fetch-timeout";

export async function validateReplicate(key: string): Promise<Omit<ValidationResult, "testedAt" | "latencyMs">> {
  const keyPreview = maskKey(key);

  let res: Response;
  try {
    res = await fetchWithTimeout("https://api.replicate.com/v1/account", {
      headers: { Authorization: `Bearer ${key}` },
    });
  } catch (err) {
    return {
      valid: false,
      provider: "replicate",
      providerName: "Replicate",
      keyPreview,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }

  if (!res.ok) {
    return {
      valid: false,
      provider: "replicate",
      providerName: "Replicate",
      keyPreview,
      error: sanitizeError(res.status),
    };
  }

  const body = await res.json();

  return {
    valid: true,
    provider: "replicate",
    providerName: "Replicate",
    keyPreview,
    organization: typeof body.name === "string" ? body.name : undefined,
    email: typeof body.email === "string" ? body.email : undefined,
    extra: {
      username: typeof body.username === "string" ? body.username : undefined,
      type: typeof body.type === "string" ? body.type : undefined,
    },
  };
}

function sanitizeError(status: number): string {
  if (status === 401) return "Invalid API key";
  if (status === 403) return "Access forbidden";
  if (status === 429) return "Rate limited by provider";
  if (status >= 500) return "Provider service error";
  return `Validation failed (HTTP ${status})`;
}
