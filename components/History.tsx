"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History as HistoryIcon,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  X,
  ChevronRight,
} from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { exportAsJSON, exportAsCSV } from "@/lib/storage";
import { ProviderIcon } from "@/components/ProviderIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatLatency } from "@/lib/utils";

export function History({ onRetest }: { onRetest?: (keyPreview: string, provider: string) => void }) {
  const { entries, refresh, remove, clear } = useHistory();
  const [open, setOpen] = useState(false);

  // Refresh when opening
  const toggle = () => {
    if (!open) refresh();
    setOpen((s) => !s);
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={toggle}
        className="gap-2"
      >
        <HistoryIcon className="w-3.5 h-3.5" />
        History
        {entries.length > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold leading-none">
            {entries.length}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-10 z-50 w-[420px] max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <HistoryIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Test History</span>
                  <Badge variant="neutral">{entries.length}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  {entries.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => exportAsJSON(entries)}
                        title="Export JSON"
                      >
                        <Download className="w-3 h-3" />
                        JSON
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => exportAsCSV(entries)}
                        title="Export CSV"
                      >
                        <Download className="w-3 h-3" />
                        CSV
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/10"
                        onClick={clear}
                        title="Clear all history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setOpen(false)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Entries */}
              <div className="max-h-[420px] overflow-y-auto divide-y divide-white/5">
                {entries.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    No test history yet.
                    <br />
                    <span className="text-xs">Results are stored locally in your browser.</span>
                  </div>
                ) : (
                  entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                    >
                      <ProviderIcon provider={entry.provider} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{entry.providerName}</span>
                          {entry.valid ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-muted-foreground truncate">
                            {entry.keyPreview}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 shrink-0">
                            {formatLatency(entry.latencyMs)}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/50">
                          {formatDate(entry.testedAt)}
                        </span>
                      </div>
                      <button
                        onClick={() => remove(entry.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-400 transition-all"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-white/5">
                <p className="text-[10px] text-muted-foreground/50 text-center">
                  Stored locally in your browser · Never sent to any server · Auto-expires after 90 days
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
