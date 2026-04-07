"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Server,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Building2,
  Mail,
  Zap,
  Tag,
  FlaskConical,
} from "lucide-react";
import type { ValidationResult } from "@/lib/types";
import { PROVIDERS } from "@/lib/providers";
import { ProviderIcon } from "@/components/ProviderIcon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatLatency, formatDate } from "@/lib/utils";

interface ResultCardProps {
  result: ValidationResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const provider = PROVIDERS[result.provider];

  const copyResult = async () => {
    const text = JSON.stringify(
      {
        valid: result.valid,
        provider: result.providerName,
        keyPreview: result.keyPreview,
        testedAt: result.testedAt,
        latencyMs: result.latencyMs,
        models: result.models,
        organization: result.organization,
        tier: result.tier,
      },
      null,
      2
    );
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className={result.valid ? "border-emerald-500/30 shadow-emerald-500/5 shadow-lg" : "border-red-500/30 shadow-red-500/5 shadow-lg"}>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <ProviderIcon provider={result.provider} size="lg" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-base">{result.providerName}</h3>
                  <Badge variant={result.valid ? "valid" : "invalid"}>
                    {result.valid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Valid
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Invalid
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{result.keyPreview}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {provider.statusUrl && (
                <a
                  href={provider.statusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  title="Provider status page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <Button variant="ghost" size="sm" className="p-1.5 h-auto" onClick={copyResult}>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Error message */}
          {!result.valid && result.error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2.5">
              <p className="text-sm text-red-400">{result.error}</p>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetaItem icon={<Clock className="w-3.5 h-3.5" />} label="Latency" value={formatLatency(result.latencyMs)} />
            <MetaItem icon={<Server className="w-3.5 h-3.5" />} label="Tested at" value={formatDate(result.testedAt)} />
            {result.tier && (
              <MetaItem icon={<Tag className="w-3.5 h-3.5" />} label="Tier" value={result.tier} />
            )}
            {result.organization && (
              <MetaItem icon={<Building2 className="w-3.5 h-3.5" />} label="Organization" value={result.organization} />
            )}
            {result.email && (
              <MetaItem icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={result.email} truncate />
            )}
            {result.rateLimitRpm && (
              <MetaItem icon={<Zap className="w-3.5 h-3.5" />} label="RPM limit" value={result.rateLimitRpm.toLocaleString()} />
            )}
          </div>

          {/* Extra metadata */}
          {result.extra && Object.keys(result.extra).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(result.extra)
                .filter(([, v]) => typeof v === "string" || typeof v === "number" || typeof v === "boolean")
                .map(([k, v]) => (
                  <MetaItem key={k} icon={<Tag className="w-3.5 h-3.5" />} label={k} value={String(v)} />
                ))}
            </div>
          )}

          {/* Deep test result */}
          {result.deepTestResult && (
            <div
              className={`rounded-lg border px-3.5 py-2.5 flex items-start gap-3 ${
                result.deepTestResult.success
                  ? "bg-emerald-500/8 border-emerald-500/25"
                  : "bg-amber-500/8 border-amber-500/25"
              }`}
            >
              <FlaskConical
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  result.deepTestResult.success ? "text-emerald-400" : "text-amber-400"
                }`}
              />
              <div className="min-w-0">
                <p className={`text-xs font-medium ${result.deepTestResult.success ? "text-emerald-400" : "text-amber-400"}`}>
                  {result.deepTestResult.success ? "Generation confirmed" : "Generation failed"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {result.deepTestResult.success ? (
                    <>
                      Model: <span className="font-mono">{result.deepTestResult.model}</span>
                      {" · "}+{result.deepTestResult.latencyMs}ms
                      {result.deepTestResult.tokensUsed !== undefined && (
                        <> · {result.deepTestResult.tokensUsed} token{result.deepTestResult.tokensUsed !== 1 ? "s" : ""} used</>
                      )}
                    </>
                  ) : (
                    result.deepTestResult.error ?? "Unknown error"
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Models list */}
          {result.models && result.models.length > 0 && (
            <div>
              <button
                onClick={() => setShowModels((s) => !s)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showModels ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {result.models.length} models accessible
              </button>
              <AnimatePresence>
                {showModels && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                      {result.models.map((model) => (
                        <span
                          key={model}
                          className="px-2 py-0.5 rounded-md bg-white/8 border border-white/10 text-xs font-mono text-muted-foreground"
                        >
                          {model}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MetaItem({
  icon,
  label,
  value,
  truncate,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/8 px-3 py-2">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className={`text-sm font-medium ${truncate ? "truncate" : ""}`} title={value}>
        {value}
      </p>
    </div>
  );
}
