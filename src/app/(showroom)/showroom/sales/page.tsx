"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, asList } from "@/lib/api";
import { rs } from "@/lib/money";

type Sale = { id: string; car_display: string; customer_name: string; sale_date: string; final_amount: string; remaining_amount: string; profit: string; payment_method: string; };

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api("/api/showroom/car-sales/").then((d) => setSales(asList(d as any))).catch(() => setSales([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Showroom</p>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Car Sales</h1>
        </div>
        <Link href="/showroom/sales/new" className="btn btn-primary inline-flex items-center gap-2"><Plus size={16}/>New Sale</Link>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? <p className="px-5 py-8 text-slate-400">Loading…</p> : sales.length === 0 ? <p className="px-5 py-8 text-slate-400">No sales yet.</p> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Car</th><th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date</th><th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Remaining</th><th className="px-5 py-3">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{s.car_display}</td>
                  <td className="px-5 py-3 text-slate-600">{s.customer_name}</td>
                  <td className="px-5 py-3 text-slate-500">{s.sale_date}</td>
                  <td className="px-5 py-3 font-semibold">{rs(s.final_amount)}</td>
                  <td className="px-5 py-3"><span className={parseFloat(s.remaining_amount) > 0 ? "text-red-600" : "text-emerald-600"}>{rs(s.remaining_amount)}</span></td>
                  <td className="px-5 py-3"><span className={parseFloat(s.profit) >= 0 ? "text-emerald-600" : "text-red-600"}>{rs(s.profit)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
