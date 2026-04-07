export type ProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "cohere"
  | "huggingface"
  | "mistral"
  | "groq"
  | "together"
  | "replicate"
  | "perplexity"
  | "unknown";

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  color: string;
  bgColor: string;
  docsUrl: string;
  statusUrl: string;
}

export interface DeepTestResult {
  success: boolean;
  model: string;
  latencyMs: number;
  tokensUsed?: number;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  provider: ProviderId;
  providerName: string;
  keyPreview: string; // masked key, e.g. "sk-...xK9f"
  testedAt: string; // ISO timestamp
  latencyMs: number;
  error?: string;
  // Rich metadata (optional, provider-dependent)
  models?: string[];
  organization?: string;
  email?: string;
  tier?: string;
  rateLimitRpm?: number;
  rateLimitTpd?: number;
  quotaUsed?: number;
  quotaTotal?: number;
  expiresAt?: string;
  extra?: Record<string, unknown>;
  deepTestResult?: DeepTestResult;
}

export interface HistoryEntry extends ValidationResult {
  id: string;
}

export interface BatchEntry {
  id: string;
  key: string;
  manualProvider?: ProviderId;
  status: "pending" | "testing" | "done" | "error";
  result?: ValidationResult;
}
