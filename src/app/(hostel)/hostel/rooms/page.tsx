"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

import { EmptyState, Modal, Notice, SeatDot, UploadField } from "@/components/hostel/bits";
import { useHostel } from "@/components/hostel/session";
import { api } from "@/lib/api";
import { can, errText, pkr, seatKind, seatMix, listOf } from "@/lib/hostel";

type Bed = { id: string; code: string; status: string; furnishing?: string; monthly_rent?: string; occupant?: { id: string; name: string; notice_leave_on?: string | null } | null };
type Room = {
  id: string; branch: string; branch_name: string; number: string; floor: number; room_type: string;
  capacity: number; monthly_rent: string; mattress_rent?: string; security_deposit: string; attached_bathroom: boolean;
  ac: boolean; wifi: boolean; facilities: string; status: string; beds: Bed[];
  occupied_beds: number; available_beds: number; bed_count?: number; mattress_count?: number;
};
type Branch = { id: string; name: string };

const TYPE_SEATS: Record<string, number> = { single: 1, double: 2, triple: 3, four: 4, six: 6 };
const blank = { branch: "", number: "", floor: "1", room_type: "double", bed_seats: "2", mattress_seats: "0", monthly_rent: "", mattress_rent: "", security_deposit: "", facilities: "", attached_bathroom: false, ac: false, wifi: true, image: "", status: "active" };

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
  const [shift, setShift] = useState<{ customerId: string; name: string; from: string } | null>(null);
  const [nextBed, setNextBed] = useState("");
  const [seatRoom, setSeatRoom] = useState<Room | null>(null);
  const [addForm, setAddForm] = useState({ count: "1", furnishing: "bed", price: "" });

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

  const freeSeats = rooms.flatMap((room) => room.beds.filter((bed) => bed.status === "available").map((bed) => ({ ...bed, roomNumber: room.number })));

  async function shiftMember(event: FormEvent) {
    event.preventDefault();
    if (!shift) return;
    setError("");
    try {
      await api(`/api/hostel/customers/${shift.customerId}/change-room/`, { method: "POST", body: JSON.stringify({ bed: nextBed }) });
      setMessage(`${shift.name} shifted.`);
      setShift(null);
      setNextBed("");
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const bedSeats = Number(form.bed_seats || 0);
      const mattressSeats = Number(form.mattress_seats || 0);
      await api("/api/hostel/rooms/", { method: "POST", body: JSON.stringify({ ...form, branch: form.branch || session?.branch_id || "", floor: Number(form.floor), bed_seats: bedSeats, mattress_seats: mattressSeats, capacity: bedSeats + mattressSeats, monthly_rent: form.monthly_rent || "0", mattress_rent: form.mattress_rent || "0", security_deposit: form.security_deposit || "0" }) });
      setOpen(false);
      setMessage("Room and seats created.");
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function addSeats(event: FormEvent) {
    event.preventDefault();
    if (!seatRoom) return;
    setError("");
    try {
      await api(`/api/hostel/rooms/${seatRoom.id}/seats/`, { method: "POST", body: JSON.stringify({ count: Number(addForm.count || 1), furnishing: addForm.furnishing, monthly_rent: addForm.price || undefined }) });
      setMessage(`Added ${addForm.count} ${addForm.furnishing} seat(s) in room ${seatRoom.number}.`);
      setSeatRoom(null);
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function savePrices(event: FormEvent) {
    event.preventDefault();
    if (!seatRoom) return;
    setError("");
    try {
      await api(`/api/hostel/rooms/${seatRoom.id}/`, { method: "PATCH", body: JSON.stringify({ monthly_rent: seatRoom.monthly_rent || "0", mattress_rent: seatRoom.mattress_rent || "0" }) });
      setMessage(`Seat prices saved for room ${seatRoom.number}.`);
      setSeatRoom(null);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-slate-900">Rooms</h1>
          <p className="text-sm text-slate-500">{session?.role === "owner" ? "Every branch" : session?.branch_name || "Your branch"} · room number with its seats. Green is free, red is taken.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {session?.role === "owner" ? (
            <select className="field" value={branch} onChange={(event) => setBranch(event.target.value)}>
              <option value="">All branches</option>
              {branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          ) : null}
          <input className="field w-24" placeholder="Floor" value={floor} onChange={(event) => setFloor(event.target.value)} />
          {can(session, "rooms.manage") ? <Link className="btn btn-ghost" href={`/hostel/rooms/qr?${new URLSearchParams({ ...(branch ? { branch } : {}), ...(floor ? { floor } : {}) }).toString()}`}>Print QR codes</Link> : null}
          {can(session, "rooms.manage") ? <button className="btn btn-primary" onClick={() => { setForm({ ...blank, branch: branch || branches[0]?.id || "" }); setOpen(true); }}>Add room</button> : null}
        </div>
      </div>
      <Notice text={message} />
      <Notice tone="bad" text={error} />
      {rooms.length === 0 ? <EmptyState title="No rooms on this floor" text="Add a room and the seats are created with it." /> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => {
            const taken = room.beds.length - room.available_beds;
            return (
            <div key={room.id} className="rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
              <Link href={`/hostel/rooms/${room.id}`}>
                <p className="text-xs uppercase tracking-wide text-royal-700">{room.branch_name} · Floor {room.floor}</p>
                <h2 className="font-display text-2xl text-slate-900">Room {room.number}</h2>
                <p className="mt-1 text-sm text-slate-600">Available {room.available_beds} · Not available {taken} · Total seats {room.beds.length}</p>
                <p className="mt-1 text-xs text-slate-500">{seatMix(room)}</p>
              </Link>
              <div className="mt-3 space-y-2">
                {room.beds.map((bed) => (
                  <div key={bed.id} className="flex items-center justify-between gap-2 rounded-xl bg-royal-50 px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <SeatDot status={bed.status} label={bed.code} />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Room {room.number} · seat {bed.code}</p>
                        <p className="text-xs text-slate-500">{bed.occupant?.name || "Available"} · {seatKind(bed.furnishing)} · {pkr(bed.monthly_rent)}</p>
                        {bed.occupant?.notice_leave_on ? <p className="text-xs font-semibold text-amber-800">Notice · leaves {bed.occupant.notice_leave_on}</p> : null}
                      </div>
                    </div>
                    {!bed.occupant && can(session, "seats.manage") ? (
                      <select className="field" value={bed.furnishing || "bed"} onChange={(event) => setFurnishing(bed.id, event.target.value)}>
                        <option value="bed">Bed</option>
                        <option value="mattress">Mattress</option>
                      </select>
                    ) : null}
                    {bed.occupant && can(session, "stays.manage") ? (
                      <button type="button" className="text-xs font-semibold text-royal-800" onClick={() => { setShift({ customerId: bed.occupant!.id, name: bed.occupant!.name, from: `Room ${room.number} · ${bed.code}` }); setNextBed(""); }}>Shift</button>
                    ) : null}
                  </div>
                ))}
              </div>
              {can(session, "rooms.manage") ? <button className="btn btn-ghost mt-3" type="button" onClick={() => { setSeatRoom(room); setAddForm({ count: "1", furnishing: "bed", price: "" }); }}>Update seats</button> : null}
            </div>
            );
          })}
        </div>
      )}
      {shift ? (
        <Modal title={`Shift ${shift.name}`} onClose={() => setShift(null)}>
          <form onSubmit={shiftMember} className="space-y-3">
            <p className="text-sm text-slate-500">Now in {shift.from}. Choose a free seat in this branch.</p>
            <select className="field w-full" value={nextBed} onChange={(event) => setNextBed(event.target.value)} required>
              <option value="">Room and seat</option>
              {freeSeats.map((bed) => <option key={bed.id} value={bed.id}>Room {bed.roomNumber} · seat {bed.code} · {seatKind(bed.furnishing)} · {pkr(bed.monthly_rent)}</option>)}
            </select>
            <button className="btn btn-primary" type="submit">Shift member</button>
          </form>
        </Modal>
      ) : null}
      {open ? (
        <Modal title="New room" onClose={() => setOpen(false)}>
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            {session?.role === "owner" ? <label className="text-xs font-medium uppercase text-slate-500">Branch<select className="field mt-1 w-full normal-case" value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} required>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : null}
            <label className="text-xs font-medium uppercase text-slate-500">Room number<input className="field mt-1 w-full normal-case" value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} required /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Floor<input className="field mt-1 w-full normal-case" value={form.floor} onChange={(event) => setForm({ ...form, floor: event.target.value })} /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Type<select className="field mt-1 w-full normal-case" value={form.room_type} onChange={(event) => { const roomType = event.target.value; const seats = TYPE_SEATS[roomType]; setForm({ ...form, room_type: roomType, bed_seats: seats ? String(seats) : form.bed_seats, mattress_seats: seats ? "0" : form.mattress_seats }); }}><option value="single">Single sharing</option><option value="double">Double sharing</option><option value="triple">Triple sharing</option><option value="four">Four sharing</option><option value="six">Six sharing</option><option value="custom">Custom capacity</option></select></label>
            <label className="text-xs font-medium uppercase text-slate-500">Seats with bed<input type="number" min={0} className="field mt-1 w-full normal-case" value={form.bed_seats} onChange={(event) => setForm({ ...form, bed_seats: event.target.value })} /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Bed rent / month<input className="field mt-1 w-full normal-case" value={form.monthly_rent} onChange={(event) => setForm({ ...form, monthly_rent: event.target.value })} /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Seats with mattress<input type="number" min={0} className="field mt-1 w-full normal-case" value={form.mattress_seats} onChange={(event) => setForm({ ...form, mattress_seats: event.target.value })} /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Mattress rent / month<input className="field mt-1 w-full normal-case" value={form.mattress_rent} onChange={(event) => setForm({ ...form, mattress_rent: event.target.value })} /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Deposit<input className="field mt-1 w-full normal-case" value={form.security_deposit} onChange={(event) => setForm({ ...form, security_deposit: event.target.value })} /></label>
            <label className="sm:col-span-2 text-xs font-medium uppercase text-slate-500">Facilities<input className="field mt-1 w-full normal-case" value={form.facilities} onChange={(event) => setForm({ ...form, facilities: event.target.value })} /></label>
            <label className="flex items-center gap-2 text-sm normal-case text-slate-700"><input type="checkbox" checked={form.attached_bathroom} onChange={(event) => setForm({ ...form, attached_bathroom: event.target.checked })} /> Attached bathroom</label>
            <label className="flex items-center gap-2 text-sm normal-case text-slate-700"><input type="checkbox" checked={form.ac} onChange={(event) => setForm({ ...form, ac: event.target.checked })} /> AC</label>
            <label className="flex items-center gap-2 text-sm normal-case text-slate-700"><input type="checkbox" checked={form.wifi} onChange={(event) => setForm({ ...form, wifi: event.target.checked })} /> Wi-Fi</label>
            <div className="sm:col-span-2"><UploadField label="Room image" onPick={(image) => setForm({ ...form, image })} /></div>
            <p className="sm:col-span-2 text-sm text-slate-500">Bed seats and mattress seats have different monthly rents. Set both before a customer is assigned.</p>
            <button className="btn btn-primary sm:col-span-2" type="submit">Create room</button>
          </form>
        </Modal>
      ) : null}
      {seatRoom ? (
        <Modal title={`Room ${seatRoom.number} seats`} onClose={() => setSeatRoom(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">{seatMix(seatRoom)}. Add more seats any time. Taken seats stay as they are.</p>
            <form onSubmit={savePrices} className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium uppercase text-slate-500">Bed rent<input className="field mt-1 w-full normal-case" value={seatRoom.monthly_rent} onChange={(event) => setSeatRoom({ ...seatRoom, monthly_rent: event.target.value })} /></label>
              <label className="text-xs font-medium uppercase text-slate-500">Mattress rent<input className="field mt-1 w-full normal-case" value={seatRoom.mattress_rent || ""} onChange={(event) => setSeatRoom({ ...seatRoom, mattress_rent: event.target.value })} /></label>
              <button className="btn btn-ghost sm:col-span-2" type="submit">Save prices</button>
            </form>
            <form onSubmit={addSeats} className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium uppercase text-slate-500">Seats to add<input type="number" min={1} className="field mt-1 w-full normal-case" value={addForm.count} onChange={(event) => setAddForm({ ...addForm, count: event.target.value })} /></label>
              <label className="text-xs font-medium uppercase text-slate-500">Type<select className="field mt-1 w-full normal-case" value={addForm.furnishing} onChange={(event) => setAddForm({ ...addForm, furnishing: event.target.value })}><option value="bed">Bed</option><option value="mattress">Mattress</option></select></label>
              <label className="sm:col-span-2 text-xs font-medium uppercase text-slate-500">Price for this type, optional<input className="field mt-1 w-full normal-case" value={addForm.price} onChange={(event) => setAddForm({ ...addForm, price: event.target.value })} placeholder={addForm.furnishing === "mattress" ? seatRoom.mattress_rent || "" : seatRoom.monthly_rent} /></label>
              <button className="btn btn-primary sm:col-span-2" type="submit">Add seats</button>
            </form>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

export default function RoomsPage() {
  return <Suspense fallback={<p className="text-sm text-slate-400">Loading rooms…</p>}><RoomsBody /></Suspense>;
}
