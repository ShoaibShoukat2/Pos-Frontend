"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { ApiError, api, asList, fieldErrors } from "@/lib/api";
import { rs } from "@/lib/money";

type Ref = { id: string; name: string };

type CarDetail = {
  id: string;
  brand: string;
  brand_name: string;
  model: string;
  variant: string;
  model_year: number;
  registration_number: string;
  chassis_number: string;
  engine_number: string;
  color: string;
  engine_cc: number;
  fuel_type: string | null;
  fuel_type_name: string;
  transmission: string | null;
  transmission_name: string;
  mileage_km: number;
  purchase_price: string;
  selling_price: string;
  status: string;
  notes: string;
  display_name: string;
};

const STATUSES = [
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
];

export default function CarDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [car, setCar] = useState<CarDetail | null>(null);
  const [brands, setBrands] = useState<Ref[]>([]);
  const [fuels, setFuels] = useState<Ref[]>([]);
  const [transmissions, setTransmissions] = useState<Ref[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    Promise.all([
      api<CarDetail>(`/api/showroom/cars/${params.id}/`),
      api("/api/showroom/car-brands/"),
      api("/api/showroom/fuel-types/"),
      api("/api/showroom/transmissions/"),
    ])
      .then(([row, brandRows, fuelRows, transmissionRows]) => {
        setCar(row);
        setBrands(asList(brandRows as Ref[]));
        setFuels(asList(fuelRows as Ref[]));
        setTransmissions(asList(transmissionRows as Ref[]));
        setForm({
          brand: row.brand || "",
          model: row.model || "",
          variant: row.variant || "",
          model_year: String(row.model_year || ""),
          registration_number: row.registration_number || "",
          chassis_number: row.chassis_number || "",
          engine_number: row.engine_number || "",
          color: row.color || "",
          engine_cc: String(row.engine_cc || 0),
          fuel_type: row.fuel_type || "",
          transmission: row.transmission || "",
          mileage_km: String(row.mileage_km || 0),
          purchase_price: row.purchase_price || "0",
          selling_price: row.selling_price || "0",
          status: row.status || "available",
          notes: row.notes || "",
        });
      })
      .catch(() => setMissing(true));
  }, [params.id]);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setSaved(false);
    setErrors({});
    try {
      const updated = await api<CarDetail>(`/api/showroom/cars/${params.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          model_year: Number(form.model_year),
          engine_cc: Number(form.engine_cc || 0),
          mileage_km: Number(form.mileage_km || 0),
          fuel_type: form.fuel_type || null,
          transmission: form.transmission || null,
        }),
      });
      setCar(updated);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
      else setErrors({ detail: "Could not save this car." });
    } finally {
      setPending(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10";

  if (missing) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="font-medium text-slate-700">This car is not in the inventory.</p>
        <Link href="/showroom/inventory" className="mt-3 inline-block text-sm text-indigo-600">Back to inventory</Link>
      </div>
    );
  }

  if (!car) return <p className="py-10 text-center text-sm text-slate-400">Loading car…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link href="/showroom/inventory" className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Inventory</Link>
          <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">{car.display_name}</h1>
          <p className="mt-1 text-sm text-slate-400">
            Listed {rs(car.selling_price)} · Cost {rs(car.purchase_price)}
          </p>
        </div>
        {car.status !== "sold" ? (
          <Link href={`/showroom/pos?car=${car.id}`} className="btn btn-primary">Sell this car</Link>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-2">
        {errors.detail ? <p className="text-sm text-red-600 md:col-span-2">{errors.detail}</p> : null}
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Brand</span>
          <select className={fieldClass} value={form.brand || ""} onChange={(e) => set("brand", e.target.value)} required>
            <option value="">Select…</option>
            {brands.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Model</span>
          <input className={fieldClass} value={form.model || ""} onChange={(e) => set("model", e.target.value)} required />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Variant</span>
          <input className={fieldClass} value={form.variant || ""} onChange={(e) => set("variant", e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Year</span>
          <input className={fieldClass} type="number" value={form.model_year || ""} onChange={(e) => set("model_year", e.target.value)} required />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registration</span>
          <input className={fieldClass} value={form.registration_number || ""} onChange={(e) => set("registration_number", e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Color</span>
          <input className={fieldClass} value={form.color || ""} onChange={(e) => set("color", e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chassis</span>
          <input className={fieldClass} value={form.chassis_number || ""} onChange={(e) => set("chassis_number", e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Engine no.</span>
          <input className={fieldClass} value={form.engine_number || ""} onChange={(e) => set("engine_number", e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fuel</span>
          <select className={fieldClass} value={form.fuel_type || ""} onChange={(e) => set("fuel_type", e.target.value)}>
            <option value="">Select…</option>
            {fuels.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transmission</span>
          <select className={fieldClass} value={form.transmission || ""} onChange={(e) => set("transmission", e.target.value)}>
            <option value="">Select…</option>
            {transmissions.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mileage (km)</span>
          <input className={fieldClass} type="number" value={form.mileage_km || ""} onChange={(e) => set("mileage_km", e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Engine cc</span>
          <input className={fieldClass} type="number" value={form.engine_cc || ""} onChange={(e) => set("engine_cc", e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purchase price</span>
          <input className={fieldClass} type="number" step="0.01" value={form.purchase_price || ""} onChange={(e) => set("purchase_price", e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selling price</span>
          <input className={fieldClass} type="number" step="0.01" value={form.selling_price || ""} onChange={(e) => set("selling_price", e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
          <select className={fieldClass} value={form.status || "available"} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
          <textarea className={`${fieldClass} min-h-24`} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
        </label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Save car"}</button>
          <button type="button" className="btn btn-ghost" onClick={() => router.push("/showroom/inventory")}>Back</button>
          {saved ? <span className="text-sm text-emerald-700">Saved</span> : null}
        </div>
      </form>
    </div>
  );
}
