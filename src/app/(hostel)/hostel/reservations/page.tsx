"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState, Notice, StatusPill } from "@/components/hostel/bits";
import { useHostel } from "@/components/hostel/session";
import { api } from "@/lib/api";
import { errText, pkr, waLink, pageOf } from "@/lib/hostel";

export default function ReservationsPage() {
  const { session } = useHostel();
  const [rows, setRows] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  function load() {
    const query = new URLSearchParams({ page: String(page), page_size: "25" });
    if (status) query.set("status", status);
    api(`/api/hostel/reservations/?${query.toString()}`).then((data) => { const list = pageOf<any>(data); setRows(list.results); setCount(list.count); }).catch((err) => setError(errText(err)));
  }
  useEffect(() => { load(); }, [page, status]);

  async function act(id: string, action: "confirm" | "cancel") {
    try {
      await api(`/api/hostel/reservations/${id}/${action}/`, { method: "POST", body: "{}" });
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-slate-900">Reservations</h1>
          <p className="text-sm text-slate-500">New customers and seats are taken on one admission page.</p>
        </div>
        <Link href="/hostel/customers/new" className="btn btn-primary w-full sm:w-auto">New admission</Link>
      </div>
      <select className="field w-full sm:w-auto" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Seat booked</option>
        <option value="checked_in">Living here</option>
        <option value="cancelled">Cancelled</option>
        <option value="completed">Left</option>
      </select>
      <Notice tone="bad" text={error} />
      {rows.length === 0 ? <EmptyState title="No reservations" text="Add a customer and choose their room seat." /> : rows.map((row) => (
        <article key={row.id} className="rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-royal-700">{row.number} · {row.branch_name}</p>
              <p className="font-semibold text-slate-900">{row.customer_name}</p>
              <p className="text-sm text-slate-500">Room {row.room_number} · seat {row.seat}</p>
              <p className="text-xs text-slate-400">{row.check_in_date} to {row.expected_checkout} · {pkr(row.monthly_rent)}</p>
            </div>
            <StatusPill value={row.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {row.status === "pending" ? <button className="btn btn-ghost" onClick={() => act(row.id, "confirm")}>Confirm</button> : null}
            {row.status === "pending" || row.status === "confirmed" ? <button className="btn btn-ghost" onClick={() => act(row.id, "cancel")}>Cancel</button> : null}
            <Link className="btn btn-ghost" href={`/hostel/customers/${row.customer}`}>Change room</Link>
            <a className="btn btn-ghost" target="_blank" rel="noreferrer" href={waLink(row.customer_phone, `RESERVATION\n${session?.hostel_name}\n${row.customer_name}\nRoom ${row.room_number} seat ${row.seat}\n${row.check_in_date} to ${row.expected_checkout}\nStatus: ${row.status}`)}>WhatsApp</a>
          </div>
        </article>
      ))}
      <div className="flex items-center justify-between text-sm">
        <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
        <span className="text-slate-400">{count} reservations</span>
        <button className="btn btn-ghost" disabled={page * 25 >= count} onClick={() => setPage((value) => value + 1)}>Next</button>
      </div>
    </div>
  );
}
