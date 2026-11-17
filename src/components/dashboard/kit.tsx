"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";

export const NAV_ACTIVE = "bg-gradient-to-r from-gold-300 to-gold-400 font-semibold text-royal-950 shadow-sm";
export const NAV_IDLE = "text-white/70 hover:bg-white/10 hover:text-white";
export const ASIDE = "bg-royal-950 text-white";
export const MAIN = "bg-royal-50";

export function DashHeader({
  name,
  subtitle,
  children,
}: {
  name: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  const [title, setTitle] = useState(name || "Dashboard");

  useEffect(() => {
    const hour = new Date().getHours();
    const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    setTitle(name ? `${hello}, ${name}` : hello);
  }, [name]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function StatGrid({ children, cols = "xl:grid-cols-4" }: { children: React.ReactNode; cols?: string }) {
  return <div className={`grid grid-cols-2 gap-3 ${cols}`}>{children}</div>;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "light",
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "light" | "hero";
  href?: string;
}) {
  const hero = tone === "hero";
  const card = (
    <div className={hero
      ? "relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-royal-700 via-royal-900 to-royal-950 p-4 text-white shadow-card"
      : "h-full rounded-2xl border border-royal-100 bg-white p-4 shadow-card"}>
      {hero ? <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-gold-400/20 blur-2xl" /> : null}
      <div className="relative flex items-start justify-between gap-2">
        <span className={hero
          ? "grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-gold-300"
          : "grid h-9 w-9 place-items-center rounded-xl bg-royal-100 text-royal-800"}>
          <Icon size={16} />
        </span>
        {hint ? (
          <span className={hero
            ? "max-w-[9rem] truncate rounded-full bg-gold-400/20 px-2 py-0.5 text-[11px] font-semibold text-gold-300"
            : "max-w-[9rem] truncate rounded-full bg-royal-50 px-2 py-0.5 text-[11px] font-semibold text-royal-800"}>
            {hint}
          </span>
        ) : null}
      </div>
      <p className={`relative mt-4 text-xs font-medium ${hero ? "text-white/70" : "text-slate-500"}`}>{label}</p>
      <p className="relative mt-1 truncate font-display text-xl font-semibold tracking-tight sm:text-2xl">{value}</p>
    </div>
  );
  if (!href) return card;
  return <Link href={href} className="block h-full transition hover:-translate-y-0.5">{card}</Link>;
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-royal-100 bg-white p-4 shadow-card sm:p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ViewAll({ href }: { href: string }) {
  return <Link href={href} className="text-xs font-semibold text-royal-700 hover:text-royal-900">View all</Link>;
}

export function AreaChart({ points }: { points: { label: string; value: number }[] }) {
  if (points.length === 0) return <p className="text-sm text-slate-400">No numbers in this period yet.</p>;
  const width = 640;
  const height = 220;
  const padX = 24;
  const padY = 28;
  const max = Math.max(...points.map((point) => point.value), 1);
  const step = points.length === 1 ? 0 : (width - padX * 2) / (points.length - 1);
  const coords = points.map((point, index) => ({
    ...point,
    x: padX + index * step,
    y: padY + (1 - point.value / max) * (height - padY * 2 - 8),
  }));
  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const base = height - 22;
  const area = `${coords[0].x},${base} ${line} ${coords[coords.length - 1].x},${base}`;
  const last = coords[coords.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full sm:h-56" role="img" aria-label="Trend">
      <defs>
        <linearGradient id="dash-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b35a8" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#5b35a8" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#dash-area)" />
      <polyline points={line} fill="none" stroke="#e2ae22" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {coords.map((point) => (
        <text key={`${point.label}-${point.x}`} x={point.x} y={height - 4} textAnchor="middle" fontSize="11" fill="#94a3b8">
          {point.label}
        </text>
      ))}
      <circle cx={last.x} cy={last.y} r="5" fill="#fff" stroke="#e2ae22" strokeWidth="3" />
    </svg>
  );
}

const DONUT_COLORS = ["#5b35a8", "#e2ae22", "#c4b5e0", "#7c6aa8", "#f6d56a"];

export function Donut({
  parts,
  center,
  caption,
}: {
  parts: { label: string; value: number }[];
  center: string;
  caption: string;
}) {
  const rows = parts.filter((part) => part.value > 0);
  const total = rows.reduce((sum, part) => sum + part.value, 0) || 1;
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0" role="img" aria-label={caption}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#ece6f7" strokeWidth="14" />
        {rows.map((part, index) => {
          const length = (part.value / total) * circ;
          const dash = `${length} ${circ - length}`;
          const circle = (
            <circle
              key={part.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={DONUT_COLORS[index % DONUT_COLORS.length]}
              strokeWidth="14"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform="rotate(-90 60 60)"
            />
          );
          offset += length;
          return circle;
        })}
        <text x="60" y="58" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1e1b2e">{center}</text>
        <text x="60" y="74" textAnchor="middle" fontSize="9" fill="#64748b">{caption}</text>
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {(rows.length ? rows : parts).map((part, index) => (
          <li key={part.label} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: DONUT_COLORS[index % DONUT_COLORS.length] }} />
              <span className="truncate">{part.label}</span>
            </span>
            <span className="font-semibold text-slate-900">{part.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Pill({ children, tone = "violet" }: { children: React.ReactNode; tone?: "violet" | "gold" | "green" | "red" }) {
  const tones = {
    violet: "bg-royal-100 text-royal-800",
    gold: "bg-gold-300/40 text-royal-950",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}
