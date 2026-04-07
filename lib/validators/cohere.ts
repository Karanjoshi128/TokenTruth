import type { ValidationResult } from "../types";
import { maskKey } from "../utils";
import { fetchWithTimeout } from "../fetch-timeout";

export async function validateCohere(key: string): Promise<Omit<ValidationResult, "testedAt" | "latencyMs">> {
  const keyPreview = maskKey(key);

  let res: Response;
  try {
    res = await fetchWithTimeout("https://api.cohere.com/v1/check-api-key", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    return {
      valid: false,
      provider: "cohere",
      providerName: "Cohere",
      keyPreview,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg: string = body?.message ?? "";
    return {
      valid: false,
      provider: "cohere",
      providerName: "Cohere",
      keyPreview,
      error: sanitizeError(res.status, msg),
    };
  }

  const body = await res.json();

  // Fetch models list separately with its own timeout
  let models: string[] = [];
  try {
    const modelsRes = await fetchWithTimeout("https://api.cohere.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (modelsRes.ok) {
      const modelsBody = await modelsRes.json();
      models = (modelsBody.models ?? []).map((m: { name: string }) => m.name).sort();
    }
  } catch {
    // Non-fatal: key is valid, models list is best-effort
  }

  return {
    valid: body.valid === true,
    provider: "cohere",
    providerName: "Cohere",
    keyPreview,
    models,
    organization: typeof body.organizationName === "string" ? body.organizationName : undefined,
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
