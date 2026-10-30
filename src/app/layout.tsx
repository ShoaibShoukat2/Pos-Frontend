import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";

import { PwaRegister } from "@/components/PwaRegister";
import { TitleBar } from "@/components/TitleBar";
import { UpdateNotice } from "@/components/UpdateNotice";
import { AuthProvider } from "@/lib/auth";

import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: "Universal POS",
  description: "Universal POS, a product of Senvante. Founded and led by Shoaib Shoukat, CEO and Founder.",
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
      <body className={`${outfit.variable} ${fraunces.variable} font-sans flex flex-col h-screen overflow-hidden`}>
        <AuthProvider>
          <PwaRegister />
          <UpdateNotice />
          <TitleBar />
          <div className="flex-1 overflow-auto min-h-0">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
