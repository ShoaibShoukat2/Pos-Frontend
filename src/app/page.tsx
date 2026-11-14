"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Banknote,
  Menu,
  Monitor,
  Package,
  Receipt,
  RotateCcw,
  ShoppingBag,
  Truck,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  X,
  Zap,
} from "lucide-react";

import { homeFor, useAuth } from "@/lib/auth";

const NAV = [
  { href: "#features",   label: "Features" },
  { href: "#industries", label: "Industries" },
  { href: "#how",        label: "How it works" },
  { href: "#pricing",    label: "Pricing" },
  { href: "#download",   label: "Download" },
];

const FEATURES = [
  { icon: Monitor, title: "POS Counter", text: "Scan barcodes, pick items, accept cash, card or bank — ticket done in seconds." },
  { icon: Package, title: "Products & Stock", text: "Full catalog with variants, barcodes, cost and selling price. Stock tracks itself." },
  { icon: Receipt, title: "Invoice Slip", text: "Clean thermal receipt with item, qty, rate, total and change. 58mm, 80mm or A4." },
  { icon: Users, title: "Customer Accounts", text: "Named customers with credit balance, purchase history and receivable tracking." },
  { icon: Truck, title: "Purchase & Suppliers", text: "Create purchase orders, receive goods, track what the shop still owes." },
  { icon: Wallet, title: "Cash Drawer", text: "Open a shift, watch every cash movement, close against expected total." },
  { icon: Banknote, title: "Expenses", text: "Log every shop expense so profit is real — not just the sales number." },
  { icon: BarChart3, title: "Owner Dashboard", text: "Live sales, top products, P&L, receivables and staff — one screen." },
  { icon: Wrench, title: "Services", text: "Sell labour and services alongside physical products." },
  { icon: RotateCcw, title: "Returns", text: "Process a return against the original ticket. Stock goes back, cash goes out." },
  { icon: ShoppingBag, title: "Promotions", text: "Percent off, fixed amount, BOGO — applied automatically at the counter." },
  { icon: UserPlus, title: "Staff & Roles", text: "Owner sees everything. Cashier sees the counter. Set roles, set permissions." },
];

const INDUSTRIES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    title: "Grocery",
    text: "Fast tickets, accurate stock on hand, daily sales picture.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
      </svg>
    ),
    title: "Clothing",
    text: "Variants, sizes, colors — the cashier searches, not scrolls.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/>
      </svg>
    ),
    title: "Restaurant",
    text: "Counter sales, printed slip, category sales on the owner view.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="m9 3-6 6 6 6"/><path d="m15 3 6 6-6 6"/><rect width="20" height="4" x="2" y="17" rx="1"/>
      </svg>
    ),
    title: "Pharmacy",
    text: "Products, customers and a clean record of what left the shelf.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect width="14" height="20" x="5" y="2" rx="2"/><path d="M15 2v20"/><path d="M9 7h1"/><path d="M9 12h1"/><path d="M9 17h1"/>
      </svg>
    ),
    title: "Electronics",
    text: "Higher-value items, purchase invoices, full history.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: "General Retail",
    text: "One setup for a shop that sells a mixed counter.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M19 17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11l3 4v6a2 2 0 0 1-2 2z"/><path d="M12 17v-6"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>
      </svg>
    ),
    title: "Car Showroom",
    text: "Full inventory, purchase & sale tracking, profit per car, customer dues.",
  },
];

