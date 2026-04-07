import type { ValidationResult } from "../types";
import { maskKey } from "../utils";
import { fetchWithTimeout } from "../fetch-timeout";

export async function validateHuggingFace(key: string): Promise<Omit<ValidationResult, "testedAt" | "latencyMs">> {
  const keyPreview = maskKey(key);

  let res: Response;
  try {
    res = await fetchWithTimeout("https://huggingface.co/api/whoami", {
      headers: { Authorization: `Bearer ${key}` },
    });
  } catch (err) {
    return {
      valid: false,
      provider: "huggingface",
      providerName: "Hugging Face",
      keyPreview,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }

  if (!res.ok) {
    return {
      valid: false,
      provider: "huggingface",
      providerName: "Hugging Face",
      keyPreview,
      error: sanitizeError(res.status),
    };
  }

  const body = await res.json();

  return {
    valid: true,
    provider: "huggingface",
    providerName: "Hugging Face",
    keyPreview,
    organization: typeof body.name === "string" ? body.name : undefined,
    email: typeof body.email === "string" ? body.email : undefined,
    tier: typeof body.type === "string" ? body.type : undefined,
    extra: {
      isPro: body.isPro === true,
      numModels: typeof body.numModels === "number" ? body.numModels : undefined,
      numDatasets: typeof body.numDatasets === "number" ? body.numDatasets : undefined,
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
