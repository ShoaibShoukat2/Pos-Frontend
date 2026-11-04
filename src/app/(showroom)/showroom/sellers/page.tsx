"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, asList } from "@/lib/api";

type Seller = { id: string; name: string; phone: string; cnic: string; address: string; };

export default function SellersPage() {
  const [rows, setRows] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api("/api/showroom/car-sellers/").then((d) => setRows(asList(d as any))).finally(() => setLoading(false)); }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Sellers / Suppliers</h1>
        <Link href="/showroom/sellers/new" className="btn btn-primary inline-flex items-center gap-2"><Plus size={16}/>Add Seller</Link>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? <p className="p-6 text-slate-400">Loading…</p> : rows.length === 0 ? <p className="p-6 text-slate-400">No sellers yet.</p> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">CNIC</th><th className="px-5 py-3">Address</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{r.name}</td>
                  <td className="px-5 py-3 text-slate-600">{r.phone || "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{r.cnic || "—"}</td>
                  <td className="px-5 py-3 text-slate-500">{r.address || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
