"use client";
import { useEffect, useState } from "react";
import { api, asList } from "@/lib/api";
import { rs } from "@/lib/money";

type Sale = { id: string; car_display: string; customer_name: string; final_amount: string; received_amount: string; remaining_amount: string; payment_method: string; sale_date: string; };

export default function PaymentsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api("/api/showroom/car-sales/").then((d) => setSales(asList(d as any))).finally(() => setLoading(false)); }, []);

  const pending = sales.filter((s) => parseFloat(s.remaining_amount) > 0);
  const completed = sales.filter((s) => parseFloat(s.remaining_amount) <= 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <h1 className="font-display text-2xl font-semibold text-slate-900">Payments</h1>

      {pending.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-red-600 uppercase tracking-widest">Pending Dues ({pending.length})</h2>
          <div className="rounded-2xl border border-red-200 bg-white overflow-x-auto shadow-sm">
            <table className="w-full min-w-[640px] text-sm text-left">
              <thead className="bg-red-50 text-xs uppercase tracking-wide text-red-400">
                <tr><th className="px-5 py-3">Car</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Received</th><th className="px-5 py-3">Due</th><th className="px-5 py-3">Method</th></tr>
              </thead>
              <tbody className="divide-y divide-red-50">
                {pending.map((s) => (
                  <tr key={s.id} className="hover:bg-red-50/50">
                    <td className="px-5 py-3 font-medium text-slate-900">{s.car_display}</td>
                    <td className="px-5 py-3 text-slate-600">{s.customer_name}</td>
                    <td className="px-5 py-3">{rs(s.final_amount)}</td>
                    <td className="px-5 py-3 text-emerald-600">{rs(s.received_amount)}</td>
                    <td className="px-5 py-3 font-semibold text-red-600">{rs(s.remaining_amount)}</td>
                    <td className="px-5 py-3 capitalize text-slate-500">{s.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-emerald-600 uppercase tracking-widest">Completed ({completed.length})</h2>
        <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto shadow-sm">
          {loading ? <p className="p-6 text-slate-400">Loading…</p> : completed.length === 0 ? <p className="p-6 text-slate-400">No completed payments.</p> : (
            <table className="w-full min-w-[640px] text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr><th className="px-5 py-3">Car</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Method</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completed.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{s.car_display}</td>
                    <td className="px-5 py-3 text-slate-600">{s.customer_name}</td>
                    <td className="px-5 py-3 text-slate-500">{s.sale_date}</td>
                    <td className="px-5 py-3 font-semibold text-emerald-600">{rs(s.final_amount)}</td>
                    <td className="px-5 py-3 capitalize text-slate-500">{s.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
