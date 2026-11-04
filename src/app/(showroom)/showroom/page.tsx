"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Car, TrendingUp, TrendingDown, Users, Truck, AlertCircle, CheckCircle, Clock } from "lucide-react";

import { api } from "@/lib/api";
import { rs } from "@/lib/money";

type Dashboard = {
  total_cars: number; available: number; reserved: number; sold: number;
  total_investment: string; total_sales_revenue: string;
  total_expenses: string; total_profit: string;
  customer_dues: string; seller_dues: string;
  recent_sales: { id: string; car: string; customer: string; amount: string; date: string; profit: string }[];
  available_cars: { id: string; name: string; color: string; year: number; price: string; mileage: number }[];
};

function KpiCard({ icon: Icon, label, value, sub, color = "indigo" }: {
  icon: typeof Car; label: string; value: string; sub?: string;
  color?: "indigo" | "emerald" | "red" | "amber" | "slate";
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-semibold text-slate-900">{value}</p>
          {sub ? <p className="mt-0.5 text-xs text-slate-400">{sub}</p> : null}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export default function ShowroomDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Dashboard>("/api/showroom/dashboard/")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-slate-400">Loading dashboard…</p>
    </div>
  );

  const profit = parseFloat(data?.total_profit || "0");

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Car Showroom</p>
          <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/showroom/inventory/new" className="btn btn-primary text-sm">Add Car</Link>
          <Link href="/showroom/sales/new" className="btn btn-ghost text-sm">New Sale</Link>
        </div>
      </div>

      {/* Car status strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
          <CheckCircle size={20} className="mx-auto mb-1 text-emerald-500" />
          <p className="font-display text-3xl font-semibold text-emerald-700">{data?.available ?? 0}</p>
          <p className="mt-0.5 text-xs font-medium text-emerald-600">Available</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-center">
          <Clock size={20} className="mx-auto mb-1 text-amber-500" />
          <p className="font-display text-3xl font-semibold text-amber-700">{data?.reserved ?? 0}</p>
          <p className="mt-0.5 text-xs font-medium text-amber-600">Reserved</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
          <Car size={20} className="mx-auto mb-1 text-slate-500" />
          <p className="font-display text-3xl font-semibold text-slate-700">{data?.sold ?? 0}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">Sold</p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-4 text-center">
          <Car size={20} className="mx-auto mb-1 text-indigo-500" />
          <p className="font-display text-3xl font-semibold text-indigo-700">{data?.total_cars ?? 0}</p>
          <p className="mt-0.5 text-xs font-medium text-indigo-600">Total Cars</p>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard icon={TrendingUp}  label="Total Sales Revenue" value={rs(data?.total_sales_revenue ?? 0)} color="indigo" />
        <KpiCard icon={Car}         label="Total Investment"     value={rs(data?.total_investment ?? 0)}   color="slate" />
        <KpiCard icon={profit >= 0 ? TrendingUp : TrendingDown}
                                    label="Net Profit / Loss"
                                    value={rs(data?.total_profit ?? 0)}
                                    color={profit >= 0 ? "emerald" : "red"} />
        <KpiCard icon={AlertCircle} label="Total Expenses"      value={rs(data?.total_expenses ?? 0)}     color="amber" />
        <KpiCard icon={Users}       label="Customer Dues"        value={rs(data?.customer_dues ?? 0)}      color="red" />
        <KpiCard icon={Truck}       label="Seller Dues"          value={rs(data?.seller_dues ?? 0)}        color="amber" />
      </div>

      {/* Recent sales + Available cars */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-slate-900">Recent Sales</h2>
            <Link href="/showroom/sales" className="text-xs font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {!data?.recent_sales.length ? (
            <p className="px-5 py-8 text-sm text-slate-400">No sales yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recent_sales.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{row.car}</p>
                    <p className="text-xs text-slate-400">{row.customer} · {row.date}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-900">{rs(row.amount)}</p>
                    <p className={`text-xs font-medium ${parseFloat(row.profit) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {parseFloat(row.profit) >= 0 ? "+" : ""}{rs(row.profit)} profit
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Available Cars */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-slate-900">Available Cars</h2>
            <Link href="/showroom/inventory" className="text-xs font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {!data?.available_cars.length ? (
            <p className="px-5 py-8 text-sm text-slate-400">No available cars. <Link href="/showroom/inventory/new" className="text-indigo-600 underline">Add one</Link></p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.available_cars.map((car) => (
                <li key={car.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                      <Car size={16} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{car.name}</p>
                      <p className="text-xs text-slate-400">
                        {car.color} · {car.mileage.toLocaleString()} km
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 font-display text-sm font-semibold text-slate-900">{rs(car.price)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Quick actions</p>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/showroom/inventory/new", label: "Add car" },
            { href: "/showroom/purchases/new", label: "Record purchase" },
            { href: "/showroom/sales/new",     label: "New sale" },
            { href: "/showroom/expenses/new",  label: "Add expense" },
            { href: "/showroom/customers/new", label: "New customer" },
            { href: "/showroom/sellers/new",   label: "New seller" },
            { href: "/showroom/reports",       label: "View reports" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
