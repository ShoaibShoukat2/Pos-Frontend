"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  Banknote,
  Menu,
  Monitor,
  Package,
  Receipt,
  RotateCcw,
  ShoppingBag,
  Store,
  Truck,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";

import { FounderCredit } from "@/components/FounderCredit";
import { homeFor, useAuth } from "@/lib/auth";

const NAV = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "What you get" },
  { href: "#industries", label: "Industries" },
  { href: "#benefits", label: "Benefits" },
  { href: "#founder", label: "Founder" },
];

const FEATURES = [
  { icon: Monitor, title: "POS counter", text: "Scan or pick items, take cash, card, bank or wallet, and finish the ticket." },
  { icon: Package, title: "Products and barcodes", text: "Catalog, variants, stock and selling price, ready for the next sale." },
  { icon: Receipt, title: "Invoice slip", text: "A clear slip with item, quantity, rate, amount, total and change." },
  { icon: Users, title: "Customers", text: "Walk-in or named customers, with what they still owe." },
  { icon: Truck, title: "Purchases", text: "Suppliers, purchase bills and what the shop still has to pay." },
  { icon: Wallet, title: "Cash drawer", text: "Open a shift, watch cash sales, and close the drawer against the expected total." },
  { icon: Banknote, title: "Expenses", text: "Record shop spending so profit is not just the sales total." },
  { icon: BarChart3, title: "Owner dashboard", text: "Today’s sale, which products brought the money, and what share of the catalog sold." },
  { icon: Wrench, title: "Services", text: "Sell work as well as goods, with its own list beside products." },
  { icon: RotateCcw, title: "Returns", text: "Take a sale back without losing the original ticket." },
  { icon: ShoppingBag, title: "Promotions", text: "Discounts and offers that apply on the counter." },
  { icon: UserPlus, title: "Staff roles", text: "Owner, cashier and other roles, each with their own login." },
];

const INDUSTRIES = [
  { title: "Grocery", text: "Fast tickets, stock on hand, and a daily sales picture." },
  { title: "Clothing", text: "Variants, sizes and a catalog the cashier can search." },
  { title: "Restaurant", text: "Counter sales, a printed slip, and the day’s takings." },
  { title: "Pizza shop", text: "Sizes, sides, drinks and deals, with today’s pizza sales on the owner dashboard." },
  { title: "Pharmacy", text: "Products, customers and a record of what left the shelf." },
  { title: "Electronics", text: "Higher-value items, invoices and purchase history." },
  { title: "General retail", text: "One setup for a shop that sells a mixed counter." },
];

const BENEFITS = [
  { title: "See the day before you close", text: "The owner dashboard shows today’s sale, orders, and profit beside the cash drawer." },
  { title: "Know which products paid", text: "Each sold product shows quantity, the money it brought, and its share of sales." },
  { title: "Know how much of the catalog moved", text: "A simple percent shows how many catalog products actually sold." },
  { title: "Keep the cashier on the counter", text: "Cashiers get POS, customers and the drawer. The owner keeps reports, stock and staff." },
  { title: "A slip the customer can read", text: "Invoice number, items, rate, total, paid and change — on thermal paper or A4." },
  { title: "Priced for a Pakistani shop", text: "Totals in rupees, with business setup for PKR, GST, branches and invoice settings." },
];

