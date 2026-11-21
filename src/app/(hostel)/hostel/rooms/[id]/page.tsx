"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Notice, SeatDot, StatusPill } from "@/components/hostel/bits";
import { useHostel } from "@/components/hostel/session";
import { api } from "@/lib/api";
import { can, errText, listOf, pkr, seatKind, seatMix } from "@/lib/hostel";

export default function RoomDetailPage() {
  const params = useParams<{ id: string }>();
  const { session } = useHostel();
  const [room, setRoom] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [addForm, setAddForm] = useState({ count: "1", furnishing: "bed", price: "" });

  function load() {
    api(`/api/hostel/rooms/${params.id}/`).then(setRoom).catch((err) => setError(errText(err)));
    api(`/api/hostel/reservations/?room=${params.id}&page_size=100`).then((data) => setPayments(listOf(data))).catch(() => undefined);
  }
  useEffect(() => { load(); }, [params.id]);

  async function savePrices(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(`/api/hostel/rooms/${params.id}/`, { method: "PATCH", body: JSON.stringify({ monthly_rent: room.monthly_rent || "0", mattress_rent: room.mattress_rent || "0" }) });
      setMessage("Seat prices saved.");
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function addSeats(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(`/api/hostel/rooms/${params.id}/seats/`, { method: "POST", body: JSON.stringify({ count: Number(addForm.count || 1), furnishing: addForm.furnishing, monthly_rent: addForm.price || undefined }) });
      setMessage("Seats added.");
      setAddForm({ count: "1", furnishing: "bed", price: "" });
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function setFurnishing(bedId: string, furnishing: string) {
    setError("");
    try {
      await api(`/api/hostel/beds/${bedId}/furnishing/`, { method: "POST", body: JSON.stringify({ furnishing }) });
      setMessage(`Seat is now a ${seatKind(furnishing).toLowerCase()}.`);
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  const stays = payments.filter((row) => row.room === params.id);
  if (!room && error) return <p className="text-sm text-red-600">{error}</p>;
  if (!room) return <p className="text-sm text-slate-400">Loading room…</p>;
  return (
    <div className="space-y-4">
      <Link href="/hostel/rooms" className="text-xs font-semibold uppercase tracking-wide text-royal-700">All rooms</Link>
      <Notice text={message} />
      <Notice tone="bad" text={error} />
      <div className="rounded-2xl border border-royal-100 bg-white p-5 shadow-card">
        <p className="text-xs uppercase tracking-wide text-royal-700">{room.branch_name} · Floor {room.floor}</p>
        <h1 className="font-display text-3xl text-slate-900">Room {room.number}</h1>
        <p className="mt-1 text-sm text-slate-500">Available {room.available_beds} · Not available {room.beds.length - room.available_beds} · Total seats {room.beds.length}</p>
        <p className="mt-1 text-sm text-slate-600">{seatMix(room)}</p>
        <p className="mt-2 text-sm text-slate-600">{[room.attached_bathroom ? "Attached bathroom" : "Shared bathroom", room.ac ? "AC" : "Non-AC", room.wifi ? "Wi-Fi" : "No Wi-Fi", room.facilities].filter(Boolean).join(" · ")}</p>
        {room.image ? <img src={room.image} alt="" className="mt-4 h-40 w-full rounded-xl object-cover" /> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {room.beds.map((bed: any) => (
            <div key={bed.id} className="rounded-xl border border-slate-100 px-3 py-2">
              <SeatDot status={bed.status} label={bed.code} />
              <p className="mt-1 text-xs text-slate-500">{bed.occupant ? bed.occupant.name : "Available"} · {seatKind(bed.furnishing)} · {pkr(bed.monthly_rent)}</p>
              {!bed.occupant && can(session, "seats.manage") ? (
                <select className="field mt-2" value={bed.furnishing || "bed"} onChange={(event) => setFurnishing(bed.id, event.target.value)}>
                  <option value="bed">Bed</option>
                  <option value="mattress">Mattress</option>
                </select>
              ) : null}
            </div>
          ))}
        </div>
        {can(session, "rooms.manage") ? (
          <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 lg:grid-cols-2">
            <form onSubmit={savePrices} className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-medium uppercase text-slate-500">Bed rent<input className="field mt-1 w-full normal-case" value={room.monthly_rent || ""} onChange={(event) => setRoom({ ...room, monthly_rent: event.target.value })} /></label>
              <label className="text-xs font-medium uppercase text-slate-500">Mattress rent<input className="field mt-1 w-full normal-case" value={room.mattress_rent || ""} onChange={(event) => setRoom({ ...room, mattress_rent: event.target.value })} /></label>
              <button className="btn btn-ghost sm:col-span-2" type="submit">Save prices</button>
            </form>
            <form onSubmit={addSeats} className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-medium uppercase text-slate-500">Add seats<input type="number" min={1} className="field mt-1 w-full normal-case" value={addForm.count} onChange={(event) => setAddForm({ ...addForm, count: event.target.value })} /></label>
              <label className="text-xs font-medium uppercase text-slate-500">Type<select className="field mt-1 w-full normal-case" value={addForm.furnishing} onChange={(event) => setAddForm({ ...addForm, furnishing: event.target.value })}><option value="bed">Bed</option><option value="mattress">Mattress</option></select></label>
              <button className="btn btn-primary sm:col-span-2" type="submit">Add seats</button>
            </form>
          </div>
        ) : null}
      </div>
      <div className="rounded-2xl border border-royal-100 bg-white p-5 shadow-card">
        <h2 className="font-semibold text-slate-900">Reservations</h2>
        {stays.length === 0 ? <p className="mt-2 text-sm text-slate-400">No reservations loaded for this room.</p> : stays.map((row) => (
          <div key={row.id} className="mt-3 flex items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium">{row.customer_name} · seat {row.seat}</p>
              <p className="text-xs text-slate-400">{row.check_in_date} to {row.expected_checkout}</p>
            </div>
            <StatusPill value={row.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
