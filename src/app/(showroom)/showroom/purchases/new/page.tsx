"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, api, asList, fieldErrors } from "@/lib/api";

type Ref = { id: string; name?: string; display_name?: string };

export default function NewPurchasePage() {
  const router = useRouter();
  const [cars, setCars] = useState<Ref[]>([]);
  const [sellers, setSellers] = useState<Ref[]>([]);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ car: "", seller: "", purchase_date: new Date().toISOString().slice(0,10), purchase_price: "0", additional_expenses: "0", advance_paid: "0", payment_method: "cash", notes: "" });

  useEffect(() => {
    Promise.all([
      api("/api/showroom/cars/?status=available").then((d) => setCars(asList(d as any))),
      api("/api/showroom/car-sellers/").then((d) => setSellers(asList(d as any))),
    ]).catch(() => {});
  }, []);

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  const total = parseFloat(form.purchase_price||"0") + parseFloat(form.additional_expenses||"0");
  const remaining = Math.max(0, total - parseFloat(form.advance_paid||"0"));

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setPending(true);
    try { await api("/api/showroom/car-purchases/", { method: "POST", body: JSON.stringify(form) }); router.push("/showroom/purchases"); }
    catch (err) { if (err instanceof ApiError) setErrors(fieldErrors(err.body)); }
    finally { setPending(false); }
  }

  const inp = (k: string, type = "text") => <input type={type} value={(form as any)[k]} onChange={(e) => set(k, e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-slate-900">Record Purchase</h1>
      <form onSubmit={onSubmit} className="space-y-5">
        {errors.detail && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.detail}</div>}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Car *</span>
            <select value={form.car} onChange={(e) => set("car", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500">
              <option value="">Select car</option>
              {cars.map((c) => <option key={c.id} value={c.id}>{c.display_name || c.name}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Seller *</span>
            <select value={form.seller} onChange={(e) => set("seller", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500">
              <option value="">Select seller</option>
              {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purchase Date</span>
            {inp("purchase_date", "date")}
          </label>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900">Payment Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purchase Price (Rs)</span>{inp("purchase_price","number")}</label>
            <label className="block space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Additional Expenses (Rs)</span>{inp("additional_expenses","number")}</label>
            <label className="block space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Advance Paid (Rs)</span>{inp("advance_paid","number")}</label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Method</span>
              <select value={form.payment_method} onChange={(e) => set("payment_method", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500">
                {["cash","bank","card","jazzcash","easypaisa"].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
            <div><p className="text-slate-400">Total Cost</p><p className="font-display text-xl font-semibold text-slate-900">Rs {total.toLocaleString()}</p></div>
            <div><p className="text-slate-400">Remaining</p><p className={`font-display text-xl font-semibold ${remaining > 0 ? "text-red-600" : "text-emerald-600"}`}>Rs {remaining.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={pending} className="btn btn-primary flex-1">{pending ? "Saving…" : "Save Purchase"}</button>
          <button type="button" onClick={() => router.back()} className="btn btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  );
}
