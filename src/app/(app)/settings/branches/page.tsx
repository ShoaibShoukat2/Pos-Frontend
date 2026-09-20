"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BranchesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/settings/business");
  }, [router]);
  return null;
}
