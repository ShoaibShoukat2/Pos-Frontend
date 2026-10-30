"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { TableSkeleton } from "@/components/DataTable";
import { Badge, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { rs } from "@/lib/money";
import type { PlatformOverview } from "@/lib/types";

const PERIODS = [
  { id: "today", label: "Today" },
  { id: "week", label: "7 days" },
  { id: "month", label: "This month" },
] as const;

const TYPE_LABEL: Record<string, string> = {
  grocery: "Grocery", clothing: "Clothing", restaurant: "Restaurant",
  pharmacy: "Pharmacy", electronics: "Electronics", pizza: "Pizza shop", general: "General",
};

export default function PlatformOverviewPage() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("month");
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api<PlatformOverview>(`/api/platform/overview/?period=${period}`)
      .then((row) => { if (active) setData(row); })
      .catch(() => { if (active) setData(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period]);

  const kpis = data ? [
    { label: "Businesses",   value: String(data.businesses.total), href: "/platform/businesses" },
    { label: "Users",        value: String(data.users.total),      href: "/platform/users" },
    { label: "Active shops", value: String(data.businesses.active),href: "/platform/businesses" },
    { label: "All-time sales",value: rs(data.sales.revenue),       href: "/platform/businesses" },
    { label: "Orders",       value: String(data.sales.count),      href: "/platform/businesses" },
    { label: "Products",     value: String(data.products.total),   href: "/platform/businesses" },
    { label: "Customers",    value: String(data.customers.total),  href: "/platform/businesses" },
    { label: "Branches",     value: String(data.branches.total),   href: "/platform/businesses" },
  ] : [];

  return (
    <div>
      <PageHeader
        eyebrow="Software owner"
        title="Platform overview"
        description="Every registered business, user, and sale across the complete system."
        action={
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPeriod(item.id)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                  period === item.id
                    ? "bg-brand-600 text-white"
                    : "border border-surface-200 bg-white text-surface-700 hover:border-brand-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      />

      {loading && !data ? <TableSkeleton rows={3} cols={4} /> : null}

      {data ? (
        <>
          {/* KPI grid */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => (
              <Link key={item.label} href={item.href} className="card p-4 hover:border-brand-400">
                <p className="text-xs uppercase tracking-wide text-surface-400">{item.label}</p>
                <p className="mt-1 font-display text-2xl text-surface-900">{item.value}</p>
              </Link>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {/* Period stats */}
            <div className="card p-5">
              <h2 className="font-display text-xl text-surface-900">This period</h2>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["New businesses", data.businesses.new],
                  ["New users",      data.users.new],
                  ["Period sales",   rs(data.sales.period_revenue)],
                  ["Period orders",  data.sales.period_count],
                  ["Owners",         data.users.owners],
                  ["Staff",          data.users.staff],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl bg-surface-50 px-3 py-3">
                    <dt className="text-surface-400">{label}</dt>
                    <dd className="mt-1 text-lg font-medium text-surface-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Latest businesses */}
            <div className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl text-surface-900">Latest businesses</h2>
                <Link href="/platform/businesses" className="text-sm text-brand-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-2">
                {data.recent_businesses.length === 0 ? (
                  <p className="text-sm text-surface-400">No businesses have registered yet.</p>
                ) : (
                  data.recent_businesses.map((row) => (
                    <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-50 px-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-surface-900">{row.name}</p>
                        <p className="truncate text-xs text-surface-400">
                          {TYPE_LABEL[row.business_type] || row.business_type}
                          {row.city ? ` · ${row.city}` : ""}
                        </p>
                      </div>
                      <Badge tone={row.is_active ? "good" : "warn"}>{row.is_active ? "Active" : "Disabled"}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sales trend */}
          {data.sales_trend.length > 0 ? (
            <div className="card mt-4 overflow-x-auto p-5">
              <h2 className="font-display text-xl text-surface-900">Sales last 14 days</h2>
              <table className="mt-4 w-full min-w-[32rem] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-surface-400">
                  <tr>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Orders</th>
                    <th className="pb-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sales_trend.map((row) => (
                    <tr key={row.date} className="border-t border-surface-100">
                      <td className="py-2">{row.date}</td>
                      <td className="py-2">{row.orders}</td>
                      <td className="py-2">{rs(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
