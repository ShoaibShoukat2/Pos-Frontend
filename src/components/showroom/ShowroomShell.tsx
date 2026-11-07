"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Car,
  CreditCard,
  LogOut,
  Monitor,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  LayoutDashboard,
} from "lucide-react";

import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/showroom",            label: "Dashboard",    icon: LayoutDashboard },
  { href: "/showroom/pos",        label: "Sale Counter", icon: Monitor },
  { href: "/showroom/inventory",  label: "Car Inventory",icon: Car },
  { href: "/showroom/purchases",  label: "Purchases",    icon: ShoppingBag },
  { href: "/showroom/sales",      label: "Sales",        icon: Receipt },
  { href: "/showroom/customers",  label: "Customers",    icon: Users },
  { href: "/showroom/sellers",    label: "Sellers",      icon: Truck },
  { href: "/showroom/payments",   label: "Payments",     icon: CreditCard },
  { href: "/showroom/expenses",   label: "Expenses",     icon: Package },
  { href: "/showroom/reports",    label: "Reports",      icon: BarChart3 },
  { href: "/showroom/settings",   label: "Settings",     icon: Settings },
];

export function ShowroomShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  if (loading && !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-50">
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-dvh lg:grid lg:h-dvh lg:grid-cols-[260px_1fr] lg:overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden flex-col bg-slate-900 text-white lg:flex lg:h-dvh lg:overflow-hidden">
        {/* Brand */}
        <div className="shrink-0 px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
              <Car size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display text-base font-semibold leading-tight text-white">Car Showroom</p>
              <p className="text-[10px] text-white/40">{user?.business_name || "Showroom"}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {NAV.map((item) => {
            const active = item.href === "/showroom"
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-indigo-600 text-white font-medium"
                    : "text-white/60 hover:bg-white/6 hover:text-white"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                {item.label}
              </Link>
            );
          })}
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

      {/* Content */}
      <div className="flex min-h-0 flex-col lg:overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
