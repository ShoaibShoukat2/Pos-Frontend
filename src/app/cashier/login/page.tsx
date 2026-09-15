"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CashierLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?role=cashier");
  }, [router]);
  return <div className="grid min-h-screen place-items-center text-sm text-ink-700/70">Opening cashier sign in…</div>;
}
