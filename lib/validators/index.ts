import type { ProviderId, ValidationResult } from "../types";
import { validateOpenAI } from "./openai";
import { validateAnthropic } from "./anthropic";
import { validateGoogle } from "./google";
import { validateCohere } from "./cohere";
import { validateHuggingFace } from "./huggingface";
import { validateMistral } from "./mistral";
import { validateGroq } from "./groq";
import { validateTogether } from "./together";
import { validateReplicate } from "./replicate";
import { validatePerplexity } from "./perplexity";
import { runDeepTest } from "./deep-test";

type ValidatorFn = (key: string) => Promise<Omit<ValidationResult, "testedAt" | "latencyMs">>;

const validators: Partial<Record<ProviderId, ValidatorFn>> = {
  openai: validateOpenAI,
  anthropic: validateAnthropic,
  google: validateGoogle,
  cohere: validateCohere,
  huggingface: validateHuggingFace,
  mistral: validateMistral,
  groq: validateGroq,
  together: validateTogether,
  replicate: validateReplicate,
  perplexity: validatePerplexity,
};

export async function runValidator(
  key: string,
  provider: ProviderId,
  deepTest = false
): Promise<ValidationResult> {
  const start = Date.now();
  const fn = validators[provider];

  if (!fn) {
    return {
      valid: false,
      provider,
      providerName: provider,
      keyPreview: key.slice(0, 4) + "••••",
      testedAt: new Date().toISOString(),
      latencyMs: 0,
      error: `No validator available for provider: ${provider}`,
    };
  }

  const result = await fn(key);
  const latencyMs = Date.now() - start;

  // Only run the generation probe if the key authenticated successfully.
  const deepTestResult =
    deepTest && result.valid
      ? (await runDeepTest(key, provider)) ?? undefined
      : undefined;

  return {
    ...result,
    testedAt: new Date().toISOString(),
    latencyMs,
    ...(deepTestResult !== undefined ? { deepTestResult } : {}),
  };
}
