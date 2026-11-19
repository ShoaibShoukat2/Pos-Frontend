"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

import { EmptyState, Modal, Notice, SeatDot, UploadField } from "@/components/hostel/bits";
import { useHostel } from "@/components/hostel/session";
import { api } from "@/lib/api";
import { can, errText, pkr, listOf } from "@/lib/hostel";

type Bed = { id: string; code: string; status: string };
type Room = {
  id: string; branch: string; branch_name: string; number: string; floor: number; room_type: string;
  capacity: number; monthly_rent: string; security_deposit: string; attached_bathroom: boolean;
  ac: boolean; wifi: boolean; facilities: string; status: string; beds: Bed[];
  occupied_beds: number; available_beds: number;
};
type Branch = { id: string; name: string };

const blank = { branch: "", number: "", floor: "1", room_type: "double", capacity: "2", monthly_rent: "", security_deposit: "", facilities: "", attached_bathroom: false, ac: false, wifi: true, image: "", status: "active" };

function RoomsBody() {
  const params = useSearchParams();
  const { session } = useHostel();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branch, setBranch] = useState(params.get("branch") || session?.branch_id || "");
  const [floor, setFloor] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api("/api/hostel/branches/").then((data) => setBranches(listOf(data))).catch(() => undefined);
  }, []);

  function load(nextBranch = branch, nextFloor = floor) {
    const query = new URLSearchParams();
    if (nextBranch) query.set("branch", nextBranch);
    if (nextFloor) query.set("floor", nextFloor);
    api(`/api/hostel/rooms/?${query.toString()}`).then((data) => setRooms(listOf(data))).catch((err) => setError(errText(err)));
  }
  useEffect(() => { load(); }, [branch, floor]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/hostel/rooms/", { method: "POST", body: JSON.stringify({ ...form, floor: Number(form.floor), capacity: Number(form.capacity || 1), monthly_rent: form.monthly_rent || "0", security_deposit: form.security_deposit || "0" }) });
      setOpen(false);
      setMessage("Room and seats created.");
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-slate-900">Rooms</h1>
          <p className="text-sm text-slate-500">Green is free, red is occupied, orange is reserved, gray is maintenance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="field" value={branch} onChange={(event) => setBranch(event.target.value)}>
            <option value="">All branches</option>
            {branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input className="field w-24" placeholder="Floor" value={floor} onChange={(event) => setFloor(event.target.value)} />
          {can(session, "rooms.manage") ? <button className="btn btn-primary" onClick={() => { setForm({ ...blank, branch: branch || branches[0]?.id || "" }); setOpen(true); }}>Add room</button> : null}
        </div>
      </div>
      <Notice text={message} />
      <Notice tone="bad" text={error} />
      {rooms.length === 0 ? <EmptyState title="No rooms on this floor" text="Add a room and the seats are created with it." /> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <Link key={room.id} href={`/hostel/rooms/${room.id}`} className="rounded-2xl border border-royal-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-royal-700">{room.branch_name} · Floor {room.floor}</p>
                  <h2 className="font-display text-2xl text-slate-900">Room {room.number}</h2>
                </div>
                <p className="text-xs text-slate-500">{room.available_beds} free / {room.beds.length}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {room.beds.map((bed) => <SeatDot key={bed.id} status={bed.status} label={bed.code} />)}
              </div>
              <p className="mt-3 text-xs text-slate-500">{room.room_type.replaceAll("_", " ")} · {pkr(room.monthly_rent)} / seat {room.ac ? "· AC" : ""} {room.wifi ? "· Wi-Fi" : ""}</p>
            </Link>
          ))}
        </div>
      )}
      {open ? (
        <Modal title="New room" onClose={() => setOpen(false)}>
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium uppercase text-slate-500">Branch<select className="field mt-1 w-full normal-case" value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} required>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="text-xs font-medium uppercase text-slate-500">Room number<input className="field mt-1 w-full normal-case" value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} required /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Floor<input className="field mt-1 w-full normal-case" value={form.floor} onChange={(event) => setForm({ ...form, floor: event.target.value })} /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Type<select className="field mt-1 w-full normal-case" value={form.room_type} onChange={(event) => setForm({ ...form, room_type: event.target.value })}><option value="single">Single sharing</option><option value="double">Double sharing</option><option value="triple">Triple sharing</option><option value="four">Four sharing</option><option value="six">Six sharing</option><option value="custom">Custom capacity</option></select></label>
            {form.room_type === "custom" ? <label className="text-xs font-medium uppercase text-slate-500">Capacity<input className="field mt-1 w-full normal-case" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} /></label> : null}
            <label className="text-xs font-medium uppercase text-slate-500">Rent per bed<input className="field mt-1 w-full normal-case" value={form.monthly_rent} onChange={(event) => setForm({ ...form, monthly_rent: event.target.value })} /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Deposit<input className="field mt-1 w-full normal-case" value={form.security_deposit} onChange={(event) => setForm({ ...form, security_deposit: event.target.value })} /></label>
            <label className="sm:col-span-2 text-xs font-medium uppercase text-slate-500">Facilities<input className="field mt-1 w-full normal-case" value={form.facilities} onChange={(event) => setForm({ ...form, facilities: event.target.value })} /></label>
            <label className="flex items-center gap-2 text-sm normal-case text-slate-700"><input type="checkbox" checked={form.attached_bathroom} onChange={(event) => setForm({ ...form, attached_bathroom: event.target.checked })} /> Attached bathroom</label>
            <label className="flex items-center gap-2 text-sm normal-case text-slate-700"><input type="checkbox" checked={form.ac} onChange={(event) => setForm({ ...form, ac: event.target.checked })} /> AC</label>
            <label className="flex items-center gap-2 text-sm normal-case text-slate-700"><input type="checkbox" checked={form.wifi} onChange={(event) => setForm({ ...form, wifi: event.target.checked })} /> Wi-Fi</label>
            <div className="sm:col-span-2"><UploadField label="Room image" onPick={(image) => setForm({ ...form, image })} /></div>
            <button className="btn btn-primary sm:col-span-2" type="submit">Create room</button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

export default function RoomsPage() {
  return <Suspense fallback={<p className="text-sm text-slate-400">Loading rooms…</p>}><RoomsBody /></Suspense>;
}