const STEPS = [
  { n: "1", title: "Create your business", text: "Register in 30 seconds — owner account, branch, PKR currency and GST ready." },
  { n: "2", title: "Add products & cashier", text: "Upload your catalog. Give the cashier their own login." },
  { n: "3", title: "Start selling", text: "The counter goes live. Every sale logs itself." },
  { n: "4", title: "Read the day", text: "Check the dashboard before you lock up. Sales, profit, stock." },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const startHref = user ? homeFor(user) : "/register";
  const startLabel = loading ? "Loading…" : user ? "Open workspace" : "Start free";

  return (
    <div className="min-h-dvh bg-paper-50 text-ink-900">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/95 text-white backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1.2" fill="#a5b4fc" />
                <rect x="8" y="1" width="5" height="5" rx="1.2" fill="#a5b4fc" opacity="0.6" />
                <rect x="1" y="8" width="5" height="5" rx="1.2" fill="#a5b4fc" opacity="0.6" />
                <rect x="8" y="8" width="5" height="5" rx="1.2" fill="#a5b4fc" opacity="0.3" />
              </svg>
            </div>
            <span className="font-display text-xl text-white">Universal POS</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-white/65 lg:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/login" className="rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white">
              Sign in
            </Link>
            <Link href={startHref} className="btn btn-copper gap-1.5 text-sm">
              {startLabel} <ArrowRight size={14} />
            </Link>
          </div>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-white lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {open && (
          <div className="border-t border-white/10 bg-ink-950 px-4 pb-5 pt-4 lg:hidden">
            <nav className="grid gap-0.5">
              {NAV.map((item) => (
                <a key={item.href} href={item.href} className="rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/10" onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 grid gap-2">
              <Link href="/login" className="btn w-full border border-white/15 bg-white/5 text-center text-sm text-white" onClick={() => setOpen(false)}>Sign in</Link>
              <Link href={startHref} className="btn btn-copper w-full text-center text-sm" onClick={() => setOpen(false)}>{startLabel}</Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-ink-950 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_15%_0%,rgba(99,102,241,0.45),transparent_55%),radial-gradient(ellipse_50%_40%_at_90%_20%,rgba(129,140,248,0.2),transparent_50%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-24">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5">
                <Zap size={12} className="text-copper-300" />
                <span className="text-xs font-medium text-white/85">Built for Pakistani shops — PKR, GST ready</span>
              </div>

              <h1 className="max-w-xl font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                The counter, stock and cash —{" "}
                <span className="text-copper-300">one POS.</span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg">
                Sell at the counter, print an invoice, track stock and see today&apos;s money.
                Owner watches the numbers. Cashier stays on the sale.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={startHref} className="btn btn-copper w-full gap-2 sm:w-auto">
                  {startLabel} <ArrowRight size={15} />
                </Link>
                <a href="#features" className="btn w-full border border-white/15 bg-white/5 text-white hover:bg-white/10 sm:w-auto">
                  See what&apos;s included
                </a>
              </div>

              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6">
                {[
                  ["Web + Windows", "One account"],
                  ["Owner + cashier", "Separate logins"],
                  ["First month", "Free"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="text-[11px] uppercase tracking-wide text-white/40">{label}</dt>
                    <dd className="mt-1 text-sm font-medium text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Dashboard preview card */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white text-ink-950 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)]">
              {/* Card top bar */}
              <div className="flex items-center justify-between border-b border-paper-200 bg-ink-950 px-5 py-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-copper-400">Owner dashboard</p>
                  <p className="mt-0.5 font-display text-xl text-paper-50">Today's overview</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-paper-50/70">Live</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 divide-x divide-paper-200 border-b border-paper-200">
                {[
                  { label: "Sales", value: "Rs 84,200" },
                  { label: "Orders", value: "47" },
                  { label: "Net profit", value: "Rs 21,600" },
                ].map((s) => (
                  <div key={s.label} className="px-4 py-4 sm:px-6">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-ink-700/40">{s.label}</p>
                    <p className="mt-1 font-display text-xl text-ink-950 sm:text-2xl">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Product rows */}
              <div className="divide-y divide-paper-200 px-5 py-1">
                {[
                  { name: "Basmati Rice 5kg", cat: "Grocery", qty: "18", rev: "Rs 12,600" },
                  { name: "Surf Excel 1kg", cat: "Cleaning", qty: "31", rev: "Rs 9,300" },
                  { name: "Olpers Milk 1L", cat: "Dairy", qty: "54", rev: "Rs 8,100" },
                ].map((row) => (
                  <div key={row.name} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-950">{row.name}</p>
                      <p className="text-xs text-ink-700/45">{row.cat} · {row.qty} sold</p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-ink-950">{row.rev}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-paper-200 bg-paper-50 px-5 py-3 text-center text-xs text-ink-700/40">
                Sample data — your actual numbers show here
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust strip ── */}
        <section className="border-b border-paper-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-5 sm:grid-cols-3 sm:px-6">
            {[
              { title: "Owner + Cashier", sub: "Separate logins. Each person sees only what they need." },
              { title: "Rupee-first", sub: "PKR totals, GST setup, thermal receipts out of the box." },
              { title: "Web + Desktop", sub: "Use it in the browser or install the Windows desktop app." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-paper-200 bg-paper-50 px-5 py-4">
                <p className="font-medium text-ink-950">{f.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-700/60">{f.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper-600">Features</p>
            <h2 className="mt-2 font-display text-3xl text-ink-950 sm:text-4xl">
              Everything a shop needs. Nothing it doesn't.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="group rounded-2xl border border-paper-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-copper-300 hover:shadow-card">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 font-medium text-ink-950">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-700/60">{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Industries ── */}
        <section id="industries" className="scroll-mt-20 bg-ink-950">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper-400">Industries</p>
              <h2 className="mt-2 font-display text-3xl text-paper-50 sm:text-4xl">
                Built for the shop you already run.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {INDUSTRIES.map((item) => (
                <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/20 hover:bg-white/[0.08]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white/80">
                    {item.icon}
                  </div>
                  <h3 className="mt-3 font-medium text-paper-50">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-paper-50/55">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="scroll-mt-20 border-b border-paper-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper-600">How it works</p>
              <h2 className="mt-2 font-display text-3xl text-ink-950 sm:text-4xl">
                Up and running in four steps.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {STEPS.map((step) => (
                <article key={step.n} className="rounded-2xl border border-paper-200 bg-paper-50 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 font-display text-lg text-white">
                    {step.n}
                  </div>
                  <h3 className="mt-4 font-medium text-ink-950">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-700/60">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Desktop Download ── */}
        <section id="download" className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card">
            <div className="grid md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="px-8 py-8 sm:px-10">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5">
                  <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5 shrink-0">
                    <rect x="1" y="1" width="5" height="5" rx="1.2" fill="#6366f1" />
                    <rect x="8" y="1" width="5" height="5" rx="1.2" fill="#6366f1" opacity="0.6" />
                    <rect x="1" y="8" width="5" height="5" rx="1.2" fill="#6366f1" opacity="0.6" />
                    <rect x="8" y="8" width="5" height="5" rx="1.2" fill="#6366f1" opacity="0.3" />
                  </svg>
                  <span className="text-xs font-semibold text-indigo-700">Windows Desktop App</span>
                </div>
                <h2 className="font-display text-2xl text-slate-900 sm:text-3xl">
                  Download Universal POS for Windows
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
                  Install the desktop app for a faster, offline-capable experience. Works without a browser — your sales sync automatically when you're back online.
                </p>
                <ul className="mt-4 grid gap-1.5 text-sm text-slate-600 sm:grid-cols-2">
                  {[
                    "Works offline — syncs when back online",
                    "Custom titlebar, no browser needed",
                    "Barcode scanner + receipt printer support",
                    "Auto-updates silently in the background",
                    "Windows 10 and 11 — 64-bit",
                    "Free download",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0 text-indigo-500">
                        <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.12" />
                        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="https://github.com/ShoaibShoukat2/Pos-Desktop/releases/latest/download/Universal-POS-Setup-1.0.0.exe"
                    className="btn btn-primary inline-flex items-center gap-2"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M10 3a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V4a1 1 0 011-1z" />
                      <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                    </svg>
                    Download .exe
                  </a>
                  <a
                    href="https://github.com/ShoaibShoukat2/Pos-Desktop/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost inline-flex items-center gap-2"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                    All releases
                  </a>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  Windows may show a SmartScreen warning — click <strong>More info → Run anyway</strong> to install.
                </p>
              </div>
              {/* Right — Windows visual */}
              <div className="hidden items-center justify-center border-l border-surface-100 bg-slate-50 px-10 md:flex">
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 shadow-xl">
                    <svg viewBox="0 0 14 14" fill="none" className="h-9 w-9">
                      <rect x="1" y="1" width="5" height="5" rx="1.2" fill="#6366f1" />
                      <rect x="8" y="1" width="5" height="5" rx="1.2" fill="#6366f1" opacity="0.65" />
                      <rect x="1" y="8" width="5" height="5" rx="1.2" fill="#6366f1" opacity="0.65" />
                      <rect x="8" y="8" width="5" height="5" rx="1.2" fill="#6366f1" opacity="0.3" />
                    </svg>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">Universal POS</p>
                  <p className="mt-0.5 text-xs text-slate-400">Desktop Edition</p>
                  <div className="mt-3 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-[11px] text-slate-500">
                    v1.0.0 · Windows x64
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="scroll-mt-20 border-y border-surface-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Pricing</p>
              <h2 className="mt-2 font-display text-3xl text-surface-900 sm:text-4xl">
                Simple, flat pricing.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-surface-400">
                One plan. Everything included. No hidden charges, no per-cashier fees.
              </p>
            </div>

            <div className="mx-auto max-w-sm">
              <div className="relative overflow-hidden rounded-2xl border-2 border-brand-600 bg-white shadow-lg shadow-brand-600/10">
                {/* Free trial badge */}
                <div className="absolute right-5 top-5">
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
                    First month free
                  </span>
                </div>

                <div className="px-8 pt-8 pb-6">
                  <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
                    Standard
                  </p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="font-display text-5xl font-semibold text-surface-900">
                      Rs 10,000
                    </span>
                    <span className="mb-1.5 text-sm text-surface-400">/ month</span>
                  </div>
                  <p className="mt-1 text-sm text-surface-400">
                    Billed monthly. Cancel anytime.
                  </p>
                </div>

                <div className="border-t border-surface-100 px-8 py-6">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-surface-500">
                    Everything included
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Full POS counter — unlimited sales",
                      "Owner dashboard + live reports",
                      "Unlimited products, variants & barcodes",
                      "Unlimited cashier accounts",
                      "Purchase orders & supplier management",
                      "Customer credit & ledger",
                      "Cash drawer management",
                      "Invoice printing — thermal & A4",
                      "Offline mode — syncs when back online",
                      "Windows desktop app included",
                      "Public price checker page",
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-surface-700">
                        <svg viewBox="0 0 16 16" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600">
                          <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.12" />
                          <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-surface-100 px-8 py-6">
                  <Link
                    href="/register"
                    className="btn btn-primary flex w-full justify-center gap-2 text-base"
                  >
                    Start free — first month on us
                  </Link>
                  <p className="mt-3 text-center text-xs text-surface-400">
                    No credit card required to start. Rs 10,000/month after trial.
                  </p>
                </div>
              </div>

              {/* Trust note */}
              <div className="mt-6 rounded-xl border border-surface-200 bg-surface-50 px-5 py-4 text-center text-sm text-surface-500">
                <strong className="text-surface-700">Questions?</strong> Contact us before you pay — we will set it up for you.
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-8 py-14 text-center sm:px-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_120%,rgba(99,102,241,0.35),transparent)]" />
            <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-copper-300">Get started today</p>
            <h2 className="relative mt-3 font-display text-3xl text-white sm:text-4xl lg:text-5xl">
              First month free.
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/55">
              Create your business, add products and a cashier, then sell. Rs 10,000/month after your free trial — cancel any time.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={startHref} className="btn btn-copper w-full gap-2 sm:w-auto">
                {startLabel} <ArrowRight size={15} />
              </Link>
              <Link href="/login" className="btn w-full border border-white/15 bg-white/8 text-white hover:bg-white/12 sm:w-auto">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-ink-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-950">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="5" height="5" rx="1.2" fill="#a5b4fc" />
                  <rect x="8" y="1" width="5" height="5" rx="1.2" fill="#a5b4fc" opacity="0.6" />
                  <rect x="1" y="8" width="5" height="5" rx="1.2" fill="#a5b4fc" opacity="0.6" />
                  <rect x="8" y="8" width="5" height="5" rx="1.2" fill="#a5b4fc" opacity="0.3" />
                </svg>
              </div>
              <span className="font-display text-lg text-white">Universal POS</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/55">
              A Senvante product. Built by Shoaib Shoukat for shops that sell in Pakistani rupees.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">Product</p>
            <ul className="space-y-2 text-sm text-white/70">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="hover:text-copper-600 transition-colors">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">Get the app</p>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <a
                  href="https://github.com/ShoaibShoukat2/Pos-Desktop/releases/latest/download/Universal-POS-Setup-1.0.0.exe"
                  className="hover:text-copper-600 transition-colors font-medium"
                >
                  Download for Windows
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/ShoaibShoukat2/Pos-Desktop/releases/latest"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-copper-600 transition-colors"
                >
                  All releases ↗
                </a>
              </li>
            </ul>
            <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-white/40">Sign in</p>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/login" className="hover:text-copper-600 transition-colors">Business owner</Link></li>
              <li><Link href="/login?role=cashier" className="hover:text-copper-600 transition-colors">Cashier</Link></li>
              <li><Link href="/register" className="hover:text-copper-600 transition-colors">Create account</Link></li>
              <li>
                <a href="https://senvante.com/" target="_blank" rel="noreferrer" className="hover:text-copper-600 transition-colors">
                  senvante.com ↗
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-4 sm:px-6">
          <p className="mx-auto max-w-6xl text-xs text-white/40">
            © {new Date().getFullYear()} Senvante · Universal POS
          </p>
        </div>
      </footer>
    </div>
  );
}
