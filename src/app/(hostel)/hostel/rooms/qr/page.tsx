"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { QrImage } from "@/components/QrImage";
import { EmptyState, Notice } from "@/components/hostel/bits";
import { useHostel } from "@/components/hostel/session";
import { api } from "@/lib/api";
import { can, errText, listOf, printRoomQr, roomScanUrl } from "@/lib/hostel";

type Room = { id: string; number: string; floor: number; branch_name: string };

function QrSheet() {
  const params = useSearchParams();
  const { session, loading } = useHostel();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState("");
  const branch = params.get("branch") || "";
  const floor = params.get("floor") || "";
  const onlyRoom = params.get("room") || "";

  useEffect(() => {
    const query = new URLSearchParams();
    if (branch) query.set("branch", branch);
    if (floor) query.set("floor", floor);
    api(`/api/hostel/rooms/?${query.toString()}`)
      .then((data) => {
        const rows = listOf<Room>(data);
        setRooms(onlyRoom ? rows.filter((room) => room.id === onlyRoom) : rows);
      })
      .catch((err) => setError(errText(err)));
  }, [branch, floor, onlyRoom]);

  const allowed = can(session, "rooms.manage");
  if (loading) return <p className="text-sm text-slate-400">Preparing QR codes…</p>;

  return (
    <div className="space-y-4">
      <div className="no-qr-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/hostel/rooms" className="text-xs font-semibold uppercase tracking-wide text-royal-700">Rooms</Link>
          <h1 className="font-display text-3xl text-slate-900">Room QR codes</h1>
          <p className="text-sm text-slate-500">Stick one code on each door. The room number is printed under the code. A phone scan opens that room, its seats, and who is staying.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={printRoomQr} disabled={!rooms.length}>Print all</button>
      </div>
      <Notice tone="bad" text={error} />
      {!allowed ? <p className="text-sm text-slate-500">Only a branch manager can print these codes.</p> : null}
      {allowed && rooms.length === 0 ? <EmptyState title="No rooms to print" text="Add rooms first, then print one sheet for the whole branch." /> : null}
      {allowed ? (
        <div id="room-qr-print" className="room-qr-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <article key={room.id} className="room-qr-card rounded-2xl border border-royal-100 bg-white p-4 text-center shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-royal-700">{session?.hostel_name || room.branch_name}</p>
              <div className="mt-2">
                <QrImage value={roomScanUrl(room.id)} alt={`QR code for room ${room.number}`} size={220} />
              </div>
              <p className="mt-2 font-display text-3xl text-slate-900">Room {room.number}</p>
              <p className="text-sm text-slate-500">{room.branch_name} · Floor {room.floor}</p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function RoomQrPage() {
  return <Suspense fallback={<p className="text-sm text-slate-400">Preparing QR codes…</p>}><QrSheet /></Suspense>;
}
