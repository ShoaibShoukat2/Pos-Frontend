"use client";

import { useEffect, useState } from "react";
import { Building2, ShoppingBag, Users, Wallet } from "lucide-react";

import { AreaChart, DashHeader, Donut, Panel, Pill, StatCard, StatGrid, ViewAll } from "@/components/dashboard/kit";
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
  car_showroom: "Car Showroom", rent_a_car: "Rent a Car", hostel: "Hostel",
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

  const trend = (data?.sales_trend || []).map((row) => ({
    label: row.date.slice(5),
    value: Number(row.revenue || 0),
  }));

  return (
    <div className="space-y-5">
      <DashHeader name="Platform" subtitle="Every registered business, user, and sale.">
        <div className="flex rounded-xl bg-white p-1 shadow-card">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${period === item.id ? "bg-royal-900 text-white" : "text-slate-500"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </DashHeader>

      {loading && !data ? <p className="text-sm text-slate-400">Loading platform numbers…</p> : null}

      {data ? (
        <>
          <StatGrid>
            <StatCard icon={Building2} tone="hero" label="Businesses" value={String(data.businesses.total)} hint={`${data.businesses.active} active`} href="/platform/businesses" />
            <StatCard icon={Users} label="Users" value={String(data.users.total)} hint={`${data.users.owners} owners`} href="/platform/users" />
            <StatCard icon={Wallet} label="All-time sales" value={rs(data.sales.revenue)} hint={`${data.sales.count} orders`} href="/platform/businesses" />
            <StatCard icon={ShoppingBag} label="Products" value={String(data.products.total)} hint={`${data.customers.total} customers`} href="/platform/businesses" />
          </StatGrid>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.7fr)]">
            <Panel title="Sales, last 14 days">
              <AreaChart points={trend} />
            </Panel>
            <Panel title="This period">
              <Donut
                center={String(data.sales.period_count)}
                caption="Orders"
                parts={[
                  { label: "New businesses", value: data.businesses.new },
                  { label: "New users", value: data.users.new },
                  { label: "Owners", value: data.users.owners },
                  { label: "Staff", value: data.users.staff },
                ]}
              />
              <p className="mt-4 text-sm text-slate-500">Period sales <span className="font-semibold text-slate-900">{rs(data.sales.period_revenue)}</span></p>
            </Panel>
          </div>

          <Panel title="Latest businesses" action={<ViewAll href="/platform/businesses" />}>
            {data.recent_businesses.length === 0 ? (
              <p className="text-sm text-slate-400">No businesses have registered yet.</p>
            ) : (
              <ul className="divide-y divide-royal-50">
                {data.recent_businesses.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{row.name}</p>
                      <p className="truncate text-xs text-slate-400">
                        {TYPE_LABEL[row.business_type] || row.business_type}
                        {row.city ? ` · ${row.city}` : ""}
                      </p>
                    </div>
                    <Pill tone={row.is_active ? "green" : "gold"}>{row.is_active ? "Active" : "Disabled"}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      ) : null}
    </div>
  );
}
