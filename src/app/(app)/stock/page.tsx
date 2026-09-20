"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StockPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/products");
  }, [router]);
  return null;
}
