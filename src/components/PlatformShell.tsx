"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, LayoutDashboard, LogOut, Users } from "lucide-react";

import { BottomNav, MenuButton, NavDrawer } from "@/components/MobileChrome";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/platform", label: "Overview", icon: LayoutDashboard },
  { href: "/platform/businesses", label: "Businesses", icon: Building2 },
  { href: "/platform/users", label: "Users", icon: Users },
];

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === "/platform/login") return <>{children}</>;

  if (loading && !user) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-ink-700/70">
        Loading platform…
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-dvh lg:grid lg:h-dvh lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="hidden flex-col border-ink-800 bg-ink-950 text-paper-50 lg:flex lg:h-dvh lg:overflow-hidden lg:border-r">
        <div className="shrink-0 px-5 py-5">
          <p className="truncate font-display text-2xl tracking-tight">Universal POS</p>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-copper-400">Platform control</p>
        </div>
        <div className="shrink-0 px-5 pb-3">
          <div className="rounded-xl border border-white/10 bg-ink-900 px-3 py-3">
            <p className="truncate text-sm font-medium">{user.full_name}</p>
            <p className="truncate text-xs text-paper-50/55">{user.email}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-copper-400">Software owner</p>
          </div>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          {NAV.map((item) => {
            const active =
              item.href === "/platform"
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
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink-950 lg:font-normal lg:text-ink-700/70">
            All registered businesses and users
          </p>
        </header>
        <main className="page-pad min-h-0 min-w-0 flex-1 overflow-y-auto px-3 sm:px-6">{children}</main>
      </div>
      <NavDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        subtitle={user.full_name}
        title={user.email}
        meta="Software owner"
        links={NAV}
        pathname={pathname}
        onLogout={logout}
      />
      <BottomNav items={NAV} pathname={pathname} moreOpen={menuOpen} onMore={() => setMenuOpen((v) => !v)} />
    </div>
  );
}
