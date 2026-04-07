import { NextRequest, NextResponse } from "next/server";
import type { ProviderId } from "@/lib/types";
import { detectProvider } from "@/lib/detect-provider";
import { runValidator } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Maximum allowed API key length. Real keys top out around 200 chars. */
const MAX_KEY_LENGTH = 512;

/** Maximum request body size in bytes. */
const MAX_BODY_BYTES = 2048;

/** Exhaustive whitelist of valid provider IDs the server will accept. */
const VALID_PROVIDERS = new Set<string>([
  "openai", "anthropic", "google", "cohere", "huggingface",
  "mistral", "groq", "together", "replicate", "perplexity",
]);

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
        },
      }
    );
  }

  // ── Body size guard ────────────────────────────────────────────────────────
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  // ── Parse & validate body ──────────────────────────────────────────────────
  let key: string;
  let rawProvider: unknown;
  let deepTest = false;

  try {
    const body = await req.json();
    key = body.key;
    rawProvider = body.provider;
    if (body.deepTest === true) deepTest = true;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Key must be a non-empty string within length bounds
  if (typeof key !== "string" || key.trim().length === 0) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }
  if (key.length > MAX_KEY_LENGTH) {
    return NextResponse.json({ error: "API key exceeds maximum allowed length" }, { status: 400 });
  }

  // Provider must be absent or a known string from our whitelist
  let provider: ProviderId | undefined;
  if (rawProvider !== undefined && rawProvider !== null && rawProvider !== "auto") {
    if (typeof rawProvider !== "string" || !VALID_PROVIDERS.has(rawProvider)) {
      return NextResponse.json({ error: "Invalid provider specified" }, { status: 400 });
    }
    provider = rawProvider as ProviderId;
  }

  const trimmedKey = key.trim();

  // ── Provider resolution ────────────────────────────────────────────────────
  const resolvedProvider: ProviderId =
    provider ?? detectProvider(trimmedKey);

  if (resolvedProvider === "unknown") {
    return NextResponse.json(
      { error: "Could not detect provider from the key format. Please select one manually." },
      { status: 422 }
    );
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  try {
    const result = await runValidator(trimmedKey, resolvedProvider, deepTest);

    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": String(rl.remaining),
        "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
      },
    });
  } catch (err) {
    // Do NOT echo raw error — could contain key material or stack traces
    const message = err instanceof Error ? err.message : "Validation failed";
    const isSafe = message.length < 200 && !message.includes(trimmedKey);
    return NextResponse.json(
      { error: isSafe ? message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
