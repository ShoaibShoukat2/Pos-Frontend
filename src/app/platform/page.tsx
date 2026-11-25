"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, CalendarClock, ShoppingBag, Store, Users, Wallet } from "lucide-react";

import { AreaChart, DashHeader, DashNotice, Donut, Panel, Pill, StatCard, StatGrid, ViewAll } from "@/components/dashboard/kit";
import { api } from "@/lib/api";
import { explainError } from "@/lib/errors";
import { rs } from "@/lib/money";
import type { PlatformOverview } from "@/lib/types";

const PERIODS = [
  { id: "today", label: "Today" },
  { id: "week", label: "7 days" },
  { id: "month", label: "This month" },
] as const;

const TYPE_LABEL: Record<string, string> = {
  grocery: "Grocery",
  clothing: "Clothing",
  restaurant: "Restaurant",
  pharmacy: "Pharmacy",
  electronics: "Electronics",
  pizza: "Pizza shop",
  general: "General retail",
  general_retail: "General retail",
  car_showroom: "Car showroom",
  rent_a_car: "Rent a car",
  hostel: "Hostel",
};

function typeName(value: string) {
  return TYPE_LABEL[value] || value.replace(/_/g, " ");
}

function shortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function useCount(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 700);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}

export default function PlatformOverviewPage() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("month");
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api<PlatformOverview>(`/api/platform/overview/?period=${period}`)
      .then((row) => { if (active) { setData(row); setError(""); } })
      .catch((err) => { if (active) { setData(null); setError(explainError(err, "Platform numbers could not be loaded.")); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period]);

  const trend = (data?.sales_trend || []).map((row) => ({
    label: row.date.slice(5),
    value: Number(row.revenue || 0),
  }));
  const shops = useCount(data?.businesses.total || 0);
  const people = useCount(data?.users.total || 0);
  const expired = useCount(data?.businesses.inactive || 0);
  const fresh = useCount(data?.businesses.new || 0);
  const average = data && data.sales.period_count > 0
    ? Number(data.sales.period_revenue) / data.sales.period_count
    : 0;
  const typeMax = Math.max(...(data?.by_type || []).map((row) => row.total), 1);

  return (
    <div className="admin-dash space-y-5">
      <DashHeader name="Platform" subtitle="Shops, plans, and sales across every business.">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-card">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${period === item.id ? "bg-royal-900 text-white" : "text-slate-500"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </DashHeader>

      {error ? <DashNotice>{error}</DashNotice> : null}
      {loading && !data ? <DashboardSkeleton /> : null}

      {data ? (
        <>
          <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-royal-700 via-royal-900 to-royal-950 p-4 text-white shadow-card sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-300">
                  {period === "today" ? "Sales today" : period === "week" ? "Sales, last 7 days" : "Sales this month"}
                </p>
                <p className="mt-2 truncate font-display text-3xl font-semibold tracking-tight sm:text-4xl">{rs(data.sales.period_revenue)}</p>
                <p className="mt-1 text-sm text-white/70">{data.sales.period_count} orders · average {rs(average)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:w-64">
                <HeroBit label="All-time sales" value={rs(data.sales.revenue)} />
                <HeroBit label="All orders" value={String(data.sales.count)} />
              </div>
            </div>
          </section>

          <StatGrid>
            <StatCard icon={Building2} tone="hero" label="Businesses" value={String(shops)} hint={`${data.businesses.active} live`} href="/platform/businesses" />
            <StatCard icon={Users} label="Users" value={String(people)} hint={`${data.users.owners} owners`} href="/platform/users" />
            <StatCard icon={Wallet} label="New shops" value={String(fresh)} hint={`${data.users.new} new users`} href="/platform/businesses" />
            <StatCard icon={CalendarClock} label="Plans ended" value={String(expired)} hint={`${data.expiring_soon || 0} ending soon`} href="/platform/businesses" />
          </StatGrid>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Mini label="Branches" value={String(data.branches.total)} />
            <Mini label="Products" value={String(data.products.total)} />
            <Mini label="Customers" value={String(data.customers.total)} />
            <Mini label="Staff logins" value={String(data.users.staff)} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.75fr)]">
            <Panel title="Sales, last 14 days" className="admin-chart">
              <AreaChart points={trend} />
            </Panel>
            <Panel title="Shop plans">
              <Donut
                center={String(data.businesses.total)}
                caption="Shops"
                parts={[
                  { label: "Live plan", value: data.businesses.active },
                  { label: "Plan ended", value: data.businesses.inactive },
                ]}
              />
              <p className="mt-4 text-sm text-slate-500">
                {data.expiring_soon || 0} live plan{data.expiring_soon === 1 ? "" : "s"} end in the next 14 days.
              </p>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Shop types">
              {(data.by_type || []).length === 0 ? (
                <p className="text-sm text-slate-400">No shops registered yet.</p>
              ) : (
                <ul className="space-y-3">
                  {(data.by_type || []).map((row, index) => (
                    <li key={row.business_type}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium text-slate-800">{typeName(row.business_type)}</span>
                        <span className="shrink-0 text-slate-500">{row.active} live · {row.total}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-royal-50">
                        <div
                          className="admin-bar h-2 rounded-full bg-royal-700"
                          style={{ width: `${Math.max(8, (row.total / typeMax) * 100)}%`, animationDelay: `${index * 70}ms` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Plans ending soon" action={<ViewAll href="/platform/businesses" />}>
              {(data.ending_soon || []).length === 0 ? (
                <p className="text-sm text-slate-400">No live plan ends in the next 14 days.</p>
              ) : (
                <ul className="divide-y divide-royal-50">
                  {(data.ending_soon || []).map((row) => (
                    <li key={row.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{row.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {typeName(row.business_type)}
                          {row.city ? ` · ${row.city}` : ""}
                          {row.subscription_ends_on ? ` · ${shortDate(row.subscription_ends_on)}` : ""}
                        </p>
                      </div>
                      <Pill tone={row.days_left <= 3 ? "red" : "gold"}>
                        {row.days_left === 0 ? "Ends today" : `${row.days_left} day${row.days_left === 1 ? "" : "s"} left`}
                      </Pill>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title="Latest businesses" action={<ViewAll href="/platform/businesses" />}>
            {data.recent_businesses.length === 0 ? (
              <p className="text-sm text-slate-400">No businesses have registered yet.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {data.recent_businesses.map((row) => (
                  <li key={row.id} className="rounded-xl border border-royal-50 bg-royal-50/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{row.name}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {typeName(row.business_type)}
                          {row.city ? ` · ${row.city}` : ""}
                        </p>
                      </div>
                      <Pill tone={row.is_active ? "green" : "gold"}>{row.is_active ? "Live" : "Ended"}</Pill>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Joined {shortDate(row.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/platform/businesses" className="flex items-center gap-3 rounded-2xl border border-royal-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-royal-100 text-royal-800"><Store size={18} /></span>
              <span>
                <span className="block font-semibold text-slate-900">Manage shops</span>
                <span className="block text-sm text-slate-500">Extend a plan or remove a business.</span>
              </span>
            </Link>
            <Link href="/platform/users" className="flex items-center gap-3 rounded-2xl border border-royal-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-royal-100 text-royal-800"><ShoppingBag size={18} /></span>
              <span>
                <span className="block font-semibold text-slate-900">Look up a user</span>
                <span className="block text-sm text-slate-500">Owners and staff across every shop.</span>
              </span>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}

function HeroBit({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-royal-100 bg-white px-3 py-3 shadow-card">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 truncate font-display text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-36 animate-pulse rounded-2xl bg-white" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    </div>
  );
}
