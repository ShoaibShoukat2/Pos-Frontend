"use client";

import { useEffect, useState } from "react";

import { EmptyState, Notice, StatusPill } from "@/components/hostel/bits";
import { api } from "@/lib/api";
import { errText, pageOf } from "@/lib/hostel";

export default function StaysPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("checked_in");

  function load() {
    api(`/api/hostel/reservations/?status=${mode}&page_size=50`).then((data) => setRows(pageOf<any>(data).results)).catch((err) => setError(errText(err)));
  }
  useEffect(() => { load(); }, [mode]);

  async function run(id: string, action: "check-in" | "check-out") {
    setError("");
    try {
      await api(`/api/hostel/reservations/${id}/${action}/`, { method: "POST", body: "{}" });
      setMessage(action === "check-in" ? "Guest checked in. The seat is occupied." : "Guest checked out. The seat is free.");
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-slate-900">Check-in / check-out</h1>
      <div className="flex gap-2">
        {["pending", "confirmed", "checked_in", "completed"].map((item) => (
          <button key={item} className={`btn ${mode === item ? "btn-primary" : "btn-ghost"}`} onClick={() => setMode(item)}>{item.replaceAll("_", " ")}</button>
        ))}
      </div>
      <Notice text={message} />
      <Notice tone="bad" text={error} />
      {rows.length === 0 ? <EmptyState title="Nothing in this list" text="Confirmed bookings can be checked in. Checked-in guests can leave." /> : rows.map((row) => (
        <article key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
          <div>
            <p className="font-semibold">{row.customer_name}</p>
            <p className="text-sm text-slate-500">{row.branch_name} · room {row.room_number} · seat {row.seat}</p>
            <p className="text-xs text-slate-400">{row.check_in_date} to {row.expected_checkout}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill value={row.status} />
            {row.status === "confirmed" || row.status === "pending" ? <button className="btn btn-primary" onClick={() => run(row.id, "check-in")}>Check in</button> : null}
            {row.status === "checked_in" ? <button className="btn btn-ghost" onClick={() => run(row.id, "check-out")}>Check out</button> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
