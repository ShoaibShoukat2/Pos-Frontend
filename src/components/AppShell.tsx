"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Banknote,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Monitor,
  Package,
  Receipt,
  RotateCcw,
  BarChart3,
  ShoppingBag,
  Truck,
  UserCircle,
  UserPlus,
  Wrench,
} from "lucide-react";

import { FounderCredit } from "@/components/FounderCredit";
import { BottomNav, MenuButton, NavDrawer } from "@/components/MobileChrome";
import { isCashier, useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";

const CASHIER_LINKS = new Set(["/cashier", "/pos", "/customers", "/cash", "/returns"]);

const NAV = [
  { href: "/dashboard",         labelKey: "nav_overview",     icon: LayoutDashboard, perm: null },
  { href: "/settings/cashiers", labelKey: "nav_add_cashier",  icon: UserPlus,        perm: "user.create" },
  { href: "/pos",               labelKey: "nav_pos",          icon: Monitor,         perm: "pos.access" },
  { href: "/returns",           labelKey: "nav_returns",      icon: RotateCcw,       perm: "pos.access" },
  { href: "/reports",           labelKey: "nav_reports",      icon: BarChart3,       perm: "report.sales" },
  { href: "/products",          labelKey: "nav_products",     icon: Package,         perm: "product.view" },
  { href: "/services",          labelKey: "nav_services",     icon: Wrench,          perm: "product.view" },
  { href: "/customers",         labelKey: "nav_customers",    icon: UserCircle,      perm: "customer.view" },
  { href: "/purchases",         labelKey: "nav_purchases",    icon: ShoppingBag,     perm: "purchase.view" },
  { href: "/suppliers",         labelKey: "nav_suppliers",    icon: Truck,           perm: "supplier.view" },
  { href: "/expenses",          labelKey: "nav_expenses",     icon: Receipt,         perm: "expense.view" },
  { href: "/cash",              labelKey: "nav_cash",         icon: Banknote,        perm: "cash.drawer" },
  { href: "/settings/business", labelKey: "nav_business",     icon: Building2,       perm: "business.view" },
  { href: "/settings/invoice",  labelKey: "nav_invoices",     icon: FileText,        perm: "invoice_settings.manage" },
] as const;

/** Initials fallback when no logo */
function BusinessInitials({ name }: { name: string }) {
  const letters = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
      style={{ background: "var(--brand-accent, #d4892a)" }}
    >
      {letters || "B"}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, can } = useAuth();
  const { lang, setLang, t } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = NAV.filter((item) => !item.perm || can(item.perm))
    .map((item) => ({
      ...item,
      label: t(item.labelKey),
      href: item.href === "/dashboard" && isCashier(user) ? "/cashier" : item.href,
    }))
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
        {t("dash_loading")}
      </div>
    );
  }

  if (!user || user.is_platform_admin) return null;

  const accentStyle = {
    "--nav-active-bg": "var(--brand-accent, #d4892a)",
  } as React.CSSProperties;

  return (
    <div
      className="min-h-dvh lg:grid lg:h-dvh lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:overflow-hidden"
      style={accentStyle}
    >
      {/* ── Sidebar ── */}
      <aside
        className="hidden flex-col text-paper-50 lg:flex lg:h-dvh lg:overflow-hidden lg:border-r"
        style={{ background: "var(--brand-primary, #1c1814)", borderColor: "rgba(255,255,255,0.07)" }}
      >
        {/* Brand / Logo */}
        <div className="shrink-0 px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            {user.business_logo ? (
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={user.business_logo}
                  alt={user.business_name || "Logo"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <BusinessInitials name={user.business_name || "B"} />
            )}
            <span className="truncate font-display text-lg leading-tight text-paper-50">
              {user.business_name || "Universal POS"}
            </span>
          </Link>
        </div>

        {/* User card */}
        <div className="shrink-0 px-4 pb-3">
          <div
            className="rounded-xl px-3 py-3"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="truncate text-sm font-medium text-paper-50">{user.full_name}</p>
            <p
              className="mt-0.5 text-[11px] uppercase tracking-wider"
              style={{ color: "var(--brand-accent, #d4892a)" }}
            >
              {user.is_owner ? "Owner" : user.role_name || "Staff"}
            </p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
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
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors"
                style={
                  active
                    ? {
                        background: "var(--brand-accent, #d4892a)",
                        color: "#1c1814",
                        fontWeight: 500,
                      }
                    : {
                        color: "rgba(251,247,240,0.65)",
                      }
                }
                onMouseOver={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseOut={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Icon size={15} className="shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="shrink-0 px-4 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          {/* Language toggle */}
          <div className="mb-3 flex items-center gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.05)" }}>
            <button
              type="button"
              onClick={() => setLang("en")}
              className="flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors"
              style={lang === "en" ? { background: "rgba(255,255,255,0.12)", color: "#fbf7f0" } : { color: "rgba(251,247,240,0.35)" }}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang("ur")}
              className="flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors"
              style={lang === "ur" ? { background: "rgba(255,255,255,0.12)", color: "#fbf7f0" } : { color: "rgba(251,247,240,0.35)" }}
            >
              اردو
            </button>
          </div>
          <FounderCredit variant="sidebar" />
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-paper-50/50 transition-colors hover:bg-white/5 hover:text-paper-50"
          >
            <LogOut size={15} />
            {t("nav_sign_out")}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex min-h-0 min-w-0 flex-col lg:overflow-hidden">
        <header className="safe-top sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-paper-200 bg-white/90 px-3 py-2.5 backdrop-blur sm:px-6 sm:py-3">
          <MenuButton onClick={() => setMenuOpen(true)} />
          <div className="min-w-0 flex-1 flex items-center gap-3">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 lg:hidden">
              {user.business_logo ? (
                <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={user.business_logo}
                    alt={user.business_name || "Logo"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : null}
              <p className="truncate text-sm font-medium text-ink-950">
                {user.business_name || "Workspace"}
              </p>
            </div>
            <p className="hidden min-w-0 truncate text-sm text-ink-700/60 md:block">
              {pathname === "/dashboard"
                ? "Business overview — sales, people and live activity"
                : "Sales, cash and reports"}
            </p>
          </div>
        </header>
        <main className="page-pad min-h-0 min-w-0 flex-1 overflow-y-auto px-3 sm:px-6">
          {children}
        </main>
      </div>

      {/* Mobile drawer + bottom nav */}
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
        <BottomNav
          items={bottomItems}
          pathname={pathname}
          moreOpen={menuOpen}
          onMore={() => setMenuOpen((v) => !v)}
        />
      ) : null}
    </div>
  );
}
