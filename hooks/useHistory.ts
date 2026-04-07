"use client";

import { useState, useEffect, useCallback } from "react";
import type { HistoryEntry } from "@/lib/types";
import { getHistory, removeFromHistory, clearHistory } from "@/lib/storage";

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(getHistory());
  }, []);

  const refresh = useCallback(() => {
    setEntries(getHistory());
  }, []);

  const remove = useCallback((id: string) => {
    removeFromHistory(id);
    setEntries(getHistory());
  }, []);

  const clear = useCallback(() => {
    clearHistory();
    setEntries([]);
  }, []);

  return { entries, refresh, remove, clear };
}
