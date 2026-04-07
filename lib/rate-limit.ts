/**
 * In-memory sliding-window rate limiter.
 * Safe for single-instance deployments (Vercel Fluid/Edge would need Redis).
 * Automatically garbage-collects expired windows to prevent memory leaks.
 */

interface Window {
  timestamps: number[];
  lastGc: number;
}

const store = new Map<string, Window>();

const WINDOW_MS = 60_000;   // 1 minute sliding window
const MAX_REQUESTS = 10;    // 10 requests per window per IP
const GC_INTERVAL_MS = 5 * 60_000; // GC stale entries every 5 minutes

function gc(): void {
  const now = Date.now();
  for (const [key, win] of store.entries()) {
    if (now - win.lastGc > GC_INTERVAL_MS) {
      win.timestamps = win.timestamps.filter((t) => now - t < WINDOW_MS);
      if (win.timestamps.length === 0) {
        store.delete(key);
      } else {
        win.lastGc = now;
      }
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms when window resets
}

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();

  // Lazy GC — run occasionally, not on every request
  if (Math.random() < 0.02) gc();

  let win = store.get(identifier);
  if (!win) {
    win = { timestamps: [], lastGc: now };
    store.set(identifier, win);
  }

  // Evict timestamps outside the sliding window
  win.timestamps = win.timestamps.filter((t) => now - t < WINDOW_MS);

  const remaining = Math.max(0, MAX_REQUESTS - win.timestamps.length - 1);
  const resetAt = win.timestamps.length > 0 ? win.timestamps[0] + WINDOW_MS : now + WINDOW_MS;

  if (win.timestamps.length >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt };
  }

  win.timestamps.push(now);
  return { allowed: true, remaining, resetAt };
}
