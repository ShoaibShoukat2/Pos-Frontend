"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { QrImage } from "@/components/QrImage";
import { Notice, StatusPill } from "@/components/hostel/bits";
import { RoomSheet } from "@/components/hostel/RoomSheet";
import { useHostel } from "@/components/hostel/session";
import { api } from "@/lib/api";
import { can, errText, listOf, printRoomQr, printRoomSheet, roomScanUrl } from "@/lib/hostel";

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
    if (session?.role === "owner" || session?.role === "manager") {
      api(`/api/hostel/reservations/?room=${params.id}&page_size=100`).then((data) => setPayments(listOf(data))).catch(() => undefined);
    }
  }
  useEffect(() => { load(); }, [params.id, session?.role]);

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
      <div className="no-sheet-print no-qr-print flex flex-wrap items-center justify-between gap-2">
        <Link href="/hostel/rooms" className="text-xs font-semibold uppercase tracking-wide text-royal-700">All rooms</Link>
        <button type="button" className="btn btn-primary" onClick={printRoomSheet}>Print room sheet</button>
      </div>
      <div className="no-sheet-print no-qr-print space-y-4">
        <Notice text={message} />
        <Notice tone="bad" text={error} />
      </div>
      <RoomSheet room={room} hostelName={session?.hostel_name} session={session} onFurnishing={setFurnishing} />
      {can(session, "rooms.manage") ? (
        <div className="no-sheet-print grid gap-4 lg:grid-cols-[minmax(0,16rem)_1fr]">
          <div id="room-qr-print" className="room-qr-card rounded-2xl border border-royal-100 bg-white p-4 text-center shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-royal-700">{session?.hostel_name || room.branch_name}</p>
            <div className="mt-2"><QrImage value={roomScanUrl(room.id)} alt={`QR code for room ${room.number}`} size={220} /></div>
            <p className="mt-2 font-display text-3xl text-slate-900">Room {room.number}</p>
            <p className="text-sm text-slate-500">{room.branch_name} · Floor {room.floor}</p>
            <div className="no-qr-print mt-3 flex flex-wrap justify-center gap-2">
              <button className="btn btn-ghost" type="button" onClick={printRoomQr}>Print this QR</button>
              <Link className="btn btn-ghost" href={`/hostel/rooms/qr?branch=${room.branch}`}>Print all</Link>
            </div>
          </div>
          <div className="no-qr-print rounded-2xl border border-royal-100 bg-white p-5 shadow-card">
            <h2 className="font-semibold text-slate-900">Update this room</h2>
            <div className="mt-4 grid gap-4">
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
          </div>
        </div>
      ) : null}
      {session?.role === "employee" ? null : <div className="no-sheet-print no-qr-print rounded-2xl border border-royal-100 bg-white p-5 shadow-card">
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
      </div>}
    </div>
  );
}
