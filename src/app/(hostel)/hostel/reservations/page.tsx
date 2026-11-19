"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { EmptyState, Notice, StatusPill, UploadField } from "@/components/hostel/bits";
import { api } from "@/lib/api";
import { errText, pkr, waLink, listOf, pageOf } from "@/lib/hostel";
import { useHostel } from "@/components/hostel/session";

export default function ReservationsPage() {
  const { session } = useHostel();
  const [rows, setRows] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ customer: "", branch: "", room: "", bed: "", reservation_date: "", check_in_date: "", expected_checkout: "", monthly_rent: "", security_deposit: "", advance_payment: "", instructions: "", file_data: "", status: "confirmed" });

  function load() {
    const query = new URLSearchParams({ page: String(page), page_size: "25" });
    if (status) query.set("status", status);
    api(`/api/hostel/reservations/?${query.toString()}`).then((data) => { const list = pageOf<any>(data); setRows(list.results); setCount(list.count); }).catch((err) => setError(errText(err)));
  }
  useEffect(() => { load(); }, [page, status]);
  useEffect(() => {
    api("/api/hostel/customers/?page_size=100").then((data) => setCustomers(pageOf<any>(data).results)).catch(() => undefined);
    api("/api/hostel/branches/").then((data) => setBranches(listOf(data))).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!form.branch) return;
    api(`/api/hostel/rooms/?branch=${form.branch}`).then((data) => setRooms(listOf(data))).catch(() => undefined);
  }, [form.branch]);
  useEffect(() => {
    if (!form.branch || !form.check_in_date || !form.expected_checkout) return;
    const query = new URLSearchParams({ branch: form.branch, check_in: form.check_in_date, check_out: form.expected_checkout });
    if (form.room) query.set("room", form.room);
    api(`/api/hostel/beds/open/?${query.toString()}`).then((data) => setBeds(listOf(data))).catch(() => setBeds([]));
  }, [form.branch, form.room, form.check_in_date, form.expected_checkout]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const documents = form.file_data ? [{ title: "Reservation document", file_data: form.file_data }] : [];
      await api("/api/hostel/reservations/", { method: "POST", body: JSON.stringify({ ...form, documents, monthly_rent: form.monthly_rent || "0", security_deposit: form.security_deposit || "0", advance_payment: form.advance_payment || "0" }) });
      setMessage("Reservation saved. The seat is held for those dates.");
      setForm({ ...form, bed: "", instructions: "", file_data: "" });
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function act(id: string, action: "confirm" | "cancel") {
    try {
      await api(`/api/hostel/reservations/${id}/${action}/`, { method: "POST", body: "{}" });
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        <h1 className="font-display text-3xl text-slate-900">Reservations</h1>
        <select className="field" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
          <option value="">All statuses</option>
          {["pending", "confirmed", "checked_in", "cancelled", "completed"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
        </select>
        <Notice text={message} />
        <Notice tone="bad" text={error} />
        {rows.length === 0 ? <EmptyState title="No reservations" text="Book a free seat for a customer." /> : rows.map((row) => (
          <article key={row.id} className="rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-royal-700">{row.number} · {row.branch_name}</p>
                <p className="font-semibold text-slate-900">{row.customer_name}</p>
                <p className="text-sm text-slate-500">Room {row.room_number} · seat {row.seat} · {row.check_in_date} to {row.expected_checkout}</p>
                <p className="text-xs text-slate-400">Rent {pkr(row.monthly_rent)} · advance {pkr(row.advance_payment)}</p>
              </div>
              <StatusPill value={row.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {row.status === "pending" ? <button className="btn btn-ghost" onClick={() => act(row.id, "confirm")}>Confirm</button> : null}
              {row.status === "pending" || row.status === "confirmed" ? <button className="btn btn-ghost" onClick={() => act(row.id, "cancel")}>Cancel</button> : null}
              <Link className="btn btn-ghost" href={`/hostel/customers/${row.customer}`}>Customer</Link>
              <a className="btn btn-ghost" target="_blank" rel="noreferrer" href={waLink(row.customer_phone, `RESERVATION\n${session?.hostel_name}\n${row.customer_name}\nRoom ${row.room_number} seat ${row.seat}\n${row.check_in_date} to ${row.expected_checkout}\nStatus: ${row.status}`)}>WhatsApp</a>
            </div>
          </article>
        ))}
        <p className="text-xs text-slate-400">{count} reservations</p>
      </div>
      <form onSubmit={onSubmit} className="h-fit space-y-2 rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
        <h2 className="font-semibold">New reservation</h2>
        <select className="field w-full" value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} required><option value="">Customer</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</select>
        <select className="field w-full" value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} required><option value="">Branch</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select className="field w-full" value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })}><option value="">Any room</option>{rooms.map((item) => <option key={item.id} value={item.id}>Floor {item.floor} · {item.number}</option>)}</select>
        <input type="date" className="field w-full" value={form.reservation_date} onChange={(event) => setForm({ ...form, reservation_date: event.target.value })} required />
        <input type="date" className="field w-full" value={form.check_in_date} onChange={(event) => setForm({ ...form, check_in_date: event.target.value })} required />
        <input type="date" className="field w-full" value={form.expected_checkout} onChange={(event) => setForm({ ...form, expected_checkout: event.target.value })} required />
        <select className="field w-full" value={form.bed} onChange={(event) => setForm({ ...form, bed: event.target.value })} required><option value="">Free seat</option>{beds.map((bed) => <option key={bed.id} value={bed.id}>Room {bed.room_number} · {bed.code}</option>)}</select>
        <input className="field w-full" placeholder="Monthly rent" value={form.monthly_rent} onChange={(event) => setForm({ ...form, monthly_rent: event.target.value })} />
        <input className="field w-full" placeholder="Security deposit" value={form.security_deposit} onChange={(event) => setForm({ ...form, security_deposit: event.target.value })} />
        <input className="field w-full" placeholder="Advance payment" value={form.advance_payment} onChange={(event) => setForm({ ...form, advance_payment: event.target.value })} />
        <select className="field w-full" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="confirmed">Confirmed</option><option value="pending">Pending</option></select>
        <textarea className="field w-full" placeholder="Instructions" value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} />
        <UploadField allowPdf label="Document" onPick={(file_data) => setForm({ ...form, file_data })} />
        <button className="btn btn-primary w-full" type="submit">Book seat</button>
      </form>
    </div>
  );
}
