"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, asList } from "@/lib/api";
import { rs } from "@/lib/money";

type Expense = { id: string; title: string; category_name: string; amount: string; expense_date: string; car_display: string; payment_method: string; };

export default function ExpensesPage() {
  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api("/api/showroom/showroom-expenses/").then((d) => setRows(asList(d as any))).finally(() => setLoading(false)); }, []);

  const total = rows.reduce((s, r) => s + parseFloat(r.amount || "0"), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Expenses</h1>
          {rows.length > 0 && <p className="text-sm text-slate-400 mt-0.5">Total: <span className="font-semibold text-slate-700">{rs(total)}</span></p>}
        </div>
        <Link href="/showroom/expenses/new" className="btn btn-primary inline-flex items-center gap-2"><Plus size={16}/>Add Expense</Link>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? <p className="p-6 text-slate-400">Loading…</p> : rows.length === 0 ? <p className="p-6 text-slate-400">No expenses yet.</p> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr><th className="px-5 py-3">Title</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Car</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{r.title}</td>
                  <td className="px-5 py-3 text-slate-500">{r.category_name}</td>
                  <td className="px-5 py-3 text-slate-500">{r.car_display || <span className="text-slate-300">General</span>}</td>
                  <td className="px-5 py-3 text-slate-500">{r.expense_date}</td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{rs(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
