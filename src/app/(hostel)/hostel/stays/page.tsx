"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StaysRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/hostel/customers");
  }, [router]);
  return <p className="text-sm text-slate-400">Opening customers…</p>;
}
