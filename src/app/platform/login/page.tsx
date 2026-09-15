"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlatformLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?role=platform");
  }, [router]);
  return <div className="grid min-h-screen place-items-center text-sm text-ink-700/70">Opening platform sign in…</div>;
}
