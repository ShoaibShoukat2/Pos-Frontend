"use client";

import { AppShell } from "@/components/AppShell";
import { isGeneralRetail, useAuth } from "@/lib/auth";

export default function PosGroupLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="grid min-h-dvh place-items-center text-sm text-slate-400">Opening register…</div>;
  }
  if (isGeneralRetail(user)) return <AppShell>{children}</AppShell>;
  return children;
}
