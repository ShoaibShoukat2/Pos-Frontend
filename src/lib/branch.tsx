"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api, getBranchId, setBranchId } from "./api";
import { useAuth } from "./auth";
import type { Branch } from "./types";

type BranchContextValue = {
  branches: Branch[];
  branchId: string | null;
  branch: Branch | null;
  setBranch: (id: string | null) => void;
  canSeeAll: boolean;
};

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { user, can } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setSelected] = useState<string | null>(null);

  const canSeeAll = !!user && (user.is_owner || can("branch.view") || can("branch.reports"));

  useEffect(() => {
    if (!user || user.is_platform_admin) {
      setBranches([]);
      return;
    }
    api<Branch[]>("/api/auth/branches/")
      .then((rows) => {
        const active = rows.filter((b) => b.is_active);
        setBranches(active);
        const stored = getBranchId();
        const next =
          (stored && active.some((b) => b.id === stored) && stored) ||
          user.default_branch ||
          active[0]?.id ||
          null;
        setSelected(next);
        setBranchId(next);
      })
      .catch(() => {});
  }, [user]);

  const value = useMemo<BranchContextValue>(
    () => ({
      branches,
      branchId,
      branch: branches.find((b) => b.id === branchId) || null,
      canSeeAll,
      setBranch(id) {
        setSelected(id);
        setBranchId(id);
      },
    }),
    [branches, branchId, canSeeAll],
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}
