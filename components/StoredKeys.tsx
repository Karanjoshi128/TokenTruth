"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Copy,
  Check,
  Zap,
  KeyRound,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProviderIcon } from "@/components/ProviderIcon";
import { detectProvider } from "@/lib/detect-provider";
import { PROVIDERS } from "@/lib/providers";
import { cn } from "@/lib/utils";
import type { ProviderId } from "@/lib/types";

interface StoredKeyRow {
  id: string;
  label: string;
  provider: string;
  keyPreview: string;
  createdAt: string;
  updatedAt: string;
}

function AddKeyForm({ onAdded }: { onAdded: () => void }) {
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [detectedProvider, setDetectedProvider] = useState<ProviderId>("unknown");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detected = detectProvider(key);
    setDetectedProvider(detected);
    if (detected !== "unknown" && !label) {
      const meta = PROVIDERS[detected];
      if (meta) setLabel(`${meta.name} Key`);
    }
  }, [key]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim(), label: label.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save key");
      }
      setKey("");
      setLabel("");
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const providerMeta = PROVIDERS[detectedProvider];

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3"
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Add a key
      </p>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Key input */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">API Key</label>
        <Input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          type={showKey ? "text" : "password"}
          placeholder="Paste your API key here…"
          leftIcon={<KeyRound className="w-3.5 h-3.5" />}
          disabled={loading}
          rightElement={
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          }
        />
        {/* Auto-detect badge */}
        {key && (
          <div className="flex items-center gap-1.5 text-xs">
            <ProviderIcon provider={detectedProvider as ProviderId} size="sm" />
            <span className="text-muted-foreground">
              Detected:{" "}
              <span
                className={cn(
                  "font-medium",
                  detectedProvider !== "unknown" ? "text-emerald-400" : "text-muted-foreground"
                )}
              >
                {providerMeta?.name ?? "Unknown provider"}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Label input */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Label (optional)</label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          type="text"
          placeholder="e.g. Production OpenAI key"
          disabled={loading}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="sm"
        loading={loading}
        disabled={!key.trim()}
        className="w-full"
      >
        <Plus className="w-3.5 h-3.5" />
        Save key to vault
      </Button>
    </form>
  );
}

function KeyCard({
  row,
  onDelete,
  onTestKey,
}: {
  row: StoredKeyRow;
  onDelete: (id: string) => void;
  onTestKey: (key: string, provider: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testing, setTesting] = useState(false);
  const provider = (row.provider as ProviderId) || "unknown";
  const providerMeta = PROVIDERS[provider] ?? PROVIDERS["unknown"];

  async function handleCopy() {
    try {
      const res = await fetch(`/api/keys/${row.id}`);
      if (!res.ok) throw new Error();
      const { key } = await res.json();
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fail
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch(`/api/keys/${row.id}`);
      if (!res.ok) throw new Error();
      const { key } = await res.json();
      onTestKey(key, row.provider);
    } finally {
      setTesting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/keys/${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDelete(row.id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="rounded-xl border border-white/10 bg-white/[0.025] p-3.5 flex items-center gap-3"
    >
      {/* Provider icon */}
      <div className="shrink-0">
        <ProviderIcon provider={provider} size="sm" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{row.label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-xs font-mono text-muted-foreground truncate"
            style={{ color: providerMeta.color, opacity: 0.85 }}
          >
            {row.keyPreview}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          title="Copy key"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          onClick={handleTest}
          disabled={testing}
          className="p-1.5 rounded-md text-muted-foreground hover:text-indigo-400 hover:bg-white/10 transition-colors disabled:opacity-50"
          title="Test this key"
        >
          {testing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-white/10 transition-colors disabled:opacity-50"
          title="Delete key"
        >
          {deleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </motion.div>
  );
}

interface StoredKeysProps {
  onTestKey: (key: string, provider: string) => void;
}

export function StoredKeys({ onTestKey }: StoredKeysProps) {
  const [keys, setKeys] = useState<StoredKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/keys");
      if (!res.ok) return;
      const data = await res.json();
      setKeys(data.keys ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  function handleDelete(id: string) {
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  function handleAdded() {
    setShowAddForm(false);
    fetchKeys();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading vault…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Key Vault</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {keys.length === 0
              ? "No keys stored yet"
              : `${keys.length} key${keys.length !== 1 ? "s" : ""} — encrypted at rest`}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAddForm((v) => !v)}
        >
          <Plus className="w-3.5 h-3.5" />
          {showAddForm ? "Cancel" : "Add key"}
        </Button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <AddKeyForm onAdded={handleAdded} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key cards */}
      {keys.length === 0 && !showAddForm ? (
        <div className="rounded-xl border border-dashed border-white/15 py-10 text-center">
          <KeyRound className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Your vault is empty</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Click "Add key" to securely store your first API key
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {keys.map((row) => (
              <KeyCard
                key={row.id}
                row={row}
                onDelete={handleDelete}
                onTestKey={onTestKey}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/50 text-center">
        Keys are encrypted with AES-256-GCM · Never transmitted unencrypted
      </p>
    </div>
  );
}
