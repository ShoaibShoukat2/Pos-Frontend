"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Car, CheckCircle, Clock, Plus, TrendingUp, Users, Wallet } from "lucide-react";

import { AreaChart, DashHeader, Donut, Panel, Pill, StatCard, StatGrid, ViewAll } from "@/components/dashboard/kit";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function rs(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return `Rs ${n.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

type Dashboard = {
  total_cars: number;
  available: number;
  reserved: number;
  sold: number;
  total_investment: string;
  total_sales_revenue: string;
  total_expenses: string;
  total_profit: string;
  customer_dues: string;
  seller_dues: string;
  cash_received?: string;
  dues_count?: number;
  unsigned_invoices?: number;
  today_sales?: string;
  today_count?: number;
  month_sales?: string;
  month_profit?: string;
  month_count?: number;
  stock_value?: string;
  stock_cost?: string;
  monthly?: { label: string; sales: string; count: number }[];
  recent_sales: {
    id: string; invoice_number?: string; car: string; customer: string;
    amount: string; remaining?: string; date: string; profit: string; signed?: boolean;
  }[];
  available_cars: {
    id: string; name: string; color: string;
    year: number; price: string; mileage: number;
  }[];
};

export default function ShowroomDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Dashboard>("/api/showroom/dashboard/")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const monthBars = (data?.monthly || []).map((row) => ({ label: row.label, value: parseFloat(row.sales || "0") }));
  const firstName = user?.full_name?.split(" ")[0] || user?.business_name || "";

  return (
    <div className="space-y-5">
      <DashHeader
        name={firstName}
        subtitle={loading ? "Loading showroom numbers…" : "Cars, sales, and money still open today."}
      >
        <Link href="/showroom/pos" className="rounded-xl bg-royal-900 px-4 py-2.5 text-sm font-semibold text-white">Sale counter</Link>
        <Link href="/showroom/inventory/new" className="inline-flex items-center gap-2 rounded-xl border border-royal-200 bg-white px-4 py-2.5 text-sm font-semibold text-royal-900">
          <Plus size={15} /> Add car
        </Link>
      </DashHeader>

      {(data?.unsigned_invoices || data?.dues_count) ? (
        <div className="flex flex-wrap gap-2">
          {data?.unsigned_invoices ? (
            <Link href="/showroom/sales" className="rounded-full bg-gold-300/50 px-3 py-1 text-xs font-semibold text-royal-950">
              {data.unsigned_invoices} invoice{data.unsigned_invoices === 1 ? "" : "s"} waiting for a signature
            </Link>
          ) : null}
          {data?.dues_count ? (
            <Link href="/showroom/payments" className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              {data.dues_count} balance{data.dues_count === 1 ? "" : "s"} still open
            </Link>
          ) : null}
        </div>
      ) : null}

      <StatGrid>
        <StatCard icon={Wallet} tone="hero" label="This month" value={rs(data?.month_sales ?? 0)} hint={`${data?.month_count ?? 0} sold`} href="/showroom/reports" />
        <StatCard icon={TrendingUp} label="Profit" value={rs(data?.month_profit ?? 0)} hint="This month" href="/showroom/reports" />
        <StatCard icon={Users} label="Customers" value={String(data?.dues_count ?? 0)} hint="Open balances" href="/showroom/customers" />
        <StatCard icon={Car} label="Stock value" value={rs(data?.stock_value ?? 0)} hint={`${data?.available ?? 0} available`} href="/showroom/inventory" />
      </StatGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <Panel title="Sales overview" action={<ViewAll href="/showroom/reports" />}>
          <AreaChart points={monthBars} />
        </Panel>
        <Panel title="Yard status">
          <Donut
            center={String(data?.total_cars ?? 0)}
            caption="Cars"
            parts={[
              { label: "Available", value: data?.available ?? 0 },
              { label: "Reserved", value: data?.reserved ?? 0 },
              { label: "Sold", value: data?.sold ?? 0 },
            ]}
          />
        </Panel>
      </div>

      <StatGrid cols="lg:grid-cols-3">
        <StatCard icon={TrendingUp} label="All sales" value={rs(data?.total_sales_revenue ?? 0)} href="/showroom/sales" />
        <StatCard icon={Wallet} label="Investment" value={rs(data?.total_investment ?? 0)} href="/showroom/purchases" />
        <StatCard icon={CheckCircle} label="Profit after expenses" value={rs(data?.total_profit ?? 0)} />
        <StatCard icon={Clock} label="Expenses" value={rs(data?.total_expenses ?? 0)} href="/showroom/expenses" />
        <StatCard icon={Users} label="Customer dues" value={rs(data?.customer_dues ?? 0)} href="/showroom/payments" />
        <StatCard icon={Car} label="Seller dues" value={rs(data?.seller_dues ?? 0)} href="/showroom/sellers" />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recent sales" action={<ViewAll href="/showroom/sales" />}>
          {!data?.recent_sales.length ? (
            <p className="px-5 pb-6 text-sm text-slate-400">No sales yet. <Link href="/showroom/pos" className="font-medium text-royal-700">Make the first sale</Link></p>
          ) : (
            <ul className="divide-y divide-royal-50">
              {data.recent_sales.map((row) => (
                <li key={row.id}>
                  <Link href={`/showroom/sales?invoice=${row.id}`} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-royal-50 sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{row.car}</p>
                      <p className="truncate text-xs text-slate-400">{row.customer} · {row.date}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-slate-900">{rs(row.amount)}</p>
                      <Pill tone={row.signed ? "green" : "gold"}>{row.signed ? "Signed" : "Sign"}</Pill>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Available cars" action={<ViewAll href="/showroom/inventory" />}>
          {!data?.available_cars.length ? (
            <p className="text-sm text-slate-400">No available cars. <Link href="/showroom/inventory/new" className="font-medium text-royal-700">Add one</Link></p>
          ) : (
            <ul className="space-y-2">
              {data.available_cars.map((car) => (
                <li key={car.id}>
                  <Link href={`/showroom/inventory/${car.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-royal-50">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-royal-100 text-royal-800"><Car size={16} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{car.name}</span>
                      <span className="block truncate text-xs text-slate-400">{[car.color, car.mileage ? `${car.mileage.toLocaleString()} km` : null].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-slate-900">{rs(car.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
