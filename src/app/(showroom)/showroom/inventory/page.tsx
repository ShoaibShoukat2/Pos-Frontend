"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Car, Plus, Search } from "lucide-react";

import { api, asList } from "@/lib/api";
import { rs } from "@/lib/money";

type CarItem = {
  id: string; display_name: string; brand_name: string;
  model: string; variant: string; model_year: number;
  color: string; registration_number: string; mileage_km: number;
  purchase_price: string; selling_price: string; status: string;
};

const STATUS_STYLE: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reserved:  "bg-amber-50 text-amber-700 border-amber-200",
  sold:      "bg-slate-100 text-slate-500 border-slate-200",
};

export default function InventoryPage() {
  const [cars, setCars] = useState<CarItem[]>([]);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (q) params.set("search", q);
    api(`/api/showroom/cars/?${params}`)
      .then((d) => setCars(asList(d as any)))
      .catch(() => setCars([]))
      .finally(() => setLoading(false));
  }, [status, q]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Showroom</p>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Car Inventory</h1>
        </div>
        <Link href="/showroom/inventory/new" className="btn btn-primary inline-flex items-center gap-2">
          <Plus size={16} /> Add Car
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all","available","reserved","sold"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              status === s ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
            }`}
          >
            {s === "all" ? "All cars" : s}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search brand, model, reg…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
          />
        </div>
      </div>

      {/* Cars grid */}
      {loading ? (
        <p className="py-8 text-center text-slate-400">Loading…</p>
      ) : cars.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <Car size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-500">No cars found</p>
          <Link href="/showroom/inventory/new" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">Add your first car</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <Link
              key={car.id}
              href={`/showroom/inventory/${car.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                  <Car size={20} className="text-indigo-600" />
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${STATUS_STYLE[car.status] || STATUS_STYLE.available}`}>
                  {car.status}
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900 leading-tight">
                {car.display_name}
              </h3>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
                {car.color ? <span>{car.color}</span> : null}
                {car.registration_number ? <span>{car.registration_number}</span> : null}
                {car.mileage_km ? <span>{car.mileage_km.toLocaleString()} km</span> : null}
              </div>
              <div className="mt-4 flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-[10px] text-slate-400">Selling price</p>
                  <p className="font-display text-xl font-semibold text-slate-900">{rs(car.selling_price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">Purchase</p>
                  <p className="text-sm text-slate-500">{rs(car.purchase_price)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
