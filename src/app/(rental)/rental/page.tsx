"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { KeyRound } from "lucide-react";

import { RentalInvoice } from "@/components/rental/RentalInvoice";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { invoiceFromRental, rentalMessage, whatsAppLink, type RentalInvoiceData } from "@/lib/rental";

type RentalRow = {
  id: string;
  invoice_number: string;
  car: string;
  registration_number: string;
  customer: string;
  phone: string;
  cnic: string;
  start_date: string;
  end_date: string;
  days: number;
  daily_rate: string;
  total_amount: string;
  deposit: string;
  received_amount: string;
  balance: string;
  payment_method: string;
  status: string;
  signed: boolean;
};

type FleetRow = {
  id: string;
  name: string;
  registration_number: string;
  color: string;
  daily_rate: string;
  status: string;
};

type Dashboard = {
  cars_total: number;
  available: number;
  rented: number;
  maintenance: number;
  active_count: number;
  due_today: number;
  overdue: number;
  month_revenue: string;
  deposits_held: string;
  outstanding: string;
  rentals: RentalRow[];
  fleet: FleetRow[];
};

const STATUS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  due_today: "bg-amber-50 text-amber-700",
  overdue: "bg-red-50 text-red-700",
  completed: "bg-slate-100 text-slate-500",
  available: "bg-emerald-50 text-emerald-700",
  rented: "bg-sky-50 text-sky-700",
  maintenance: "bg-amber-50 text-amber-700",
};

function money(value: string | number) {
  return `Rs ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function label(status: string) {
  if (status === "due_today") return "Due today";
  if (status === "overdue") return "Overdue";
  return status.replace("_", " ");
}

export default function RentalDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState<RentalInvoiceData | null>(null);
  const [opening, setOpening] = useState("");

  const load = useCallback(() => {
    api<Dashboard>("/api/rental/dashboard/")
      .then((row) => {
        setData(row);
        setError("");
      })
      .catch(() => setError("Rental details could not be loaded. Check that this business is signed in on the updated server."));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function preview(id: string) {
    setOpening(id);
    try {
      const row = await api<Parameters<typeof invoiceFromRental>[0]>(`/api/rental/rentals/${id}/`);
      setInvoice(invoiceFromRental(row, { name: user?.business_name, cashier: user?.full_name }));
    } catch {
      setError("Could not open this rental invoice.");
    } finally {
      setOpening("");
    }
  }

  async function markReturned(id: string) {
    if (!window.confirm("Mark this car as returned and available again?")) return;
    try {
      await api(`/api/rental/rentals/${id}/complete/`, { method: "POST" });
      load();
    } catch {
      setError("Could not close this rental.");
    }
  }

  const stats = data
    ? [
        ["Fleet", data.cars_total],
        ["Available", data.available],
        ["On rent", data.rented],
        ["Due today", data.due_today],
        ["Overdue", data.overdue],
        ["This month", money(data.month_revenue)],
        ["Deposits held", money(data.deposits_held)],
        ["Outstanding", money(data.outstanding)],
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {invoice ? <RentalInvoice data={invoice} onClose={() => setInvoice(null)} /> : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Rent a Car</p>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-400">Live rentals, fleet, balances, and return dates.</p>
        </div>
        <Link href="/rental/counter" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white">
          <KeyRound size={15} /> New rental
        </Link>
      </div>

      {error ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(stats.length ? stats : [["Fleet", "—"], ["Available", "—"], ["On rent", "—"], ["Outstanding", "—"]]).map(([name, value]) => (
          <div key={name} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{name}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Rentals</h2>
          <p className="text-xs text-slate-400">{data?.active_count ?? 0} active</p>
        </div>
        {!data ? (
          <p className="p-6 text-sm text-slate-400">Loading rental details…</p>
        ) : data.rentals.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No rentals yet. Start one from the rent counter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  {["Invoice", "Car", "Customer", "Phone", "CNIC", "Dates", "Days", "Rate", "Total", "Deposit", "Received", "Balance", "Status", ""].map((head) => (
                    <th key={head || "actions"} className="px-4 py-3 font-semibold">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.rentals.map((row) => {
                  const wa = whatsAppLink(row.phone, rentalMessage({ ...row, shop: user?.business_name }));
                  const open = row.status !== "completed";
                  return (
                    <tr key={row.id} className="align-top hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{row.invoice_number || "—"}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{row.car}</p>
                        <p className="text-xs text-slate-400">{row.registration_number || "No registration"}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.customer}</td>
                      <td className="px-4 py-3 text-slate-600">{row.phone || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{row.cnic || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{row.start_date}<br />{row.end_date}</td>
                      <td className="px-4 py-3">{row.days}</td>
                      <td className="px-4 py-3">{money(row.daily_rate)}</td>
                      <td className="px-4 py-3">{money(row.total_amount)}</td>
                      <td className="px-4 py-3">{money(row.deposit)}</td>
                      <td className="px-4 py-3">{money(row.received_amount)}</td>
                      <td className="px-4 py-3 font-medium">{Number(row.balance) > 0 ? money(row.balance) : "Cleared"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS[row.status] || STATUS.completed}`}>{label(row.status)}</span>
                        <p className="mt-1 text-[11px] text-slate-400">{row.signed ? "Signed" : "Not signed"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1.5">
                          <button type="button" onClick={() => preview(row.id)} className="text-xs font-medium text-emerald-700">{opening === row.id ? "Opening…" : "Preview"}</button>
                          {wa ? <a href={wa} target="_blank" rel="noreferrer" className="text-xs font-medium text-emerald-700">WhatsApp</a> : <span className="text-xs text-slate-300">No phone</span>}
                          {open ? <button type="button" onClick={() => markReturned(row.id)} className="text-xs font-medium text-slate-500">Return</button> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Fleet</h2>
          <Link href="/rental/fleet" className="text-xs font-medium text-emerald-700">Manage fleet</Link>
        </div>
        {!data || data.fleet.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No cars in the fleet yet.</p>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.fleet.map((car) => (
              <div key={car.id} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{car.name}</p>
                    <p className="text-xs text-slate-400">{car.registration_number || "No registration"}{car.color ? ` · ${car.color}` : ""}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS[car.status] || STATUS.completed}`}>{car.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{money(car.daily_rate)} / day</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
