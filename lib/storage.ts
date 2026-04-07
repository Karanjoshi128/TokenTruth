"use client";

import type { HistoryEntry, ProviderId } from "./types";

const STORAGE_KEY = "truthtoken_history";
const MAX_ENTRIES = 200;
const TTL_DAYS = 90;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

const VALID_PROVIDERS = new Set<string>([
  "openai", "anthropic", "google", "cohere", "huggingface",
  "mistral", "groq", "together", "replicate", "perplexity", "unknown",
]);

/**
 * Validates that a parsed value looks like a HistoryEntry before we trust it.
 * Prevents corrupted or injected localStorage data from crashing the UI.
 */
function isValidEntry(e: unknown): e is HistoryEntry {
  if (!e || typeof e !== "object") return false;
  const obj = e as Record<string, unknown>;
  return (
    typeof obj.id === "string" && obj.id.length > 0 &&
    typeof obj.provider === "string" && VALID_PROVIDERS.has(obj.provider) &&
    typeof obj.providerName === "string" &&
    typeof obj.keyPreview === "string" && obj.keyPreview.length > 0 &&
    typeof obj.valid === "boolean" &&
    typeof obj.testedAt === "string" && !isNaN(Date.parse(obj.testedAt)) &&
    typeof obj.latencyMs === "number" && obj.latencyMs >= 0
  );
}

function isExpired(entry: HistoryEntry): boolean {
  return Date.now() - new Date(entry.testedAt).getTime() > TTL_MS;
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      // Corrupted data — clear and recover
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return (parsed as unknown[])
      .filter(isValidEntry)
      .filter((e) => !isExpired(e));
  } catch {
    return [];
  }
}

export function addToHistory(entry: HistoryEntry): void {
  if (typeof window === "undefined") return;
  if (!isValidEntry(entry)) return; // Reject malformed entries before write
  try {
    const history = getHistory();
    // Deduplicate: remove prior result for same key preview + provider
    const filtered = history.filter(
      (e) => !(e.keyPreview === entry.keyPreview && e.provider === entry.provider)
    );
    const updated = [entry, ...filtered].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function removeFromHistory(id: string): void {
  if (typeof window === "undefined") return;
  if (typeof id !== "string" || !id) return;
  try {
    const history = getHistory();
    const updated = history.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function exportAsJSON(entries: HistoryEntry[]): void {
  // Only export the fields we intend to — no extra/unknown keys
  const sanitized = entries.map(({ keyPreview, provider, providerName, valid, testedAt, latencyMs, error, models, organization, tier }) => ({
    keyPreview, provider, providerName, valid, testedAt, latencyMs,
    ...(error ? { error } : {}),
    ...(models ? { models } : {}),
    ...(organization ? { organization } : {}),
    ...(tier ? { tier } : {}),
  }));
  const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: "application/json" });
  downloadBlob(blob, `truthtoken-export-${Date.now()}.json`);
}

export function exportAsCSV(entries: HistoryEntry[]): void {
  const fields = ["keyPreview", "provider", "providerName", "valid", "testedAt", "latencyMs", "tier", "organization", "error"] as const;
  const rows = entries.map((e) =>
    fields.map((f) => JSON.stringify(e[f] ?? "")).join(",")
  );
  const csv = [fields.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  downloadBlob(blob, `truthtoken-export-${Date.now()}.csv`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  // Sanitize filename — only allow alphanumeric, hyphens, underscores, dots
  a.download = filename.replace(/[^a-zA-Z0-9\-_.]/g, "_");
  a.click();
  URL.revokeObjectURL(url);
}
