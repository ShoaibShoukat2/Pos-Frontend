"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LogOut, Menu, MoreHorizontal, X, type LucideIcon } from "lucide-react";

export type ChromeLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const EXACT = new Set(["/dashboard", "/cashier", "/platform", "/pos", "/cash"]);

export function isActivePath(pathname: string, href: string) {
  if (EXACT.has(href) || href === "/platform") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-paper-200 bg-white lg:hidden"
      aria-label="Open menu"
    >
      <Menu size={18} />
    </button>
  );
}

export function NavDrawer({
  open,
  onClose,
  subtitle,
  title,
  meta,
  links,
  pathname,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  subtitle?: string;
  title?: string;
  meta?: string;
  links: ChromeLink[];
  pathname: string;
  onLogout: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className={`fixed inset-0 z-40 bg-ink-950/50 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`safe-top safe-bottom fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-2.5rem))] flex-col bg-ink-950 text-paper-50 shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "pointer-events-none -translate-x-full"
        }`}
        aria-hidden={!open}
        {...(!open ? { inert: true } : {})}
      >
        <div className="flex items-start justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <p className="truncate font-display text-xl">Universal POS</p>
            {subtitle ? <p className="mt-1 truncate text-sm text-paper-50/75">{subtitle}</p> : null}
            {title ? <p className="truncate text-xs text-paper-50/55">{title}</p> : null}
            {meta ? <p className="mt-1 text-[11px] uppercase tracking-wider text-copper-400">{meta}</p> : null}
          </div>
          <button
            type="button"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl hover:bg-white/10"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          {links.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  active ? "bg-copper-500 text-ink-950" : "text-paper-50/80 hover:bg-white/5"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-3 py-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-paper-50/70 hover:bg-white/5"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}

export function BottomNav({
  items,
  pathname,
  moreOpen,
  onMore,
}: {
  items: ChromeLink[];
  pathname: string;
  moreOpen: boolean;
  onMore: () => void;
}) {
  const tabs = items.slice(0, 4);
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-paper-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}>
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium ${
                active && !moreOpen ? "text-copper-600" : "text-ink-700/60"
              }`}
            >
              <Icon size={18} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMore}
          className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium ${
            moreOpen ? "text-copper-600" : "text-ink-700/60"
          }`}
        >
          <MoreHorizontal size={18} />
          More
        </button>
      </div>
    </nav>
  );
}
