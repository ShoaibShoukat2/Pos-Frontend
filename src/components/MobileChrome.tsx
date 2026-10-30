"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LogOut, Menu, MoreHorizontal, X, type LucideIcon } from "lucide-react";

import { FounderCredit } from "@/components/FounderCredit";

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
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-surface-200 bg-white text-surface-500 hover:text-surface-900 lg:hidden"
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
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className="lg:hidden">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close menu"
        className={`fixed inset-0 z-40 bg-surface-900/40 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`safe-top safe-bottom fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-2.5rem))] flex-col shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "pointer-events-none -translate-x-full"
        }`}
        style={{ background: "var(--brand-primary, #1e293b)", color: "#f8fafc" }}
        aria-hidden={!open}
        {...(!open ? { inert: true } : {})}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <p className="truncate font-display text-xl text-white">Universal POS</p>
            {subtitle ? <p className="mt-1 truncate text-sm text-white/65">{subtitle}</p> : null}
            {title   ? <p className="truncate text-xs text-white/45">{title}</p> : null}
            {meta    ? (
              <p
                className="mt-1 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--brand-accent, #6366f1)" }}
              >
                {meta}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white/40 hover:bg-white/8 hover:text-white"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
          {links.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors"
                style={
                  active
                    ? { background: "var(--brand-accent, #6366f1)", color: "#fff", fontWeight: 500 }
                    : { color: "rgba(248,250,252,0.65)" }
                }
                onMouseOver={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseOut={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Icon size={16} className="shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t px-3 py-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <FounderCredit variant="sidebar" />
          <button
            type="button"
            onClick={onLogout}
            className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut size={16} />
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
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-surface-200 bg-white/95 backdrop-blur lg:hidden">
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}
      >
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href) && !moreOpen;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors ${
                active ? "text-brand-600" : "text-surface-400"
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
          className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors ${
            moreOpen ? "text-brand-600" : "text-surface-400"
          }`}
        >
          <MoreHorizontal size={18} />
          More
        </button>
      </div>
    </nav>
  );
}
