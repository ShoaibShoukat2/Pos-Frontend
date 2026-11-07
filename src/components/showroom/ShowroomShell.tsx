"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Car,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/showroom",           label: "Dashboard",    icon: LayoutDashboard },
  { href: "/showroom/pos",       label: "Sale Counter", icon: Monitor },
  { href: "/showroom/inventory", label: "Car Inventory",icon: Car },
  { href: "/showroom/purchases", label: "Purchases",    icon: ShoppingBag },
  { href: "/showroom/sales",     label: "Sales",        icon: Receipt },
  { href: "/showroom/customers", label: "Customers",    icon: Users },
  { href: "/showroom/sellers",   label: "Sellers",      icon: Truck },
  { href: "/showroom/payments",  label: "Payments",     icon: CreditCard },
  { href: "/showroom/expenses",  label: "Expenses",     icon: Package },
  { href: "/showroom/reports",   label: "Reports",      icon: BarChart3 },
  { href: "/showroom/settings",  label: "Settings",     icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/showroom") return pathname === href;
  return pathname.startsWith(href);
}

function currentLabel(pathname: string) {
  return NAV.find((item) => isActive(pathname, item.href))?.label || "Car Showroom";
}

export function ShowroomShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (loading && !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-50">
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  const NavLinks = ({ onClose }: { onClose?: () => void }) => (
    <>
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-indigo-600 text-white font-medium"
                : "text-white/60 hover:bg-white/8 hover:text-white"
            }`}
          >
            <Icon size={16} className="shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-dvh lg:grid lg:h-dvh lg:grid-cols-[260px_1fr] lg:overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden flex-col bg-slate-900 text-white lg:flex lg:h-dvh lg:overflow-hidden">
        {/* Brand */}
        <div className="shrink-0 border-b border-white/8 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
              <Car size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display text-base font-semibold leading-tight text-white">Car Showroom</p>
              <p className="text-[10px] text-white/40">{user.business_name || "Showroom"}</p>
            </div>
          </div>
        </div>
        {/* Nav */}
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          <NavLinks />
        </nav>
        {/* Footer */}
        <div className="shrink-0 border-t border-white/8 px-4 py-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/40 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile drawer backdrop ───────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile drawer ───────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-200 lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand + close */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
              <Car size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display text-base font-semibold leading-tight text-white">Car Showroom</p>
              <p className="text-[10px] text-white/40">{user.business_name || "Showroom"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        {/* Nav */}
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          <NavLinks onClose={() => setDrawerOpen(false)} />
        </nav>
        {/* Footer */}
        <div className="shrink-0 border-t border-white/8 px-4 py-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/40 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex min-h-0 min-w-0 flex-col lg:overflow-hidden">

        {/* Mobile header with burger */}
        <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {currentLabel(pathname)}
            </p>
            <p className="truncate text-xs text-slate-400">{user.business_name}</p>
          </div>
          {/* Car showroom icon */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
            <Car size={15} className="text-white" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6 sm:py-6 lg:overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
