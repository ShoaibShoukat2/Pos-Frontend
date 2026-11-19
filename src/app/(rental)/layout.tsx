import { Noto_Nastaliq_Urdu } from "next/font/google";

import { RentalShell } from "@/components/rental/RentalShell";

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-nastaliq",
});

export default function RentalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`h-full min-h-0 ${nastaliq.variable}`}>
      <RentalShell>{children}</RentalShell>
    </div>
  );
}
