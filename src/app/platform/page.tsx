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
  grocery: "Grocery",
  clothing: "Clothing",
  restaurant: "Restaurant",
  pharmacy: "Pharmacy",
  electronics: "Electronics",
  general: "General",
};

export default function PlatformOverviewPage() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("month");
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api<PlatformOverview>(`/api/platform/overview/?period=${period}`)
      .then((row) => {
        if (active) setData(row);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period]);

  const kpis = data
    ? [
        { label: "Businesses", value: String(data.businesses.total), href: "/platform/businesses" },
        { label: "Users", value: String(data.users.total), href: "/platform/users" },
        { label: "Active shops", value: String(data.businesses.active), href: "/platform/businesses" },
        { label: "All-time sales", value: rs(data.sales.revenue), href: "/platform/businesses" },
        { label: "Orders", value: String(data.sales.count), href: "/platform/businesses" },
        { label: "Products", value: String(data.products.total), href: "/platform/businesses" },
        { label: "Customers", value: String(data.customers.total), href: "/platform/businesses" },
        { label: "Branches", value: String(data.branches.total), href: "/platform/businesses" },
      ]
    : [];

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
                className={period === item.id ? "btn-copper px-3 py-1.5 text-sm" : "btn-ghost px-3 py-1.5 text-sm"}
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => (
              <Link key={item.label} href={item.href} className="card p-4 hover:border-copper-400">
                <p className="text-xs uppercase tracking-wide text-ink-700/60">{item.label}</p>
                <p className="mt-1 font-display text-2xl text-ink-950">{item.value}</p>
              </Link>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="font-display text-xl text-ink-950">This period</h2>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-paper-50 px-3 py-3">
                  <dt className="text-ink-700/60">New businesses</dt>
                  <dd className="mt-1 text-lg font-medium text-ink-950">{data.businesses.new}</dd>
                </div>
                <div className="rounded-xl bg-paper-50 px-3 py-3">
                  <dt className="text-ink-700/60">New users</dt>
                  <dd className="mt-1 text-lg font-medium text-ink-950">{data.users.new}</dd>
                </div>
                <div className="rounded-xl bg-paper-50 px-3 py-3">
                  <dt className="text-ink-700/60">Period sales</dt>
                  <dd className="mt-1 text-lg font-medium text-ink-950">{rs(data.sales.period_revenue)}</dd>
                </div>
                <div className="rounded-xl bg-paper-50 px-3 py-3">
                  <dt className="text-ink-700/60">Period orders</dt>
                  <dd className="mt-1 text-lg font-medium text-ink-950">{data.sales.period_count}</dd>
                </div>
                <div className="rounded-xl bg-paper-50 px-3 py-3">
                  <dt className="text-ink-700/60">Owners</dt>
                  <dd className="mt-1 text-lg font-medium text-ink-950">{data.users.owners}</dd>
                </div>
                <div className="rounded-xl bg-paper-50 px-3 py-3">
                  <dt className="text-ink-700/60">Staff</dt>
                  <dd className="mt-1 text-lg font-medium text-ink-950">{data.users.staff}</dd>
                </div>
              </dl>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl text-ink-950">Latest businesses</h2>
                <Link href="/platform/businesses" className="text-sm text-copper-600 underline">
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-2">
                {data.recent_businesses.length === 0 ? (
                  <p className="text-sm text-ink-700/70">No businesses have registered yet.</p>
                ) : (
                  data.recent_businesses.map((row) => (
                    <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl bg-paper-50 px-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-950">{row.name}</p>
                        <p className="truncate text-xs text-ink-700/60">
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

          {data.sales_trend.length > 0 ? (
            <div className="card mt-4 overflow-x-auto p-5">
              <h2 className="font-display text-xl text-ink-950">Sales last 14 days</h2>
              <table className="mt-4 w-full min-w-[32rem] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-ink-700/60">
                  <tr>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Orders</th>
                    <th className="pb-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sales_trend.map((row) => (
                    <tr key={row.date} className="border-t border-paper-100">
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
