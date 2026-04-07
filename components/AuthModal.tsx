"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Mail, Lock, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signup, login } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

type Tab = "login" | "signup";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const oauthError = searchParams.get("auth_error");

  const [loginState, loginAction, loginPending] = useActionState(login, undefined);
  const [signupState, signupAction, signupPending] = useActionState(signup, undefined);

  const isPending = loginPending || signupPending;
  const state = tab === "login" ? loginState : signupState;

  // On success: refresh server state (re-read session cookie) and close
  useEffect(() => {
    if (loginState?.success || signupState?.success) {
      router.refresh();
      onClose();
    }
  }, [loginState?.success, signupState?.success, router, onClose]);

  // Reset password visibility when switching tabs
  useEffect(() => {
    setShowPassword(false);
  }, [tab]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const action = tab === "login" ? loginAction : signupAction;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      aria-modal
      role="dialog"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-[#0f0f14] shadow-2xl shadow-black/50 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tab bar */}
        <div className="flex border-b border-white/10">
          {(["login", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors",
                tab === t
                  ? "text-foreground border-b-2 border-indigo-500"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "login" ? (
                <LogIn className="w-3.5 h-3.5" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              {t === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-5">
            {tab === "login"
              ? "Welcome back. Log in to access your key vault."
              : "Create an account to securely store your API keys."}
          </p>

          {/* Google OAuth error from redirect */}
          {oauthError && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {oauthError === "unverified"
                ? "Your Google account email is not verified."
                : "Google sign-in failed. Please try again."}
            </div>
          )}

          {/* Google Sign In */}
          <a
            href="/api/auth/google"
            className={cn(
              "flex items-center justify-center gap-2.5 w-full px-4 py-2.5 rounded-xl",
              "border border-white/15 bg-white/5 hover:bg-white/10 transition-colors",
              "text-sm font-medium"
            )}
          >
            <GoogleIcon />
            Continue with Google
          </a>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form action={action} className="space-y-4">
            {/* General error */}
            {state?.errors?.general && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {state.errors.general[0]}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="w-3.5 h-3.5" />}
                disabled={isPending}
                required
              />
              {state?.errors?.email && (
                <p className="text-xs text-red-400">{state.errors.email[0]}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                placeholder={tab === "signup" ? "At least 8 characters" : "Your password"}
                leftIcon={<Lock className="w-3.5 h-3.5" />}
                disabled={isPending}
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                }
              />
              {state?.errors?.password && (
                <p className="text-xs text-red-400">{state.errors.password[0]}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isPending}
              className="w-full mt-1"
            >
              {tab === "login" ? "Log in" : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {tab === "login" ? (
              <>
                No account?{" "}
                <button
                  onClick={() => setTab("signup")}
                  className="text-indigo-400 hover:text-indigo-300 underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setTab("login")}
                  className="text-indigo-400 hover:text-indigo-300 underline"
                >
                  Log in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
