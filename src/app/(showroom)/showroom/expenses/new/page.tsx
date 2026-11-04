"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, api, asList, fieldErrors } from "@/lib/api";

type Ref = { id: string; name?: string; display_name?: string };

export default function NewExpensePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Ref[]>([]);
  const [cars, setCars] = useState<Ref[]>([]);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ category: "", car: "", title: "", amount: "0", expense_date: new Date().toISOString().slice(0,10), payment_method: "cash", description: "" });

  useEffect(() => {
    Promise.all([
      api("/api/showroom/showroom-expense-categories/").then((d) => setCategories(asList(d as any))),
      api("/api/showroom/cars/").then((d) => setCars(asList(d as any))),
    ]).catch(() => {});
  }, []);

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setPending(true);
    try {
      await api("/api/showroom/showroom-expenses/", { method: "POST", body: JSON.stringify({ ...form, car: form.car || null }) });
      router.push("/showroom/expenses");
    } catch (err) { if (err instanceof ApiError) setErrors(fieldErrors(err.body)); }
    finally { setPending(false); }
  }

  const inp = (k: string, type = "text") => <input type={type} value={(form as any)[k]} onChange={(e) => set(k, e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-semibold text-slate-900">Add Expense</h1>
      <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        {errors.detail && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.detail}</div>}
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category *</span>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500">
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title *</span>
          {inp("title")}
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Car (optional — for car-specific expense)</span>
          <select value={form.car} onChange={(e) => set("car", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500">
            <option value="">General expense</option>
            {cars.map((c) => <option key={c.id} value={c.id}>{c.display_name || c.name}</option>)}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount (Rs)</span>
            {inp("amount", "number")}
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</span>
            {inp("expense_date", "date")}
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Method</span>
          <select value={form.payment_method} onChange={(e) => set("payment_method", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500">
            {["cash","bank","card","jazzcash","easypaisa"].map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500" />
        </label>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={pending} className="btn btn-primary flex-1">{pending ? "Saving…" : "Save Expense"}</button>
          <button type="button" onClick={() => router.back()} className="btn btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  );
}
