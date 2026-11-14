"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { rs } from "@/lib/money";

type Dashboard = { total_cars: number; available: number; reserved: number; sold: number; total_investment: string; total_sales_revenue: string; total_expenses: string; total_profit: string; customer_dues: string; seller_dues: string; };

export default function ReportsPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api<Dashboard>("/api/showroom/dashboard/").then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <p className="py-10 text-center text-slate-400">Loading…</p>;

  const profit = parseFloat(data?.total_profit || "0");

  const stats = [
    { label: "Total Cars", value: String(data?.total_cars ?? 0) },
    { label: "Available", value: String(data?.available ?? 0) },
    { label: "Reserved", value: String(data?.reserved ?? 0) },
    { label: "Sold", value: String(data?.sold ?? 0) },
    { label: "Total Investment", value: rs(data?.total_investment ?? 0) },
    { label: "Total Sales Revenue", value: rs(data?.total_sales_revenue ?? 0) },
    { label: "Total Expenses", value: rs(data?.total_expenses ?? 0) },
    { label: "Profit after expenses", value: rs(data?.total_profit ?? 0), highlight: profit >= 0 ? "emerald" : "red" },
    { label: "Customer Dues", value: rs(data?.customer_dues ?? 0) },
    { label: "Seller Dues", value: rs(data?.seller_dues ?? 0) },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-slate-900">Reports</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{s.label}</p>
            <p className={`mt-1.5 font-display text-2xl font-semibold ${s.highlight === "emerald" ? "text-emerald-600" : s.highlight === "red" ? "text-red-600" : "text-slate-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
