"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, asList } from "@/lib/api";

type Car = {
  id: string;
  display_name: string;
  registration_number: string;
  color: string;
  daily_rate: string;
  status: string;
  model_year: number;
};

const STATUS: Record<string, string> = {
  available: "bg-royal-50 text-royal-800",
  rented: "bg-gold-300/40 text-royal-950",
  maintenance: "bg-amber-50 text-amber-700",
};

export default function FleetPage() {
  const [rows, setRows] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api<Car[] | { results?: Car[] }>("/api/rental/rental-cars/")
      .then((data) => setRows(asList(data)))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string) {
    await api(`/api/rental/rental-cars/${id}/`, { method: "PATCH", body: JSON.stringify({ status }) });
    load();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Fleet</h1>
        <Link href="/rental/fleet/new" className="inline-flex items-center gap-2 rounded-xl bg-royal-900 px-4 py-2.5 text-sm font-medium text-white"><Plus size={16} /> Add car</Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? <p className="p-6 text-slate-400">Loading…</p> : rows.length === 0 ? <p className="p-6 text-slate-400">No cars yet.</p> : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Car</th>
                <th className="px-5 py-3">Registration</th>
                <th className="px-5 py-3">Daily rate</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{row.display_name}</p>
                    <p className="text-xs text-slate-400">{row.color || "—"}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{row.registration_number || "—"}</td>
                  <td className="px-5 py-3 text-slate-600">Rs {Number(row.daily_rate || 0).toLocaleString("en-PK")}</td>
                  <td className="px-5 py-3">
                    {row.status === "rented" ? (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS.rented}`}>On rent</span>
                    ) : (
                      <select value={row.status} onChange={(event) => setStatus(row.id, event.target.value)} className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS[row.status] || ""}`}>
                        <option value="available">Available</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
