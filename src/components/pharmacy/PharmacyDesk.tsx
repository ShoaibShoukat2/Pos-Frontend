"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pill } from "lucide-react";

import { api } from "@/lib/api";

type Summary = {
  medicines: number;
  on_hand_qty: string;
  low_stock: number;
  expiring: number;
};

export function PharmacyDesk() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    api<Summary>("/api/inventory/summary/").then(setData).catch(() => setData(null));
  }, []);

  return (
    <Link href="/pharmacy" className="block rounded-2xl border border-royal-200 bg-white p-4 shadow-sm transition hover:border-royal-800 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-royal-900 text-white">
            <Pill size={18} />
          </span>
          <span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-royal-800">Pharmacy</span>
            <span className="block font-display text-xl text-slate-950">Inventory</span>
            <span className="mt-0.5 block text-sm text-slate-500">Medicines, batches, expiry, and stock on their own page.</span>
          </span>
        </div>
        <span className="inline-flex h-10 items-center justify-center rounded-xl bg-royal-900 px-4 text-sm font-semibold text-white">Open inventory</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <DeskStat label="Medicines" value={data ? String(data.medicines) : "—"} />
        <DeskStat label="On hand" value={data ? qty(data.on_hand_qty) : "—"} />
        <DeskStat label="Low stock" value={data ? String(data.low_stock) : "—"} />
        <DeskStat label="Expiring" value={data ? String(data.expiring) : "—"} />
      </div>
    </Link>
  );
}

function DeskStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-xl bg-slate-50 px-3 py-2">
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="block text-sm font-semibold text-slate-900">{value}</span>
    </span>
  );
}

function qty(value: string | number | null | undefined) {
  const amount = Number(value || 0);
  return amount.toLocaleString("en-PK", { maximumFractionDigits: 0 });
}
