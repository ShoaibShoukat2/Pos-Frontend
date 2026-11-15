import { RentalShell } from "@/components/rental/RentalShell";

export default function RentalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full min-h-0">
      <RentalShell>{children}</RentalShell>
    </div>
  );
}
