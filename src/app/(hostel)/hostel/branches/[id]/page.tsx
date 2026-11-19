"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Panel, StatCard, StatGrid } from "@/components/dashboard/kit";
import { api } from "@/lib/api";
import { errText, pkr } from "@/lib/hostel";
import { BedDouble, Users, Wallet } from "lucide-react";

export default function BranchDashboardPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/hostel/dashboard/?branch=${params.id}`).then(setData).catch((err) => setError(errText(err)));
  }, [params.id]);

  const stats = data?.stats;
  const branch = data?.charts?.branches?.find((row: { id: string }) => row.id === params.id);
  return (
    <div className="space-y-4">
      <Link href="/hostel/branches" className="text-xs font-semibold uppercase tracking-wide text-royal-700">All branches</Link>
      <h1 className="font-display text-3xl text-slate-900">{branch?.name || "Branch"}</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <StatGrid>
        <StatCard icon={BedDouble} label="Seats" value={String(stats?.seats ?? "—")} hint={`${stats?.available ?? 0} free`} />
        <StatCard icon={Users} label="Active guests" value={String(stats?.active_customers ?? "—")} />
        <StatCard icon={Wallet} label="Collected" value={stats ? pkr(stats.month_revenue) : "—"} tone="hero" />
        <StatCard icon={Wallet} label="Profit" value={stats?.profit != null ? pkr(stats.profit) : "—"} />
      </StatGrid>
      <Panel title="This branch">
        <p className="text-sm text-slate-500">Occupied {stats?.occupied ?? 0} · Reserved {stats?.reserved ?? 0} · Pending dues {stats ? pkr(stats.pending) : "—"} · Expenses {stats?.expenses != null ? pkr(stats.expenses) : "—"}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="btn btn-primary" href={`/hostel/rooms?branch=${params.id}`}>Rooms</Link>
          <Link className="btn btn-ghost" href={`/hostel/customers?branch=${params.id}`}>Customers</Link>
          <Link className="btn btn-ghost" href={`/hostel/reports?type=branch&branch=${params.id}`}>Print report</Link>
        </div>
      </Panel>
    </div>
  );
}
