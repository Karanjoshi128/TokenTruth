"use client";

import { useState, useCallback } from "react";
import type { ValidationResult, ProviderId } from "@/lib/types";
import { addToHistory } from "@/lib/storage";
import { generateId } from "@/lib/utils";

interface TestState {
  loading: boolean;
  result: ValidationResult | null;
  error: string | null;
}

export function useKeyTest() {
  const [state, setState] = useState<TestState>({
    loading: false,
    result: null,
    error: null,
  });

  const testKey = useCallback(async (key: string, provider?: ProviderId) => {
    setState({ loading: true, result: null, error: null });

    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim(), provider }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState({ loading: false, result: null, error: data.error ?? "Validation failed" });
        return;
      }

      const result: ValidationResult = data;
      setState({ loading: false, result, error: null });

      // Persist to history
      addToHistory({ ...result, id: generateId() });
    } catch (err) {
      setState({
        loading: false,
        result: null,
        error: err instanceof Error ? err.message : "Network error",
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, result: null, error: null });
  }, []);

  return { ...state, testKey, reset };
}
