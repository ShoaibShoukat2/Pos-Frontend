"use client";

import Link from "next/link";
import { homeFor, useAuth } from "@/lib/auth";

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,#e8a04a33,transparent_28%),radial-gradient(circle_at_80%_10%,#1c181414,transparent_24%),#fbf7f0]">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6 sm:py-6">
        <p className="font-display text-2xl">Universal POS</p>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link href="/login" className="btn-ghost">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary">
            Create business
          </Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:gap-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-600">
            One core. Many businesses.
          </p>
          <h1 className="mt-3 font-display text-3xl leading-[1.08] text-ink-950 sm:text-5xl lg:text-6xl">
            A POS that starts with the shop, not the register.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-700/75">
            Business setup, branches, products, POS sales, stock, purchases and reports — priced in
            Pakistani rupees, with simple ticket totals.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={user ? homeFor(user) : "/register"} className="btn-copper">
              {loading ? "Checking session…" : user ? "Open workspace" : "Start onboarding"}
            </Link>
            <Link href="/login" className="btn-ghost">
              Sign in by role
            </Link>
          </div>
        </div>
        <div className="card p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-copper-600">Now shipping</p>
          <ul className="mt-4 space-y-3 text-sm text-ink-800">
            <li className="rounded-xl bg-paper-50 px-4 py-3">1 · Business profile, branches and invoices</li>
            <li className="rounded-xl bg-paper-50 px-4 py-3">2 · Owner, Admin, Manager, Cashier, Accountant + custom roles</li>
            <li className="rounded-xl bg-paper-50 px-4 py-3">3 · Products, POS, stock, purchases and reports</li>
          </ul>
        </div>
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-ink-700/45 sm:px-6">
        <Link href="/login?role=platform" className="hover:text-ink-700">
          Platform admin
        </Link>
      </footer>
    </div>
  );
}
