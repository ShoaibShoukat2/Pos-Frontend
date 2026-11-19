"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BedDouble, Building2, CircleDollarSign, Users, Wallet } from "lucide-react";

import { AreaChart, DashHeader, Donut, Panel, StatCard, StatGrid } from "@/components/dashboard/kit";
import { useHostel } from "@/components/hostel/session";
import { api, asList } from "@/lib/api";
import { errText, pkr } from "@/lib/hostel";

type Dash = {
  role: string;
  show_finance: boolean;
  period: { from: string; to: string };
  stats: Record<string, string | number | null>;
  charts: {
    revenue: { label: string; value: number }[];
    expenses: { label: string; value: number }[];
    occupancy: { available: number; occupied: number; reserved: number; maintenance: number };
    branches: { id: string; name: string; revenue: string; expenses: string; profit: string; occupancy: number; seats: number; occupied: number }[];
  };
  alerts: { kind: string; title: string; body: string; href: string }[];
  recent_payments: { id: string; receipt_no: string; customer: string; amount: string; date: string; method: string; received_by: string; branch: string }[];
};

type Branch = { id: string; name: string };
type Person = { id: string; full_name: string };

export default function HostelDashboardPage() {
  const { session } = useHostel();
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<Person[]>([]);
  const [filters, setFilters] = useState({ branch: "", month: "", employee: "", payment_status: "" });

  useEffect(() => {
    api("/api/hostel/branches/").then((rows) => setBranches(asList(rows))).catch(() => setBranches([]));
    if (session?.role !== "employee") {
      api("/api/hostel/employees/").then((rows) => setStaff(asList(rows))).catch(() => setStaff([]));
    }
  }, [session?.role]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.branch) params.set("branch", filters.branch);
    if (filters.employee) params.set("employee", filters.employee);
    if (filters.payment_status) params.set("payment_status", filters.payment_status);
    if (filters.month) {
      const [year, month] = filters.month.split("-");
      params.set("year", year);
      params.set("month", String(Number(month)));
    }
    api<Dash>(`/api/hostel/dashboard/?${params.toString()}`)
      .then(setData)
      .catch((err) => setError(errText(err)));
  }, [filters]);

  const stats = data?.stats;
  return (
    <div className="space-y-5">
      <DashHeader name={session?.full_name || ""} subtitle={`${session?.hostel_name || "Hostel"} · ${session?.role || ""}`}>
        <select className="field" value={filters.month} onChange={(event) => setFilters({ ...filters, month: event.target.value })}>
          <option value="">This month</option>
          <option value="2026-01">Jan 2026</option>
          <option value="2026-02">Feb 2026</option>
          <option value="2026-03">Mar 2026</option>
          <option value="2026-04">Apr 2026</option>
          <option value="2026-05">May 2026</option>
          <option value="2026-06">Jun 2026</option>
          <option value="2026-07">Jul 2026</option>
          <option value="2026-08">Aug 2026</option>
          <option value="2026-09">Sep 2026</option>
          <option value="2026-10">Oct 2026</option>
          <option value="2026-11">Nov 2026</option>
          <option value="2026-12">Dec 2026</option>
        </select>
        {session?.role === "owner" ? (
          <select className="field" value={filters.branch} onChange={(event) => setFilters({ ...filters, branch: event.target.value })}>
            <option value="">All branches</option>
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        ) : null}
        {session?.role === "owner" ? (
          <select className="field" value={filters.employee} onChange={(event) => setFilters({ ...filters, employee: event.target.value })}>
            <option value="">All employees</option>
            {staff.map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}
          </select>
        ) : null}
        <select className="field" value={filters.payment_status} onChange={(event) => setFilters({ ...filters, payment_status: event.target.value })}>
          <option value="">Any dues</option>
          <option value="paid">Paid</option>
          <option value="partial">Partially paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="overdue">Overdue</option>
        </select>
      </DashHeader>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <StatGrid cols="xl:grid-cols-5">
        <StatCard icon={Building2} label="Branches" value={String(stats?.branches ?? "—")} href="/hostel/branches" />
        <StatCard icon={BedDouble} label="Rooms" value={String(stats?.rooms ?? "—")} href="/hostel/rooms" />
        <StatCard icon={BedDouble} label="Seats" value={String(stats?.seats ?? "—")} hint={`${stats?.available ?? 0} free`} href="/hostel/seats" tone="hero" />
        <StatCard icon={Users} label="Customers" value={String(stats?.active_customers ?? "—")} hint={`${stats?.customers ?? 0} total`} href="/hostel/customers" />
        <StatCard icon={Wallet} label="Collected in period" value={stats ? pkr(stats.month_revenue) : "—"} href="/hostel/payments/history" />
        <StatCard icon={CircleDollarSign} label="All collected" value={stats ? pkr(stats.collected) : "—"} />
        <StatCard icon={Wallet} label="Pending dues" value={stats ? pkr(stats.pending) : "—"} href="/hostel/payments" />
        <StatCard icon={Wallet} label="Overdue" value={stats ? pkr(stats.overdue) : "—"} />
        {data?.show_finance ? <StatCard icon={Wallet} label="Expenses" value={pkr(stats?.expenses)} /> : null}
        {data?.show_finance ? <StatCard icon={CircleDollarSign} label="Period profit" value={pkr(stats?.profit)} tone="hero" /> : null}
      </StatGrid>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Collection trend" className="xl:col-span-2">
          <AreaChart points={data?.charts.revenue || []} />
        </Panel>
        <Panel title="Seat occupancy">
          <Donut
            center={String(stats?.seats ?? 0)}
            caption="seats"
            parts={[
              { label: "Available", value: data?.charts.occupancy.available || 0 },
              { label: "Occupied", value: data?.charts.occupancy.occupied || 0 },
              { label: "Reserved", value: data?.charts.occupancy.reserved || 0 },
              { label: "Maintenance", value: data?.charts.occupancy.maintenance || 0 },
            ]}
          />
        </Panel>
      </div>
      {data?.show_finance ? (
        <Panel title="Monthly expenses">
          <AreaChart points={data.charts.expenses || []} />
        </Panel>
      ) : null}
      {data?.charts.branches?.length ? (
        <Panel title="Branch performance">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr><th className="py-2">Branch</th><th>Collected</th><th>Expenses</th><th>Profit</th><th>Occupancy</th></tr>
              </thead>
              <tbody>
                {data.charts.branches.map((branch) => (
                  <tr key={branch.id} className="border-t border-slate-100">
                    <td className="py-2 font-medium"><Link className="text-royal-800" href={`/hostel/branches/${branch.id}`}>{branch.name}</Link></td>
                    <td>{pkr(branch.revenue)}</td>
                    <td>{pkr(branch.expenses)}</td>
                    <td>{pkr(branch.profit)}</td>
                    <td>{branch.occupancy}% · {branch.occupied}/{branch.seats}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Alerts">
          {data?.alerts?.length ? data.alerts.map((alert) => (
            <Link key={alert.title} href={alert.href} className="mb-2 block rounded-xl bg-royal-50 px-3 py-2">
              <p className="text-sm font-semibold text-royal-950">{alert.title}</p>
              <p className="text-xs text-slate-500">{alert.body}</p>
            </Link>
          )) : <p className="text-sm text-slate-400">No alerts for this view.</p>}
        </Panel>
        <Panel title="Recent payments" action={<Link href="/hostel/payments/history" className="text-xs font-semibold text-royal-700">History</Link>}>
          {data?.recent_payments?.length ? data.recent_payments.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 text-sm">
              <div>
                <p className="font-medium text-slate-900">{row.customer}</p>
                <p className="text-xs text-slate-400">{row.receipt_no} · {row.date} · {row.received_by}</p>
              </div>
              <p className="font-semibold">{pkr(row.amount)}</p>
            </div>
          )) : <p className="text-sm text-slate-400">No payments in this period.</p>}
        </Panel>
      </div>
    </div>
  );
}
