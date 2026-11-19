"use client";

import { FormEvent, useEffect, useState } from "react";

import { EmptyState, Notice, StatusPill } from "@/components/hostel/bits";
import { useHostel } from "@/components/hostel/session";
import { api, asPage } from "@/lib/api";
import { errText, monthName, pkr } from "@/lib/hostel";

export default function MonthlyPaymentsPage() {
  const { session } = useHostel();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [adjust, setAdjust] = useState<any>(null);

  function load() {
    const query = new URLSearchParams({ year, month, page_size: "100" });
    if (status) query.set("status", status);
    api(`/api/hostel/monthly/?${query.toString()}`).then((data) => setRows(asPage<any>(data).results)).catch((err) => setError(errText(err)));
  }
  useEffect(() => { load(); }, [year, month, status]);

  async function generate() {
    setError("");
    try {
      const result = await api<{ created: number }>("/api/hostel/billing/generate/", { method: "POST", body: JSON.stringify({ year: Number(year), month: Number(month), branch: session?.branch_id }) });
      setMessage(`Bills ready. ${result.created} new invoices.`);
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function lateFees() {
    try {
      const result = await api<{ updated: number }>("/api/hostel/billing/late-fees/", { method: "POST", body: "{}" });
      setMessage(`Late fee added to ${result.updated} overdue bills.`);
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function saveAdjust(event: FormEvent) {
    event.preventDefault();
    try {
      await api(`/api/hostel/monthly/${adjust.id}/adjust/`, { method: "POST", body: JSON.stringify({ late_fee: adjust.late_fee, discount: adjust.discount, extra_charges: adjust.extra_charges }) });
      setAdjust(null);
      setMessage("Bill updated.");
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-slate-900">Monthly payments</h1>
          <p className="text-sm text-slate-500">{monthName(Number(month))} {year}. Generate rent for every active guest.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="field w-24" value={year} onChange={(event) => setYear(event.target.value)} />
          <select className="field" value={month} onChange={(event) => setMonth(event.target.value)}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{monthName(index + 1)}</option>)}</select>
          <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="partial">Partially paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
          </select>
          <button className="btn btn-primary" onClick={generate}>Generate bills</button>
          {session?.role !== "employee" ? <button className="btn btn-ghost" onClick={lateFees}>Add late fees</button> : null}
        </div>
      </div>
      <Notice text={message} />
      <Notice tone="bad" text={error} />
      {rows.length === 0 ? <EmptyState title="No bills for this month" text="Generate monthly rent for active customers." /> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between"><div><p className="font-semibold">{row.customer_name}</p><p className="text-xs text-slate-400">{row.branch_name} · {row.room_number || "—"} / {row.seat || "—"}</p></div><StatusPill value={row.status} /></div>
              <p className="mt-3 font-display text-2xl">{pkr(row.balance)}</p>
              <p className="text-xs text-slate-500">Due {pkr(row.amount_due)} · paid {pkr(row.amount_paid)} · due {row.due_date}</p>
              <p className="text-xs text-slate-400">Rent {pkr(row.rent_amount)} · late {pkr(row.late_fee)} · extra {pkr(row.extra_charges)} · off {pkr(row.discount)}</p>
              {session?.role !== "employee" ? <button className="btn btn-ghost mt-3" onClick={() => setAdjust(row)}>Adjust</button> : null}
            </article>
          ))}
        </div>
      )}
      {adjust ? (
        <form onSubmit={saveAdjust} className="grid max-w-lg gap-2 rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
          <p className="font-semibold">Adjust {adjust.customer_name}</p>
          <input className="field" value={adjust.late_fee} onChange={(event) => setAdjust({ ...adjust, late_fee: event.target.value })} />
          <input className="field" value={adjust.discount} onChange={(event) => setAdjust({ ...adjust, discount: event.target.value })} />
          <input className="field" value={adjust.extra_charges} onChange={(event) => setAdjust({ ...adjust, extra_charges: event.target.value })} />
          <div className="flex gap-2"><button className="btn btn-primary" type="submit">Save bill</button><button type="button" className="btn btn-ghost" onClick={() => setAdjust(null)}>Cancel</button></div>
        </form>
      ) : null}
    </div>
  );
}
