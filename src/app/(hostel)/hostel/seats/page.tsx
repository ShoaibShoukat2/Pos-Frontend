"use client";

import { useEffect, useState } from "react";

import { EmptyState, Notice, SeatDot } from "@/components/hostel/bits";
import { useHostel } from "@/components/hostel/session";
import { api } from "@/lib/api";
import { can, errText, listOf, pkr, seatKind } from "@/lib/hostel";

type Bed = { id: string; code: string; furnishing?: string; status: string; room: string; room_number: string; floor: number; branch_name: string; occupant: { name: string } | null; monthly_rent: string };

export default function SeatsPage() {
  const { session } = useHostel();
  const [rows, setRows] = useState<Bed[]>([]);
  const [status, setStatus] = useState("");
  const [floor, setFloor] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (floor) query.set("floor", floor);
    api(`/api/hostel/beds/?${query.toString()}`).then((data) => setRows(listOf(data))).catch((err) => setError(errText(err)));
  }
  useEffect(() => { load(); }, [status, floor]);

  async function setFurnishing(bed: Bed, furnishing: string) {
    setError("");
    try {
      await api(`/api/hostel/beds/${bed.id}/furnishing/`, { method: "POST", body: JSON.stringify({ furnishing }) });
      setMessage(`Seat ${bed.code} is now a ${seatKind(furnishing).toLowerCase()}.`);
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function mark(bed: Bed, next: string) {
    setError("");
    try {
      await api(`/api/hostel/beds/${bed.id}/status/`, { method: "POST", body: JSON.stringify({ status: next }) });
      setMessage(`Seat ${bed.code} is now ${next}.`);
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-slate-900">Beds & seats</h1>
          <p className="text-sm text-slate-500">Set bed or mattress before assigning a customer. The monthly rent follows that choice.</p>
        </div>
        <div className="flex gap-2">
          <input className="field w-24" placeholder="Floor" value={floor} onChange={(event) => setFloor(event.target.value)} />
          <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>
      <Notice text={message} />
      <Notice tone="bad" text={error} />
      {rows.length === 0 ? <EmptyState title="No seats match" text="Create a room first. Seats are added with the room." /> : (
        <div className="overflow-x-auto rounded-2xl border border-royal-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-3 py-2">Seat</th><th>Room</th><th>Floor</th><th>Type</th><th>Rent</th><th>Branch</th><th>Guest</th><th></th></tr></thead>
            <tbody>
              {rows.map((bed) => (
                <tr key={bed.id} className="border-t border-slate-100">
                  <td className="px-3 py-2"><SeatDot status={bed.status} label={bed.code} /></td>
                  <td>{bed.room_number}</td>
                  <td>{bed.floor}</td>
                  <td>
                    {can(session, "seats.manage") && !bed.occupant ? (
                      <select className="field" value={bed.furnishing || "bed"} onChange={(event) => setFurnishing(bed, event.target.value)}>
                        <option value="bed">Bed</option>
                        <option value="mattress">Mattress</option>
                      </select>
                    ) : seatKind(bed.furnishing)}
                  </td>
                  <td>{pkr(bed.monthly_rent)}</td>
                  <td>{bed.branch_name}</td>
                  <td>{bed.occupant?.name || "—"}</td>
                  <td className="py-2 text-right">
                    {can(session, "seats.manage") && !bed.occupant ? (
                      <select className="field" value={bed.status} onChange={(event) => mark(bed, event.target.value)}>
                        <option value="available">Available</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
