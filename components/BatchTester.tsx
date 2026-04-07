"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Play, X, CheckCircle2, XCircle, Loader2, Download } from "lucide-react";
import type { BatchEntry, ProviderId, ValidationResult } from "@/lib/types";
import { PROVIDER_LIST } from "@/lib/providers";
import { detectProvider } from "@/lib/detect-provider";
import { ProviderIcon } from "@/components/ProviderIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateId, maskKey, formatLatency } from "@/lib/utils";
import { addToHistory } from "@/lib/storage";
import { exportAsCSV, exportAsJSON } from "@/lib/storage";
import type { HistoryEntry } from "@/lib/types";

export function BatchTester() {
  const [entries, setEntries] = useState<BatchEntry[]>([
    { id: generateId(), key: "", status: "pending" },
  ]);
  const [running, setRunning] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const addRow = () => {
    setEntries((prev) => [...prev, { id: generateId(), key: "", status: "pending" }]);
  };

  const removeRow = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateKey = (id: string, key: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, key, status: "pending", result: undefined } : e))
    );
  };

  const updateProvider = (id: string, provider: ProviderId | "auto") => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, manualProvider: provider === "auto" ? undefined : provider, status: "pending", result: undefined }
          : e
      )
    );
  };

  const parseBulk = () => {
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const newEntries: BatchEntry[] = lines.map((key) => ({
      id: generateId(),
      key,
      status: "pending" as const,
    }));
    setEntries(newEntries.length > 0 ? newEntries : [{ id: generateId(), key: "", status: "pending" }]);
    setShowBulk(false);
    setBulkText("");
  };

  const runAll = useCallback(async () => {
    const toTest = entries.filter((e) => e.key.trim());
    if (toTest.length === 0) return;

    setRunning(true);

    for (const entry of toTest) {
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, status: "testing" } : e))
      );

      const detectedProvider = detectProvider(entry.key.trim());
      const provider = entry.manualProvider ?? (detectedProvider !== "unknown" ? detectedProvider : undefined);

      try {
        const res = await fetch("/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: entry.key.trim(), provider }),
        });

        const result: ValidationResult = await res.json();

        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, status: "done", result } : e
          )
        );

        if (res.ok) {
          addToHistory({ ...result, id: generateId() });
        }
      } catch {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  status: "error",
                  result: {
                    valid: false,
                    provider: entry.manualProvider ?? "unknown",
                    providerName: "Unknown",
                    keyPreview: maskKey(entry.key),
                    testedAt: new Date().toISOString(),
                    latencyMs: 0,
                    error: "Network error",
                  },
                }
              : e
          )
        );
      }
    }

    setRunning(false);
  }, [entries]);

  const doneEntries = entries.filter((e) => e.result);
  const validCount = doneEntries.filter((e) => e.result?.valid).length;

  const exportResults = (format: "json" | "csv") => {
    const historyEntries: HistoryEntry[] = doneEntries
      .filter((e) => e.result)
      .map((e) => ({ ...e.result!, id: e.id }));
    if (format === "json") exportAsJSON(historyEntries);
    else exportAsCSV(historyEntries);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowBulk((s) => !s)}>
            Bulk paste
          </Button>
          <Button variant="ghost" size="sm" onClick={addRow}>
            <Plus className="w-3.5 h-3.5" />
            Add row
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {doneEntries.length > 0 && (
            <>
              <Button variant="ghost" size="sm" onClick={() => exportResults("json")}>
                <Download className="w-3.5 h-3.5" />
                JSON
              </Button>
              <Button variant="ghost" size="sm" onClick={() => exportResults("csv")}>
                <Download className="w-3.5 h-3.5" />
                CSV
              </Button>
            </>
          )}
          <Button
            size="sm"
            onClick={runAll}
            loading={running}
            disabled={running || entries.every((e) => !e.key.trim())}
          >
            <Play className="w-3.5 h-3.5" />
            Run all
          </Button>
        </div>
      </div>

      {/* Bulk paste area */}
      <AnimatePresence>
        {showBulk && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <p className="text-xs text-muted-foreground">Paste one API key per line</p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="sk-...\nsk-ant-...\nhf_..."
                rows={6}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-muted-foreground/50"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={parseBulk} disabled={!bulkText.trim()}>
                  Load keys
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowBulk(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress summary */}
      {doneEntries.length > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <Badge variant="valid">
            <CheckCircle2 className="w-3 h-3" />
            {validCount} valid
          </Badge>
          <Badge variant="invalid">
            <XCircle className="w-3 h-3" />
            {doneEntries.length - validCount} invalid
          </Badge>
          <span className="text-muted-foreground text-xs">
            {doneEntries.length}/{entries.filter(e => e.key.trim()).length} tested
          </span>
        </div>
      )}

      {/* Entry rows */}
      <div className="space-y-2">
        {entries.map((entry, i) => (
          <BatchRow
            key={entry.id}
            entry={entry}
            index={i}
            onKeyChange={(k) => updateKey(entry.id, k)}
            onProviderChange={(p) => updateProvider(entry.id, p)}
            onRemove={() => removeRow(entry.id)}
            canRemove={entries.length > 1}
          />
        ))}
      </div>
    </div>
  );
}

function BatchRow({
  entry,
  index,
  onKeyChange,
  onProviderChange,
  onRemove,
  canRemove,
}: {
  entry: BatchEntry;
  index: number;
  onKeyChange: (key: string) => void;
  onProviderChange: (p: ProviderId | "auto") => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const detected = entry.key.trim() ? detectProvider(entry.key.trim()) : "unknown";
  const effective = entry.manualProvider ?? (detected !== "unknown" ? detected : null);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2"
    >
      <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{index + 1}</span>

      {/* Status indicator */}
      <div className="w-5 shrink-0 flex items-center justify-center">
        {entry.status === "testing" && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
        {entry.status === "done" && entry.result?.valid && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        {(entry.status === "done" && !entry.result?.valid) || entry.status === "error" ? (
          <XCircle className="w-4 h-4 text-red-400" />
        ) : null}
      </div>

      {/* Key input */}
      <input
        type="password"
        value={entry.key}
        onChange={(e) => onKeyChange(e.target.value)}
        placeholder={`API key ${index + 1}…`}
        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-muted-foreground/50 min-w-0"
        autoComplete="off"
        spellCheck={false}
      />

      {/* Provider select */}
      <div className="flex items-center gap-1.5 shrink-0">
        {effective && <ProviderIcon provider={effective} size="sm" />}
        <select
          value={entry.manualProvider ?? "auto"}
          onChange={(e) => onProviderChange(e.target.value as ProviderId | "auto")}
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
        >
          <option value="auto">{detected !== "unknown" ? `Auto (${detected})` : "Auto"}</option>
          {PROVIDER_LIST.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Result preview */}
      {entry.result && (
        <div className="text-xs shrink-0 hidden sm:block">
          {entry.result.valid ? (
            <span className="text-emerald-400">{formatLatency(entry.result.latencyMs)}</span>
          ) : (
            <span className="text-red-400 max-w-32 truncate block" title={entry.result.error}>
              {entry.result.error?.slice(0, 20)}…
            </span>
          )}
        </div>
      )}

      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}
