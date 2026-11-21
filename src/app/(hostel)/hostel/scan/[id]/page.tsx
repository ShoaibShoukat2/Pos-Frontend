"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { RoomSheet } from "@/components/hostel/RoomSheet";
import { useHostel } from "@/components/hostel/session";
import { ApiError, api } from "@/lib/api";
import { errText, printRoomSheet } from "@/lib/hostel";

export default function RoomScanPage() {
  const params = useParams<{ id: string }>();
  const { session } = useHostel();
  const [room, setRoom] = useState<any>(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setRoom(null);
    setLocked(false);
    setError("");
    api(`/api/hostel/rooms/${params.id}/sheet/`)
      .then((data) => { if (alive) setRoom(data); })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
          setLocked(true);
          return;
        }
        setError(errText(err));
      });
    return () => { alive = false; };
  }, [params.id]);

  if (locked) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-royal-700">{session?.hostel_name || "Hostel"}</p>
        <h1 className="mt-2 font-display text-3xl text-slate-900">Room details are private</h1>
        <p className="mt-3 text-sm text-slate-600">Only this branch&apos;s manager can open a scanned room. Guest names, phones, CNIC and photos stay hidden for everyone else.</p>
        <Link href="/hostel" className="btn btn-primary mt-6 inline-flex">Back to dashboard</Link>
      </div>
    );
  }
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!room) return <p className="text-sm text-slate-400">Opening room…</p>;
  return (
    <div className="space-y-4">
      <div className="no-sheet-print flex flex-wrap items-center justify-between gap-2">
        <Link href="/hostel" className="text-xs font-semibold uppercase tracking-wide text-royal-700">Dashboard</Link>
        <button type="button" className="btn btn-primary" onClick={printRoomSheet}>Print room sheet</button>
      </div>
      <RoomSheet room={room} hostelName={session?.hostel_name} session={session} />
    </div>
  );
}
