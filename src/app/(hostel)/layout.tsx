"use client";

import { usePathname } from "next/navigation";

import { HostelShell } from "@/components/hostel/HostelShell";
import { HostelSessionProvider } from "@/components/hostel/session";

export default function HostelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/hostel/invite")) return children;
  return (
    <HostelSessionProvider>
      <HostelShell>{children}</HostelShell>
    </HostelSessionProvider>
  );
}
