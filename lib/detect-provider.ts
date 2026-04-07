import type { ProviderId } from "./types";

interface DetectionRule {
  provider: ProviderId;
  /** Length bounds checked BEFORE the regex to prevent ReDoS */
  minLen?: number;
  maxLen?: number;
  test: (key: string) => boolean;
  confidence: "high" | "medium" | "low";
}

// All regex patterns use anchors (^ and $) and character-class quantifiers with
// fixed upper bounds. Length pre-checks prevent ReDoS on adversarially long input.
const rules: DetectionRule[] = [
  // OpenAI: sk-proj-..., sk-svcacct-..., or plain sk-... (not Anthropic)
  {
    provider: "openai",
    minLen: 20,
    maxLen: 300,
    test: (k) =>
      k.startsWith("sk-proj-") ||
      k.startsWith("sk-svcacct-") ||
      (k.startsWith("sk-") && !k.startsWith("sk-ant-") && /^sk-[A-Za-z0-9]{16,200}$/.test(k)),
    confidence: "high",
  },
  // Anthropic: sk-ant-api03-...
  {
    provider: "anthropic",
    minLen: 10,
    maxLen: 300,
    test: (k) => k.startsWith("sk-ant-"),
    confidence: "high",
  },
  // Google AI Studio: AIza + exactly 35 alphanumeric/dash/underscore chars
  {
    provider: "google",
    minLen: 39,
    maxLen: 39,
    test: (k) => k.startsWith("AIza") && /^AIza[A-Za-z0-9_\-]{35}$/.test(k),
    confidence: "high",
  },
  // Hugging Face: hf_...
  {
    provider: "huggingface",
    minLen: 4,
    maxLen: 200,
    test: (k) => k.startsWith("hf_"),
    confidence: "high",
  },
  // Groq: gsk_...
  {
    provider: "groq",
    minLen: 4,
    maxLen: 200,
    test: (k) => k.startsWith("gsk_"),
    confidence: "high",
  },
  // Replicate: r8_...
  {
    provider: "replicate",
    minLen: 4,
    maxLen: 200,
    test: (k) => k.startsWith("r8_"),
    confidence: "high",
  },
  // Perplexity: pplx-...
  {
    provider: "perplexity",
    minLen: 5,
    maxLen: 200,
    test: (k) => k.startsWith("pplx-"),
    confidence: "high",
  },
  // Cohere: exactly 40 alphanumeric chars
  {
    provider: "cohere",
    minLen: 40,
    maxLen: 40,
    test: (k) => /^[A-Za-z0-9]{40}$/.test(k),
    confidence: "medium",
  },
  // Mistral: standard UUID v4 format (exact 36 chars with hyphens)
  {
    provider: "mistral",
    minLen: 36,
    maxLen: 36,
    test: (k) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(k),
    confidence: "medium",
  },
  // Together AI: exactly 64 lowercase hex chars
  {
    provider: "together",
    minLen: 64,
    maxLen: 64,
    test: (k) => /^[0-9a-f]{64}$/.test(k),
    confidence: "low",
  },
];

export function detectProvider(key: string): ProviderId {
  const trimmed = key.trim();
  if (!trimmed) return "unknown";

  for (const rule of rules) {
    const len = trimmed.length;
    if (rule.minLen !== undefined && len < rule.minLen) continue;
    if (rule.maxLen !== undefined && len > rule.maxLen) continue;
    if (rule.test(trimmed)) return rule.provider;
  }

  return "unknown";
}

export function getDetectionConfidence(key: string): "high" | "medium" | "low" | null {
  const trimmed = key.trim();
  for (const rule of rules) {
    const len = trimmed.length;
    if (rule.minLen !== undefined && len < rule.minLen) continue;
    if (rule.maxLen !== undefined && len > rule.maxLen) continue;
    if (rule.test(trimmed)) return rule.confidence;
  }
  return null;
}
