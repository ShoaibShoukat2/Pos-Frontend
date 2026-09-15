import { CashierShell } from "@/components/CashierShell";

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  return <CashierShell>{children}</CashierShell>;
}
