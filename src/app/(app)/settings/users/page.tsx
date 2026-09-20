"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UsersPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/settings/cashiers");
  }, [router]);
  return null;
}
