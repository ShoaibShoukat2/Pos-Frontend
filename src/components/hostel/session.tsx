"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { HostelSession } from "@/lib/hostel";

const HostelContext = createContext<{ session: HostelSession | null; loading: boolean; reload: () => Promise<void> } | null>(null);

export function HostelSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<HostelSession | null>(null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    const next = await api<HostelSession>("/api/hostel/me/");
    setSession(next);
  }

  useEffect(() => {
    let alive = true;
    reload()
      .catch(() => { if (alive) setSession(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return <HostelContext.Provider value={{ session, loading, reload }}>{children}</HostelContext.Provider>;
}

export function useHostel() {
  const ctx = useContext(HostelContext);
  if (!ctx) throw new Error("useHostel must be used in the hostel workspace");
  return ctx;
}
