"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, asList } from "@/lib/api";

type Customer = { id: string; name: string; phone: string; cnic: string; address: string };

export default function RentalCustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Customer[] | { results?: Customer[] }>("/api/rental/rental-customers/")
      .then((data) => setRows(asList(data)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Customers</h1>
        <Link href="/rental/customers/new" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white"><Plus size={16} /> Add customer</Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? <p className="p-6 text-slate-400">Loading…</p> : rows.length === 0 ? <p className="p-6 text-slate-400">No customers yet.</p> : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">CNIC</th><th className="px-5 py-3">Address</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-3 font-medium text-slate-900">{row.name}</td>
                  <td className="px-5 py-3 text-slate-600">{row.phone || "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{row.cnic || "—"}</td>
                  <td className="px-5 py-3 text-slate-500">{row.address || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
