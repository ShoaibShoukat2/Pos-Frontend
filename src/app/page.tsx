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
  { href: "#features", label: "Features" },
  { href: "#industries", label: "Industries" },
  { href: "#how", label: "How it works" },
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
  { emoji: "🛒", title: "Grocery", text: "Fast tickets, accurate stock on hand, daily sales picture." },
  { emoji: "👕", title: "Clothing", text: "Variants, sizes, colors — the cashier searches, not scrolls." },
  { emoji: "🍕", title: "Pizza / Restaurant", text: "Counter sales, printed slip, category sales on the owner view." },
  { emoji: "💊", title: "Pharmacy", text: "Products, customers and a clean record of what left the shelf." },
  { emoji: "📱", title: "Electronics", text: "Higher-value items, purchase invoices, full history." },
  { emoji: "🏪", title: "General Retail", text: "One setup for a shop that sells a mixed counter." },
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
      <header className="sticky top-0 z-40 border-b border-paper-200/80 bg-paper-50/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950">
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1.2" fill="#d4892a" />
                <rect x="8" y="1" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.6" />
                <rect x="1" y="8" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.6" />
                <rect x="8" y="8" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.3" />
              </svg>
            </div>
            <span className="font-display text-xl text-ink-950">Universal POS</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-ink-700/70 lg:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-ink-950 transition-colors">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/login" className="btn-ghost px-3 py-2 text-sm">
              Sign in
            </Link>
            <Link href={startHref} className="btn-copper gap-1.5 text-sm">
              {startLabel} <ArrowRight size={14} />
            </Link>
          </div>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-paper-200 bg-white lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {open && (
          <div className="border-t border-paper-200 bg-white px-4 pb-5 pt-4 lg:hidden">
            <nav className="grid gap-0.5">
              {NAV.map((item) => (
                <a key={item.href} href={item.href} className="rounded-xl px-3 py-2.5 text-sm hover:bg-paper-50" onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 grid gap-2">
              <Link href="/login" className="btn-ghost w-full text-center text-sm" onClick={() => setOpen(false)}>Sign in</Link>
              <Link href={startHref} className="btn-copper w-full text-center text-sm" onClick={() => setOpen(false)}>{startLabel}</Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-paper-200">
          {/* Background texture */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(212,137,42,0.08),transparent)]" />

          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-copper-500/25 bg-copper-500/8 px-3.5 py-1.5">
                <Zap size={12} className="text-copper-500" />
                <span className="text-xs font-medium text-copper-600">Built for Pakistani shops — PKR, GST ready</span>
              </div>

              <h1 className="font-display text-4xl leading-[1.06] tracking-tight text-ink-950 sm:text-5xl lg:text-6xl">
                The counter, stock and cash —{" "}
                <span className="text-copper-500">one POS.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-700/65 sm:text-lg">
                Sell at the counter, print an invoice, track stock and see today's money.
                Owner watches the numbers. Cashier stays on the sale.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href={startHref} className="btn-copper w-full gap-2 sm:w-auto">
                  {startLabel} <ArrowRight size={15} />
                </Link>
                <a href="#features" className="btn-ghost w-full sm:w-auto">
                  See what's included
                </a>
              </div>
            </div>

            {/* Dashboard preview card */}
            <div className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-2xl border border-paper-200 bg-white shadow-[0_8px_40px_-8px_rgba(28,24,20,0.18)]">
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
          <div className="mx-auto grid max-w-6xl gap-px divide-y divide-paper-200 px-4 sm:divide-x sm:divide-y-0 sm:grid-cols-3 sm:px-6">
            {[
              { title: "Owner + Cashier", sub: "Separate logins. Each person sees only what they need." },
              { title: "Rupee-first", sub: "PKR totals, GST setup, thermal receipts out of the box." },
              { title: "Web + Desktop", sub: "Use it in the browser or install the Windows desktop app." },
            ].map((f) => (
              <div key={f.title} className="px-6 py-6">
                <p className="font-medium text-ink-950">{f.title}</p>
                <p className="mt-1 text-sm text-ink-700/60">{f.sub}</p>
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
                <article key={item.title} className="group rounded-2xl border border-paper-200 bg-white p-5 transition hover:border-copper-300 hover:shadow-card">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-copper-500/10 text-copper-600">
                    <Icon size={17} />
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
                <article key={item.title} className="rounded-2xl border border-white/8 bg-white/5 p-5 transition hover:bg-white/8">
                  <span className="text-2xl">{item.emoji}</span>
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
              {STEPS.map((step, i) => (
                <div key={step.n} className="relative">
                  {i < STEPS.length - 1 && (
                    <div className="absolute left-full top-5 hidden w-4 -translate-x-1/2 border-t-2 border-dashed border-paper-200 md:block" style={{ width: "calc(100% - 2.5rem)", left: "calc(2.5rem + 50%)" }} />
                  )}
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-copper-500 font-display text-lg text-ink-950">
                    {step.n}
                  </div>
                  <h3 className="mt-4 font-medium text-ink-950">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-700/60">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-8 py-12 text-center sm:px-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgba(212,137,42,0.15),transparent)]" />
            <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-copper-400">Get started</p>
            <h2 className="relative mt-3 font-display text-3xl text-paper-50 sm:text-4xl lg:text-5xl">
              Open your business today.
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed text-paper-50/55">
              Create the owner account, add your products and cashier, then sell.
              Takes under five minutes.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={startHref} className="btn-copper w-full gap-2 sm:w-auto">
                {startLabel} <ArrowRight size={15} />
              </Link>
              <Link href="/login" className="btn w-full border border-white/15 bg-white/8 text-paper-50 hover:bg-white/12 sm:w-auto">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-paper-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-950">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="5" height="5" rx="1.2" fill="#d4892a" />
                  <rect x="8" y="1" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.6" />
                  <rect x="1" y="8" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.6" />
                  <rect x="8" y="8" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.3" />
                </svg>
              </div>
              <span className="font-display text-lg text-ink-950">Universal POS</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-700/60">
              A Senvante product. Built by Shoaib Shoukat for shops that sell in Pakistani rupees.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-700/40">Product</p>
            <ul className="space-y-2 text-sm text-ink-700/70">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="hover:text-copper-600 transition-colors">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-700/40">Sign in</p>
            <ul className="space-y-2 text-sm text-ink-700/70">
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
        <div className="border-t border-paper-200 px-4 py-4 sm:px-6">
          <p className="mx-auto max-w-6xl text-xs text-ink-700/40">
            © {new Date().getFullYear()} Senvante · Universal POS
          </p>
        </div>
      </footer>
    </div>
  );
}
