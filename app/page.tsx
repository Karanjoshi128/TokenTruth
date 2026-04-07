"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Lock, Layers, KeyRound } from "lucide-react";
import { KeyTester } from "@/components/KeyTester";
import { BatchTester } from "@/components/BatchTester";
import { History } from "@/components/History";
import { StoredKeys } from "@/components/StoredKeys";
import { useAuth } from "@/components/AuthProvider";
import { PROVIDER_LIST } from "@/lib/providers";
import { ProviderIcon } from "@/components/ProviderIcon";
import { cn } from "@/lib/utils";

const BASE_TABS = [
  { id: "single", label: "Single Key", icon: Zap },
  { id: "batch", label: "Batch Test", icon: Layers },
] as const;

const VAULT_TAB = { id: "vault", label: "Vault", icon: KeyRound } as const;

type BaseTab = (typeof BASE_TABS)[number]["id"];
type Tab = BaseTab | "vault";

export default function Home() {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>("single");

  // When a vault key's "Test" button is clicked, pre-fill and switch to single tab
  const [prefillKey, setPrefillKey] = useState<string | undefined>();
  const [prefillProvider, setPrefillProvider] = useState<string | undefined>();

  function handleTestFromVault(key: string, provider: string) {
    setPrefillKey(key);
    setPrefillProvider(provider);
    setTab("single");
  }

  const tabs = session ? [...BASE_TABS, VAULT_TAB] : BASE_TABS;

  return (
    <div className="min-h-full">
      {/* Hero */}
      <section className="relative overflow-hidden pb-8 pt-16 sm:pt-20">
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-start justify-center"
        >
          <div className="h-[400px] w-[600px] rounded-full bg-indigo-600/10 blur-[120px] -translate-y-1/3" />
        </div>

        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-muted-foreground mb-6">
              <Lock className="w-3 h-3 text-emerald-400" />
              Keys are never stored · 100% private
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Truth<span className="text-indigo-400">Token</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
              Instantly verify your API keys across 10+ AI providers. Get rich metadata — model
              access, rate limits, org info — in seconds.
            </p>
          </motion.div>

          {/* Provider icons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex items-center justify-center gap-2 mt-8 flex-wrap"
          >
            {PROVIDER_LIST.map((p) => (
              <div key={p.id} title={p.name}>
                <ProviderIcon provider={p.id} size="sm" />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main card */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/20"
        >
          {/* Tab bar + History */}
          <div className="flex items-center justify-between px-5 pt-4 pb-0">
            <div className="flex gap-0.5 p-1 rounded-lg bg-white/5 border border-white/10">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id as Tab)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      active
                        ? t.id === "vault"
                          ? "bg-indigo-600/80 text-white shadow-sm"
                          : "bg-indigo-600 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                    {t.id === "vault" && (
                      <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    )}
                  </button>
                );
              })}
            </div>
            {tab !== "vault" && <History />}
          </div>

          {/* Content */}
          <div className="p-5">
            {tab === "single" ? (
              <KeyTester prefillKey={prefillKey} prefillProvider={prefillProvider} />
            ) : tab === "batch" ? (
              <BatchTester />
            ) : (
              <StoredKeys onTestKey={handleTestFromVault} />
            )}
          </div>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 grid grid-cols-3 gap-3"
        >
          {[
            {
              icon: <Lock className="w-4 h-4 text-emerald-400" />,
              title: "Zero storage",
              desc: "Keys are forwarded to providers and immediately discarded",
            },
            {
              icon: <Zap className="w-4 h-4 text-indigo-400" />,
              title: "Rich results",
              desc: "Model access, rate limits, org info — not just pass/fail",
            },
            {
              icon: <ShieldCheck className="w-4 h-4 text-sky-400" />,
              title: "Local history",
              desc: "Results saved in your browser only. Never leaves your device.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-center"
            >
              <div className="flex justify-center mb-2">{item.icon}</div>
              <p className="text-xs font-semibold mb-0.5">{item.title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
