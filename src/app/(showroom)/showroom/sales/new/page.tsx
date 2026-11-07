"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, api, asList, fieldErrors } from "@/lib/api";
import { CarSaleInvoice, type CarInvoiceData } from "@/components/showroom/CarSaleInvoice";
import { useAuth } from "@/lib/auth";

type Ref = { id: string; display_name?: string; name?: string };

export default function NewSalePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [cars, setCars] = useState<Ref[]>([]);
  const [customers, setCustomers] = useState<Ref[]>([]);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [invoice, setInvoice] = useState<CarInvoiceData | null>(null);
  const [form, setForm] = useState({
    car: "", customer: "", sale_date: new Date().toISOString().slice(0, 10),
    selling_price: "0", discount: "0", received_amount: "0",
    payment_method: "cash", notes: "",
  });

  useEffect(() => {
    Promise.all([
      api("/api/showroom/cars/?status=available").then((d) => setCars(asList(d as any))),
      api("/api/showroom/showroom-customers/").then((d) => setCustomers(asList(d as any))),
    ]).catch(() => {});
  }, []);

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  const final = Math.max(0, parseFloat(form.selling_price || "0") - parseFloat(form.discount || "0"));
  const remaining = Math.max(0, final - parseFloat(form.received_amount || "0"));

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setPending(true); setErrors({});
    try {
      await api("/api/showroom/car-sales/", { method: "POST", body: JSON.stringify(form) });
      router.push("/showroom/sales");
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
    } finally { setPending(false); }
  }

  const inp = (k: string, type = "text") => (
    <input type={type} value={(form as any)[k]} onChange={(e) => set(k, e.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Sales</p>
        <h1 className="font-display text-2xl font-semibold text-slate-900">New Car Sale</h1>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        {errors.detail ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.detail}</div> : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Car *</span>
            <select value={form.car} onChange={(e) => { set("car", e.target.value); const c = cars.find(c => c.id === e.target.value); }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500">
              <option value="">Select available car</option>
              {cars.map((c) => <option key={c.id} value={c.id}>{c.display_name || c.name}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer *</span>
            <select value={form.customer} onChange={(e) => set("customer", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500">
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sale Date</span>
            {inp("sale_date", "date")}
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900">Payment</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selling Price (Rs)</span>
              {inp("selling_price", "number")}
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Discount (Rs)</span>
              {inp("discount", "number")}
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Received Amount (Rs)</span>
              {inp("received_amount", "number")}
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Method</span>
              <select value={form.payment_method} onChange={(e) => set("payment_method", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500">
                {["cash","bank","card","jazzcash","easypaisa"].map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
            <div><p className="text-slate-400">Final Amount</p><p className="font-display text-xl font-semibold text-slate-900">Rs {final.toLocaleString()}</p></div>
            <div><p className="text-slate-400">Remaining</p><p className={`font-display text-xl font-semibold ${remaining > 0 ? "text-red-600" : "text-emerald-600"}`}>Rs {remaining.toLocaleString()}</p></div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={pending} className="btn btn-primary flex-1">{pending ? "Saving…" : "Complete Sale"}</button>
          <button type="button" onClick={() => router.back()} className="btn btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  );
}
