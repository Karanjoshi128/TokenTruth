"use client";

import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/components/AuthProvider";
import { logout } from "@/lib/auth-actions";
import { ShieldCheck, LogOut, KeyRound, ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = email.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition-colors",
          "border border-white/15 hover:bg-white/10 hover:border-white/25"
        )}
      >
        <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
          {initials}
        </span>
        <span className="text-xs font-medium max-w-[120px] truncate hidden sm:block">
          {email}
        </span>
        <ChevronDown
          className={cn(
            "w-3 h-3 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-white/15 bg-[#0f0f14] shadow-xl overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-white/10">
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
          <div className="p-1">
            <form action={logout} onSubmit={() => setOpen(false)}>
              <button
                type="submit"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { session } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">
              Truth<span className="text-indigo-400">Token</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Vault indicator when logged in */}
            {session && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-medium">
                <KeyRound className="w-3 h-3" />
                <span className="hidden sm:inline">Vault active</span>
              </div>
            )}

            <a
              href="https://github.com/Karanjoshi128?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors text-xs font-mono"
              aria-label="GitHub"
            >
              {"</>"}
            </a>

            <ThemeToggle />

            {session ? (
              <UserMenu email={session.email} />
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/15 hover:bg-white/10 hover:border-white/25 transition-colors"
              >
                Login / Sign up
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
