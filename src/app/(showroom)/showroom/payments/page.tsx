"use client";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, api, asList, fieldErrors } from "@/lib/api";
import { rs } from "@/lib/money";

type Sale = { id: string; car_display: string; customer_name: string; final_amount: string; received_amount: string; remaining_amount: string; payment_method: string; sale_date: string; };

export default function PaymentsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Sale | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [error, setError] = useState("");
  const [pendingSave, setPendingSave] = useState(false);

  function load() {
    return api("/api/showroom/car-sales/")
      .then((d) => setSales(asList<Sale>(d as Sale[] | { results: Sale[] })))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function startReceive(sale: Sale) {
    setActive(sale);
    setAmount(sale.remaining_amount);
    setMethod(sale.payment_method || "cash");
    setError("");
  }

  async function onReceive(e: FormEvent) {
    e.preventDefault();
    if (!active) return;
    setPendingSave(true);
    setError("");
    try {
      await api(`/api/showroom/car-sales/${active.id}/receive/`, {
        method: "POST",
        body: JSON.stringify({
          amount,
          payment_method: method,
          payment_date: new Date().toISOString().slice(0, 10),
        }),
      });
      setActive(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        const fields = fieldErrors(err.body);
        setError(fields.amount || fields.detail || "Could not record this payment.");
      } else setError("Could not record this payment.");
    } finally {
      setPendingSave(false);
    }
  }

  const pending = sales.filter((s) => parseFloat(s.remaining_amount) > 0);
  const completed = sales.filter((s) => parseFloat(s.remaining_amount) <= 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <h1 className="font-display text-2xl font-semibold text-slate-900">Payments</h1>

      {active ? (
        <form onSubmit={onReceive} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Receive balance</p>
          <h2 className="mt-1 font-semibold text-slate-900">{active.car_display}</h2>
          <p className="text-sm text-slate-500">{active.customer_name} · due {rs(active.remaining_amount)}</p>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" step="0.01" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" required />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Method</span>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5">
                <option value="cash">Cash</option>
                <option value="bank">Bank transfer</option>
                <option value="card">Card</option>
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">Easypaisa</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" disabled={pendingSave} className="btn btn-primary">{pendingSave ? "Saving…" : "Save payment"}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setActive(null)}>Cancel</button>
          </div>
        </form>
      ) : null}

      {pending.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-red-600 uppercase tracking-widest">Pending Dues ({pending.length})</h2>
          <div className="rounded-2xl border border-red-200 bg-white overflow-x-auto shadow-sm">
            <table className="w-full min-w-[640px] text-sm text-left">
              <thead className="bg-red-50 text-xs uppercase tracking-wide text-red-400">
                <tr><th className="px-5 py-3">Car</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Received</th><th className="px-5 py-3">Due</th><th className="px-5 py-3">Method</th><th className="px-5 py-3" /></tr>
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
                    <td className="px-5 py-3 text-right">
                      <button type="button" onClick={() => startReceive(s)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
                        Receive
                      </button>
                    </td>
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