const STEPS = [
  { n: "01", title: "Create the business", text: "Register the shop. That creates the owner, head office, PKR and the starting roles." },
  { n: "02", title: "Add products and a cashier", text: "Put the catalog in, then give the cashier their own email and password." },
  { n: "03", title: "Sell and print the slip", text: "The counter takes the sale. The slip stays with the ticket, ready to print." },
  { n: "04", title: "Read the day", text: "Open the dashboard for today’s sale, product money, and what percent of products sold." },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const startHref = user ? homeFor(user) : "/register";
  const startLabel = loading ? "Checking session…" : user ? "Open workspace" : "Create business";

  return (
    <div className="min-h-dvh bg-paper-50 text-ink-900">
      <div className="bg-ink-950 text-center text-xs text-paper-50/80">
        <p className="mx-auto max-w-6xl px-4 py-2">
          A Senvante product · Point of sale for shops that sell in Pakistani rupees
        </p>
      </div>

      <header className="sticky top-0 z-40 border-b border-paper-200 bg-paper-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-2xl text-ink-950" onClick={() => setOpen(false)}>
            Universal POS
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-ink-800 lg:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-copper-600">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/login?role=platform" className="btn-ghost">
              Admin login
            </Link>
            <Link href="/login" className="btn-ghost">
              Sign in
            </Link>
            <Link href={startHref} className="btn-primary">
              {startLabel}
            </Link>
          </div>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl border border-paper-200 bg-white lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {open ? (
          <div className="border-t border-paper-200 bg-paper-50 px-4 py-4 lg:hidden">
            <nav className="grid gap-1 text-sm">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-3 hover:bg-white"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-3 grid gap-2">
              <Link href="/login?role=platform" className="btn-ghost" onClick={() => setOpen(false)}>
                Admin login
              </Link>
              <Link href="/login" className="btn-ghost" onClick={() => setOpen(false)}>
                Sign in
              </Link>
              <Link href={startHref} className="btn-primary" onClick={() => setOpen(false)}>
                {startLabel}
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <section id="product" className="scroll-mt-24 mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-600">The shop, then the register</p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] text-ink-950 sm:text-6xl">
              Your counter, stock and cash in one POS.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-700/80">
              Universal POS is the system a shop actually runs: sell at the counter, print an invoice, buy stock,
              and see today’s money. The owner watches the business. The cashier stays on the sale.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={startHref} className="btn-copper">
                {startLabel}
              </Link>
              <a href="#features" className="btn-ghost">
                See what it includes
              </a>
            </div>
          </div>
          <div className="card overflow-hidden p-0">
            <div className="flex items-center justify-between bg-ink-950 px-5 py-4 text-paper-50">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-copper-400">Owner view</p>
                <p className="font-display text-2xl">Today’s sale</p>
              </div>
              <Store size={22} className="text-copper-400" />
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-3">
              <PreviewStat label="Sales" value="Live total" />
              <PreviewStat label="Products" value="Qty and Rs" />
              <PreviewStat label="Catalog sold" value="Percent" />
            </div>
            <div className="space-y-2 px-5 pb-5 text-sm">
              <PreviewRow name="Counter sale" detail="Invoice, paid, change" />
              <PreviewRow name="Product mix" detail="What brought the money" />
              <PreviewRow name="Cash drawer" detail="Expected cash for the shift" />
            </div>
          </div>
        </section>

        <section className="border-y border-paper-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6">
            <Fact title="Owner and cashier" text="Separate logins. The counter does not see the whole business." />
            <Fact title="Rupee invoices" text="Ticket totals, a printed slip, and GST-ready shop setup." />
            <Fact title="One company" text="Built by Senvante and led by Shoaib Shoukat, CEO and Founder." />
          </div>
        </section>

        <section id="features" className="scroll-mt-24 mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-600">What you get</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl text-ink-950 sm:text-5xl">
            The work of the shop, not a pile of separate tools.
          </h2>
          <p className="mt-4 max-w-2xl text-ink-700/75">
            From the first product to the evening close, these are the parts already in Universal POS.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="card p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-copper-500/15 text-copper-600">
                    <Icon size={18} />
                  </span>
                  <h3 className="mt-4 font-display text-xl text-ink-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700/75">{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="industries" className="scroll-mt-24 bg-ink-950 text-paper-50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-400">Industries</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl sm:text-5xl">Built for the shop you already run.</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {INDUSTRIES.map((item) => (
                <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="font-display text-2xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-paper-50/70">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="benefits" className="scroll-mt-24 mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-600">Benefits</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl text-ink-950 sm:text-5xl">What changes once the shop is on it.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {BENEFITS.map((item) => (
              <article key={item.title} className="rounded-2xl border border-paper-200 bg-white p-6">
                <h3 className="font-display text-2xl text-ink-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700/75">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-paper-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-600">How it starts</p>
            <h2 className="mt-3 font-display text-3xl text-ink-950 sm:text-5xl">Four steps to a working counter.</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => (
                <li key={step.n} className="rounded-2xl bg-paper-50 p-5">
                  <p className="font-display text-2xl text-copper-600">{step.n}</p>
                  <h3 className="mt-3 font-medium text-ink-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700/75">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div id="founder" className="scroll-mt-24 pt-16">
          <FounderCredit />
        </div>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-ink-950 px-6 py-10 text-paper-50 sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-400">Start the shop</p>
            <h2 className="mt-3 max-w-xl font-display text-3xl sm:text-5xl">Open the business, then open the counter.</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-paper-50/70">
              Create the owner account, add a cashier, and sell. Admin login is for the software owner.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={startHref} className="btn-copper">
                {startLabel}
              </Link>
              <Link href="/login" className="btn border border-white/15 bg-white/5 text-paper-50 hover:bg-white/10">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-paper-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="font-display text-2xl text-ink-950">Universal POS</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-700/70">
              A point of sale from Senvante. Sales, stock, invoices and the owner’s view of the day.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700/50">Product</p>
            <ul className="mt-3 space-y-2 text-sm">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="hover:text-copper-600">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700/50">Sign in</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/login" className="hover:text-copper-600">
                  Business owner
                </Link>
              </li>
              <li>
                <Link href="/login?role=cashier" className="hover:text-copper-600">
                  Cashier
                </Link>
              </li>
              <li>
                <Link href="/login?role=platform" className="hover:text-copper-600">
                  Admin login
                </Link>
              </li>
              <li>
                <a href="https://senvante.com/" target="_blank" rel="noreferrer" className="hover:text-copper-600">
                  senvante.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-paper-200">
          <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-ink-700/50 sm:px-6">
            © {new Date().getFullYear()} Senvante. Universal POS is a Senvante product.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Fact({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="font-medium text-ink-950">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-700/70">{text}</p>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-paper-50 px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-700/50">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink-950">{value}</p>
    </div>
  );
}

function PreviewRow({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-paper-200 px-3 py-3">
      <span className="font-medium text-ink-950">{name}</span>
      <span className="text-xs text-ink-700/60">{detail}</span>
    </div>
  );
}
