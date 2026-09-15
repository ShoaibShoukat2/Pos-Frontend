"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LayoutDashboard, LogOut, Users } from "lucide-react";

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

  if (pathname === "/platform/login") return <>{children}</>;

  if (loading && !user) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-ink-700/70">
        Loading platform…
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen lg:grid lg:h-screen lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="flex flex-col border-b border-ink-800 bg-ink-950 text-paper-50 lg:h-screen lg:overflow-hidden lg:border-b-0 lg:border-r">
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 lg:block lg:px-5 lg:py-5">
          <div className="min-w-0">
            <p className="truncate font-display text-xl tracking-tight lg:text-2xl">Universal POS</p>
            <p className="mt-0.5 hidden text-[11px] uppercase tracking-[0.2em] text-copper-400 lg:block">
              Platform control
            </p>
          </div>
        </div>
        <div className="hidden shrink-0 px-5 pb-3 lg:block">
          <div className="rounded-xl border border-white/10 bg-ink-900 px-3 py-3">
            <p className="truncate text-sm font-medium">{user.full_name}</p>
            <p className="truncate text-xs text-paper-50/55">{user.email}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-copper-400">Software owner</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:min-h-0 lg:flex-1 lg:flex-col lg:space-y-1 lg:overflow-y-auto lg:overflow-x-hidden">
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
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-nowrap ${
                  active ? "bg-copper-500 text-ink-950" : "text-paper-50/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden shrink-0 border-t border-white/10 px-5 py-4 lg:block">
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
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-paper-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
          <p className="min-w-0 truncate text-sm text-ink-700/70">
            All registered businesses and users across the software
          </p>
          <button type="button" onClick={logout} className="btn-ghost shrink-0 lg:hidden">
            Sign out
          </button>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
