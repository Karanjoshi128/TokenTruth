import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskKey(key: string): string {
  if (!key || key.length < 8) return "****";
  const visible = 4;
  return key.slice(0, visible) + "•".repeat(Math.min(key.length - visible * 2, 20)) + key.slice(-visible);
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Generates a cryptographically random ID using the Web Crypto API.
 * Works in both browser and Node.js (Node 19+ / Next.js runtime).
 * Uses 12 random bytes → 24 hex chars, giving ~96 bits of entropy.
 */
export function generateId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
