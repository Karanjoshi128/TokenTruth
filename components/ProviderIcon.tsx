"use client";

import type { ProviderId } from "@/lib/types";
import { PROVIDERS } from "@/lib/providers";
import { cn } from "@/lib/utils";

const INITIALS: Record<ProviderId, string> = {
  openai: "OA",
  anthropic: "AN",
  google: "GG",
  cohere: "CO",
  huggingface: "HF",
  mistral: "MI",
  groq: "GQ",
  together: "TA",
  replicate: "RE",
  perplexity: "PP",
  unknown: "?",
};

interface ProviderIconProps {
  provider: ProviderId;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProviderIcon({ provider, size = "md", className }: ProviderIconProps) {
  const meta = PROVIDERS[provider];
  const initials = INITIALS[provider];

  return (
    <div
      className={cn(
        "rounded-lg flex items-center justify-center font-bold shrink-0",
        {
          "w-7 h-7 text-[10px]": size === "sm",
          "w-9 h-9 text-xs": size === "md",
          "w-12 h-12 text-sm": size === "lg",
        },
        className
      )}
      style={{ backgroundColor: meta.bgColor, color: meta.color, border: `1px solid ${meta.color}30` }}
      title={meta.name}
    >
      {initials}
    </div>
  );
}
