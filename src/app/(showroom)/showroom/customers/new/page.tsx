"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ApiError, api, fieldErrors } from "@/lib/api";

export default function NewCustomerPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", cnic: "", address: "" });
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }
  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setPending(true);
    try { await api("/api/showroom/showroom-customers/", { method: "POST", body: JSON.stringify(form) }); router.push("/showroom/customers"); }
    catch (err) { if (err instanceof ApiError) setErrors(fieldErrors(err.body)); }
    finally { setPending(false); }
  }
  const inp = (k: string) => <input value={(form as any)[k]} onChange={(e) => set(k, e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />;
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-semibold text-slate-900">New Customer</h1>
      <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        {["name","phone","cnic"].map((k) => (
          <label key={k} className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k === "cnic" ? "CNIC" : k.charAt(0).toUpperCase() + k.slice(1)}</span>
            {inp(k)}
            {errors[k] ? <span className="text-xs text-red-600">{errors[k]}</span> : null}
          </label>
        ))}
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</span>
          <textarea value={form.address} onChange={(e) => set("address", e.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
        </label>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={pending} className="btn btn-primary flex-1">{pending ? "Saving…" : "Save Customer"}</button>
          <button type="button" onClick={() => router.back()} className="btn btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  );
}
