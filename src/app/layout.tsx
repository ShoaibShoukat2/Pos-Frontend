import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";

import { PwaRegister } from "@/components/PwaRegister";
import { AuthProvider } from "@/lib/auth";
import { BranchProvider } from "@/lib/branch";

import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: "Universal POS",
  description: "Multi-branch POS with offline selling, loyalty and reports",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#14110e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} font-sans`}>
        <AuthProvider>
          <BranchProvider>
            <PwaRegister />
            {children}
          </BranchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
