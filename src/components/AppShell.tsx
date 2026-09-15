"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Banknote,
  Building2,
  Coins,
  FileText,
  LayoutDashboard,
  LogOut,
  Monitor,
  Package,
  Percent,
  Receipt,
  BarChart3,
  Shield,
  ShoppingBag,
  Store,
  Tag,
  Truck,
  UserCircle,
  UserPlus,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";

import { BottomNav, MenuButton, NavDrawer } from "@/components/MobileChrome";
import { isCashier, useAuth } from "@/lib/auth";
import { useBranch } from "@/lib/branch";

const CASHIER_LINKS = new Set(["/cashier", "/pos", "/customers", "/cash"]);

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, perm: null },
  { href: "/settings/cashiers", label: "Add cashier", icon: UserPlus, perm: "user.create" },
  { href: "/pos", label: "POS", icon: Monitor, perm: "pos.access" },
  { href: "/reports", label: "Reports", icon: BarChart3, perm: "report.sales" },
  { href: "/products", label: "Products", icon: Package, perm: "product.view" },
  { href: "/services", label: "Services", icon: Wrench, perm: "product.view" },
  { href: "/stock", label: "Stock", icon: Warehouse, perm: "stock.view" },
  { href: "/customers", label: "Customers", icon: UserCircle, perm: "customer.view" },
  { href: "/purchases", label: "Purchases", icon: ShoppingBag, perm: "purchase.view" },
  { href: "/suppliers", label: "Suppliers", icon: Truck, perm: "supplier.view" },
  { href: "/expenses", label: "Expenses", icon: Receipt, perm: "expense.view" },
  { href: "/promotions", label: "Loyalty", icon: Tag, perm: "discount.manage" },
  { href: "/cash", label: "Cash drawer", icon: Banknote, perm: "cash.drawer" },
  { href: "/settings/business", label: "Business", icon: Building2, perm: "business.view" },
  { href: "/settings/branches", label: "Branches", icon: Store, perm: "branch.view" },
  { href: "/settings/tax", label: "Tax", icon: Percent, perm: "tax.manage" },
  { href: "/settings/currency", label: "Currency", icon: Coins, perm: "currency.manage" },
  { href: "/settings/invoice", label: "Invoices", icon: FileText, perm: "invoice_settings.manage" },
  { href: "/settings/users", label: "Users", icon: Users, perm: "user.view" },
  { href: "/settings/roles", label: "Roles", icon: Shield, perm: "role.view" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, can } = useAuth();
  const { branches, branchId, setBranch } = useBranch();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = NAV.filter((item) => !item.perm || can(item.perm))
    .map((item) => (item.href === "/dashboard" && isCashier(user) ? { ...item, href: "/cashier" } : item))
    .filter((item) => !isCashier(user) || CASHIER_LINKS.has(item.href));
  const bottomItems = [
    links.find((item) => item.href === "/dashboard" || item.href === "/cashier"),
    links.find((item) => item.href === "/pos"),
    links.find((item) => item.href === "/products"),
    links.find((item) => item.href === "/reports"),
  ].filter(Boolean) as typeof links;

  if (loading && !user) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-ink-700/70">
        Loading workspace…
      </div>
    );
  }

  if (!user || user.is_platform_admin) return null;

  return (
    <div className="min-h-dvh lg:grid lg:h-dvh lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="hidden flex-col border-ink-800 bg-ink-950 text-paper-50 lg:flex lg:h-dvh lg:overflow-hidden lg:border-r">
        <div className="shrink-0 px-5 py-5">
          <p className="truncate font-display text-2xl tracking-tight">Universal POS</p>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-copper-400">Phase 6 · SaaS</p>
        </div>
        <div className="shrink-0 px-5 pb-3">
          <div className="rounded-xl border border-white/10 bg-ink-900 px-3 py-3">
            <p className="truncate text-sm font-medium">{user.business_name || "Your business"}</p>
            <p className="truncate text-xs text-paper-50/55">{user.full_name}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-copper-400">
              {user.is_owner ? "Owner" : user.role_name || "Staff"}
            </p>
          </div>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          {links.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onMouseEnter={() => router.prefetch(item.href)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                  active ? "bg-copper-500 text-ink-950" : "text-paper-50/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-paper-50/60 hover:bg-white/5 hover:text-white"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-col lg:overflow-hidden">
        <header className="safe-top sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-paper-200 bg-white/90 px-3 py-2.5 backdrop-blur sm:px-6 sm:py-3">
          <MenuButton onClick={() => setMenuOpen(true)} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-950 lg:hidden">{user.business_name || "Workspace"}</p>
            <p className="hidden min-w-0 truncate text-sm text-ink-700/70 md:block">
              {pathname === "/dashboard"
                ? "Full business overview — sales, stock, people and live product activity"
                : "Each branch keeps its own stock, sales, cash and reports"}
            </p>
          </div>
          {branches.length > 1 ? (
            <select
              className="field max-w-[9.5rem] py-1.5 text-sm sm:max-w-xs"
              value={branchId || ""}
              onChange={(e) => setBranch(e.target.value || null)}
            >
              {can("branch.view") ? <option value="">All branches</option> : null}
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : null}
        </header>
        <main className="page-pad min-h-0 min-w-0 flex-1 overflow-y-auto px-3 sm:px-6">{children}</main>
      </div>
      <NavDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        subtitle={user.business_name || "Your business"}
        title={user.full_name}
        meta={user.is_owner ? "Owner" : user.role_name || "Staff"}
        links={links}
        pathname={pathname}
        onLogout={logout}
      />
      {bottomItems.length ? (
        <BottomNav items={bottomItems} pathname={pathname} moreOpen={menuOpen} onMore={() => setMenuOpen((v) => !v)} />
      ) : null}
    </div>
  );
}
