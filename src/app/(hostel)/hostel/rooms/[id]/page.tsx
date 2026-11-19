"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { SeatDot, StatusPill } from "@/components/hostel/bits";
import { api, asList } from "@/lib/api";
import { errText, pkr } from "@/lib/hostel";

export default function RoomDetailPage() {
  const params = useParams<{ id: string }>();
  const [room, setRoom] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/hostel/rooms/${params.id}/`).then(setRoom).catch((err) => setError(errText(err)));
    api(`/api/hostel/reservations/?room=${params.id}&page_size=100`).then((data) => setPayments(asList(data))).catch(() => undefined);
  }, [params.id]);

  const stays = payments.filter((row) => row.room === params.id);
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!room) return <p className="text-sm text-slate-400">Loading room…</p>;
  return (
    <div className="space-y-4">
      <Link href="/hostel/rooms" className="text-xs font-semibold uppercase tracking-wide text-royal-700">All rooms</Link>
      <div className="rounded-2xl border border-royal-100 bg-white p-5 shadow-card">
        <p className="text-xs uppercase tracking-wide text-royal-700">{room.branch_name} · Floor {room.floor}</p>
        <h1 className="font-display text-3xl text-slate-900">Room {room.number}</h1>
        <p className="mt-1 text-sm text-slate-500">{room.room_type} · {pkr(room.monthly_rent)} per bed · deposit {pkr(room.security_deposit)} · {room.available_beds} seats free</p>
        <p className="mt-2 text-sm text-slate-600">{[room.attached_bathroom ? "Attached bathroom" : "Shared bathroom", room.ac ? "AC" : "Non-AC", room.wifi ? "Wi-Fi" : "No Wi-Fi", room.facilities].filter(Boolean).join(" · ")}</p>
        {room.image ? <img src={room.image} alt="" className="mt-4 h-40 w-full rounded-xl object-cover" /> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {room.beds.map((bed: any) => (
            <div key={bed.id} className="rounded-xl border border-slate-100 px-3 py-2">
              <SeatDot status={bed.status} label={bed.code} />
              <p className="mt-1 text-xs text-slate-500">{bed.occupant ? bed.occupant.name : bed.status}</p>
            </div>
          ))}
        </div>
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
