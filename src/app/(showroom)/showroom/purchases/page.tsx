"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, asList } from "@/lib/api";
import { rs } from "@/lib/money";

type Purchase = { id: string; car_display: string; seller_name: string; purchase_date: string; total_cost: string; remaining_payment: string; payment_method: string; };

export default function PurchasesPage() {
  const [rows, setRows] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api("/api/showroom/car-purchases/").then((d) => setRows(asList(d as any))).finally(() => setLoading(false)); }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Car Purchases</h1>
        <Link href="/showroom/purchases/new" className="btn btn-primary inline-flex items-center gap-2"><Plus size={16}/>Record Purchase</Link>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? <p className="p-6 text-slate-400">Loading…</p> : rows.length === 0 ? <p className="p-6 text-slate-400">No purchases yet.</p> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr><th className="px-5 py-3">Car</th><th className="px-5 py-3">Seller</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Total Cost</th><th className="px-5 py-3">Remaining</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{r.car_display}</td>
                  <td className="px-5 py-3 text-slate-600">{r.seller_name}</td>
                  <td className="px-5 py-3 text-slate-500">{r.purchase_date}</td>
                  <td className="px-5 py-3 font-semibold">{rs(r.total_cost)}</td>
                  <td className="px-5 py-3"><span className={parseFloat(r.remaining_payment) > 0 ? "text-red-600 font-medium" : "text-emerald-600"}>{rs(r.remaining_payment)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
