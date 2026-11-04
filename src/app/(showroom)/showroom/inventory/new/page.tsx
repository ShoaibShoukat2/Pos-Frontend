"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { ApiError, api, asList, fieldErrors } from "@/lib/api";

type Ref = { id: string; name: string };

export default function AddCarPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Ref[]>([]);
  const [fuels, setFuels] = useState<Ref[]>([]);
  const [transmissions, setTransmissions] = useState<Ref[]>([]);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    brand: "", model: "", variant: "", model_year: String(new Date().getFullYear()),
    registration_number: "", chassis_number: "", engine_number: "",
    color: "", engine_cc: "0", fuel_type: "", transmission: "",
    mileage_km: "0", purchase_price: "0", selling_price: "0",
    status: "available", notes: "",
  });

  useEffect(() => {
    Promise.all([
      api("/api/showroom/car-brands/").then((d) => setBrands(asList(d as any))),
      api("/api/showroom/fuel-types/").then((d) => setFuels(asList(d as any))),
      api("/api/showroom/transmissions/").then((d) => setTransmissions(asList(d as any))),
    ]).catch(() => {});
  }, []);

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true); setErrors({});
    try {
      await api("/api/showroom/cars/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          model_year: Number(form.model_year),
          engine_cc: Number(form.engine_cc),
          mileage_km: Number(form.mileage_km),
          fuel_type: form.fuel_type || null,
          transmission: form.transmission || null,
        }),
      });
      router.push("/showroom/inventory");
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
    } finally { setPending(false); }
  }

  const F = ({ label, children, err }: { label: string; children: React.ReactNode; err?: string }) => (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {err ? <span className="text-xs text-red-600">{err}</span> : null}
    </label>
  );
  const inp = (k: string, type = "text", placeholder = "") => (
    <input type={type} value={(form as any)[k]} placeholder={placeholder}
      onChange={(e) => set(k, e.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
  );
  const sel = (k: string, opts: Ref[], placeholder = "Select…") => (
    <select value={(form as any)[k]} onChange={(e) => set(k, e.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10">
      <option value="">{placeholder}</option>
      {opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Inventory</p>
        <h1 className="font-display text-2xl font-semibold text-slate-900">Add New Car</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {errors.detail ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.detail}</div> : null}

        {/* Basic info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-semibold text-slate-900">Basic Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Brand *" err={errors.brand}>{sel("brand", brands, "Select brand")}</F>
            <F label="Model *" err={errors.model}>{inp("model", "text", "e.g. Corolla")}</F>
            <F label="Variant">{inp("variant", "text", "e.g. XLI, GLI")}</F>
            <F label="Model Year *">{inp("model_year", "number")}</F>
            <F label="Color">{inp("color", "text", "e.g. White")}</F>
            <F label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10">
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
            </F>
          </div>
        </div>

        {/* Identity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-semibold text-slate-900">Vehicle Identity</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Registration Number">{inp("registration_number")}</F>
            <F label="Chassis Number">{inp("chassis_number")}</F>
            <F label="Engine Number">{inp("engine_number")}</F>
            <F label="Engine CC">{inp("engine_cc", "number")}</F>
            <F label="Fuel Type">{sel("fuel_type", fuels, "Select fuel type")}</F>
            <F label="Transmission">{sel("transmission", transmissions, "Select transmission")}</F>
            <F label="Mileage (KM)">{inp("mileage_km", "number")}</F>
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-semibold text-slate-900">Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Purchase Price (Rs)">{inp("purchase_price", "number")}</F>
            <F label="Selling Price (Rs)">{inp("selling_price", "number")}</F>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-semibold text-slate-900">Notes</h2>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={pending}
            className="btn btn-primary flex-1">
            {pending ? "Saving…" : "Save Car"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="btn btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
