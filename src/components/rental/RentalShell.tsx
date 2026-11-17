"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Car, KeyRound, LayoutDashboard, LogOut, Menu, ScrollText, Users, X } from "lucide-react";

import { ASIDE, MAIN, NAV_ACTIVE, NAV_IDLE } from "@/components/dashboard/kit";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/rental", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rental/counter", label: "Rent Counter", icon: KeyRound },
  { href: "/rental/fleet", label: "Fleet", icon: Car },
  { href: "/rental/customers", label: "Customers", icon: Users },
  { href: "/rental/terms", label: "Owner terms", icon: ScrollText },
];

function isActive(pathname: string, href: string) {
  if (href === "/rental") return pathname === href;
  return pathname.startsWith(href);
}

function currentLabel(pathname: string) {
  return NAV.find((item) => isActive(pathname, item.href))?.label || "Rent a Car";
}

export function RentalShell({ children }: { children: React.ReactNode }) {
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
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? NAV_ACTIVE : NAV_IDLE}`}
          >
            <Icon size={16} className="shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex h-full min-h-0 flex-col lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:overflow-hidden">
      <aside className={`hidden min-h-0 flex-col lg:flex lg:h-full lg:overflow-hidden ${ASIDE}`}>
        <div className="shrink-0 border-b border-white/8 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-400 text-royal-950">
              <KeyRound size={18} className="text-royal-950" />
            </div>
            <div>
              <p className="font-display text-base font-semibold leading-tight text-white">Rent a Car</p>
              <p className="text-[10px] text-white/40">{user.business_name || "Rental desk"}</p>
            </div>
          </div>
        </div>
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          <NavLinks />
        </nav>
        <div className="shrink-0 border-t border-white/8 px-4 py-4">
          <p className="truncate px-3 pb-2 text-xs text-white/45">{user.full_name || user.business_name}</p>
          <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/40 transition-colors hover:bg-white/5 hover:text-white">
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {drawerOpen ? <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={() => setDrawerOpen(false)} /> : null}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col shadow-2xl transition-transform duration-200 lg:hidden ${ASIDE} ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-400 text-royal-950">
              <KeyRound size={18} className="text-royal-950" />
            </div>
            <div>
              <p className="font-display text-base font-semibold leading-tight text-white">Rent a Car</p>
              <p className="text-[10px] text-white/40">{user.business_name || "Rental desk"}</p>
            </div>
          </div>
          <button type="button" onClick={() => setDrawerOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          <NavLinks onClose={() => setDrawerOpen(false)} />
        </nav>
        <div className="shrink-0 border-t border-white/8 px-4 py-4">
          <p className="truncate px-3 pb-2 text-xs text-white/45">{user.full_name || user.business_name}</p>
          <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/40 transition-colors hover:bg-white/5 hover:text-white">
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-hidden">
        <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <button type="button" onClick={() => setDrawerOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600" aria-label="Open menu">
            <Menu size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{currentLabel(pathname)}</p>
            <p className="truncate text-xs text-slate-400">{user.business_name}</p>
          </div>
        </header>
        <main className={`min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5 ${MAIN}`}>{children}</main>
      </div>
    </div>
  );
}
