"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SessionPayload } from "@/lib/session";

type AuthContextValue = {
  session: SessionPayload | null;
};

const AuthContext = createContext<AuthContextValue>({ session: null });

export function AuthProvider({
  children,
  session,
}: {
  children: ReactNode;
  session: SessionPayload | null;
}) {
  return <AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
