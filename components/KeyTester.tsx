"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Eye, EyeOff, Zap, RotateCcw, Clipboard } from "lucide-react";
import type { ProviderId } from "@/lib/types";
import { PROVIDER_LIST } from "@/lib/providers";
import { detectProvider, getDetectionConfidence } from "@/lib/detect-provider";
import { useKeyTest } from "@/hooks/useKeyTest";
import { ResultCard } from "@/components/ResultCard";
import { ProviderIcon } from "@/components/ProviderIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface KeyTesterProps {
  prefillKey?: string;
  prefillProvider?: string;
}

export function KeyTester({ prefillKey, prefillProvider }: KeyTesterProps = {}) {
  const [key, setKey] = useState(prefillKey ?? "");
  const [showKey, setShowKey] = useState(false);
  const [manualProvider, setManualProvider] = useState<ProviderId | "auto">(
    (prefillProvider as ProviderId) ?? "auto"
  );
  const [detectedProvider, setDetectedProvider] = useState<ProviderId>("unknown");
  const inputRef = useRef<HTMLInputElement>(null);

  const { loading, result, error, testKey, reset } = useKeyTest();

  // Sync when prefill changes (e.g. from vault "Test" button)
  useEffect(() => {
    if (prefillKey) {
      setKey(prefillKey);
      if (prefillProvider && prefillProvider !== "unknown") {
        setManualProvider(prefillProvider as ProviderId);
      }
      reset();
    }
  }, [prefillKey, prefillProvider, reset]);

  // Auto-detect provider as user types
  useEffect(() => {
    if (key.trim()) {
      setDetectedProvider(detectProvider(key.trim()));
    } else {
      setDetectedProvider("unknown");
    }
  }, [key]);

  const effectiveProvider: ProviderId | undefined =
    manualProvider !== "auto" ? manualProvider : detectedProvider !== "unknown" ? detectedProvider : undefined;

  const confidence = key.trim() ? getDetectionConfidence(key.trim()) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    testKey(key.trim(), effectiveProvider);
  };

  const handlePasteFromClipboard = async () => {
    const text = await navigator.clipboard.readText().catch(() => "");
    if (text.trim()) {
      setKey(text.trim());
      reset();
    }
  };

  const handleReset = () => {
    setKey("");
    setManualProvider("auto");
    setDetectedProvider("unknown");
    reset();
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Key input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            API Key
          </label>
          <Input
            ref={inputRef}
            type={showKey ? "text" : "password"}
            value={key}
            onChange={(e) => { setKey(e.target.value); reset(); }}
            placeholder="Paste your API key here…"
            autoComplete="off"
            spellCheck={false}
            className="font-mono text-sm h-11"
            leftIcon={<Key className="w-4 h-4" />}
            rightElement={
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                  title={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            }
          />
        </div>

        {/* Provider row */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Provider
            </label>
            <div className="relative flex items-center gap-2">
              {effectiveProvider && (
                <div className="absolute left-2.5 z-10 pointer-events-none">
                  <ProviderIcon provider={effectiveProvider} size="sm" />
                </div>
              )}
              <Select
                value={manualProvider}
                onChange={(e) => setManualProvider(e.target.value as ProviderId | "auto")}
                className={effectiveProvider ? "pl-11" : ""}
              >
                <option value="auto">
                  {detectedProvider !== "unknown"
                    ? `Auto-detected: ${PROVIDER_LIST.find(p => p.id === detectedProvider)?.name}`
                    : "Auto-detect"}
                </option>
                <optgroup label="Select manually">
                  {PROVIDER_LIST.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
              </Select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pb-0">
            <Button
              type="submit"
              size="md"
              loading={loading}
              disabled={!key.trim() || loading}
              className="h-[42px] px-5"
            >
              <Zap className="w-4 h-4" />
              Test Key
            </Button>
            {(key || result) && (
              <Button
                type="button"
                variant="ghost"
                size="md"
                className="h-[42px] px-3"
                onClick={handleReset}
                title="Clear"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Auto-detection confidence badge */}
        <AnimatePresence>
          {key.trim() && manualProvider === "auto" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {detectedProvider !== "unknown" ? (
                  <>
                    <Badge variant={confidence === "high" ? "valid" : "warning"}>
                      {confidence ?? "low"} confidence
                    </Badge>
                    <span>Detected: {PROVIDER_LIST.find(p => p.id === detectedProvider)?.name ?? detectedProvider}</span>
                  </>
                ) : (
                  <Badge variant="warning">Provider undetected — select manually</Badge>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3"
          >
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence mode="wait">
        {result && <ResultCard key={result.testedAt} result={result} />}
      </AnimatePresence>
    </div>
  );
}
