"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  BarChart3,
  BedDouble,
  Building2,
  CalendarCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Search,
  Settings,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";

import { ASIDE, MAIN, NAV_ACTIVE, NAV_IDLE } from "@/components/dashboard/kit";
import { useHostel } from "@/components/hostel/session";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { HostelSession } from "@/lib/hostel";

const NAV: { href: string; label: string; icon: typeof LayoutDashboard; show: (session: HostelSession) => boolean }[] = [
  { href: "/hostel", label: "Overview", icon: LayoutDashboard, show: () => true },
  { href: "/hostel/branches", label: "Branches", icon: Building2, show: (session) => session.role !== "employee" },
  { href: "/hostel/rooms", label: "Rooms", icon: BedDouble, show: () => true },
  { href: "/hostel/seats", label: "Beds & seats", icon: BedDouble, show: () => true },
  { href: "/hostel/customers", label: "Customers", icon: Users, show: () => true },
  { href: "/hostel/reservations", label: "Reservations", icon: CalendarCheck, show: () => true },
  { href: "/hostel/payments", label: "Monthly payments", icon: Wallet, show: () => true },
  { href: "/hostel/payments/history", label: "Payment history", icon: Receipt, show: () => true },
  { href: "/hostel/expenses", label: "Expenses", icon: Wrench, show: () => true },
  { href: "/hostel/employees", label: "Employees", icon: Users, show: () => true },
  { href: "/hostel/reports", label: "Reports", icon: BarChart3, show: (session) => session.role === "owner" || session.permissions.includes("reports.branch") },
  { href: "/hostel/documents", label: "Documents", icon: FileText, show: () => true },
  { href: "/hostel/settings", label: "Settings", icon: Settings, show: (session) => session.role === "owner" },
];

function active(pathname: string, href: string) {
  if (href === "/hostel") return pathname === href;
  if (href === "/hostel/payments") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HostelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { session, loading } = useHostel();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ label: string; hint: string; href: string }[]>([]);

  if (loading && !session) {
    return <div className="grid min-h-dvh place-items-center bg-royal-50 text-sm text-slate-400">Opening hostel…</div>;
  }
  if (!user || !session) return null;

  const links = NAV.filter((item) => item.show(session));

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    const data = await api<{ customers: { label: string; hint: string; href: string }[]; reservations: { label: string; hint: string; href: string }[]; payments: { label: string; hint: string; href: string }[] }>(`/api/hostel/search/?q=${encodeURIComponent(query.trim())}`);
    setHits([...(data.customers || []), ...(data.reservations || []), ...(data.payments || [])]);
  }

  const NavLinks = ({ close }: { close?: () => void }) => (
    <>
      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Hostel management</p>
      {links.map((item) => {
        const Icon = item.icon;
        const on = active(pathname, item.href);
        return (
          <Link key={item.href} href={item.href} onClick={close} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm ${on ? NAV_ACTIVE : NAV_IDLE}`}>
            <Icon size={16} />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex h-full min-h-0 flex-col lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:overflow-hidden">
      <aside className={`hidden min-h-0 flex-col lg:flex ${ASIDE}`}>
        <div className="border-b border-white/8 px-5 py-5">
          <p className="font-display text-base font-semibold text-white">Hostel</p>
          <p className="truncate text-[10px] text-white/40">{session.hostel_name}</p>
        </div>
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-3"><NavLinks /></nav>
        <div className="border-t border-white/8 px-4 py-4">
          <p className="truncate px-3 pb-1 text-xs text-white/70">{session.full_name}</p>
          <p className="truncate px-3 pb-2 text-[10px] uppercase tracking-wide text-gold-300">{session.role}{session.branch_name ? ` · ${session.branch_name}` : ""}</p>
          <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white"><LogOut size={15} /> Sign out</button>
        </div>
      </aside>
      {open ? <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setOpen(false)} /> : null}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col lg:hidden ${ASIDE} ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-5">
          <p className="font-display text-base text-white">{session.hostel_name}</p>
          <button type="button" onClick={() => setOpen(false)} className="text-white/60"><X size={18} /></button>
        </div>
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-3"><NavLinks close={() => setOpen(false)} /></nav>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur">
          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
          <form onSubmit={onSearch} className="relative min-w-0 flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone, CNIC, room, seat, receipt" className="field w-full pl-9" />
            {hits.length ? (
              <div className="absolute left-0 right-0 top-11 z-20 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
                {hits.map((hit) => (
                  <button key={`${hit.href}-${hit.label}`} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-royal-50" onClick={() => { setHits([]); setQuery(""); router.push(hit.href); }}>
                    <span className="font-medium text-slate-900">{hit.label}</span>
                    <span className="ml-2 text-xs text-slate-400">{hit.hint}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </form>
        </header>
        <main className={`min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5 ${MAIN}`}>{children}</main>
      </div>
    </div>
  );
}
