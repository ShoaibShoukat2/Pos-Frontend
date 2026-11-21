import Link from "next/link";

import { SeatDot, StatusPill } from "@/components/hostel/bits";
import { can, pkr, seatKind } from "@/lib/hostel";
import type { HostelSession } from "@/lib/hostel";

export function RoomSheet({
  room,
  hostelName,
  session,
  onFurnishing,
}: {
  room: any;
  hostelName?: string;
  session?: HostelSession | null;
  onFurnishing?: (id: string, furnishing: string) => void;
}) {
  const staying = (room.beds || []).filter((bed: any) => bed.occupant).length;
  const facilities = [room.attached_bathroom ? "Attached bathroom" : "Shared bathroom", room.ac ? "AC" : "Non-AC", room.wifi ? "Wi-Fi" : "No Wi-Fi", room.facilities].filter(Boolean);
  return (
    <article id="room-profile-print" className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="bg-royal-950 px-5 py-6 text-white sm:px-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-300">{hostelName || room.branch_name}</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl leading-none">Room {room.number}</h1>
            <p className="mt-2 text-sm text-white/70">{room.branch_name} · Floor {room.floor}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{staying} staying</p>
            <p className="text-white/70">{room.available_beds} empty · {room.beds.length} seats</p>
          </div>
        </div>
      </div>
      {room.image ? <img src={room.image} alt={`Room ${room.number}`} className="h-52 w-full object-cover" /> : null}
      <section className="grid grid-cols-2 gap-3 border-b border-slate-100 px-5 py-4 text-sm sm:grid-cols-3 sm:px-7">
        <Fact label="Seats" value={String(room.beds.length)} />
        <Fact label="Beds" value={String(room.bed_count)} />
        <Fact label="Mattresses" value={String(room.mattress_count)} />
        <Fact label="Bed rent" value={`${pkr(room.monthly_rent)} / month`} />
        <Fact label="Mattress rent" value={`${pkr(room.mattress_rent)} / month`} />
        <div className="col-span-2 sm:col-span-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Room</p>
          <p className="text-sm font-medium text-slate-900">{facilities.join(" · ")}</p>
        </div>
      </section>
      <section className="space-y-4 px-4 py-5 sm:px-6">
        <h2 className="px-1 font-display text-xl text-slate-900">Seats</h2>
        {room.beds.map((bed: any) => (
          <SeatProfile key={bed.id} bed={bed} session={session} onFurnishing={onFurnishing} />
        ))}
      </section>
    </article>
  );
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function SeatProfile({ bed, session, onFurnishing }: { bed: any; session?: HostelSession | null; onFurnishing?: (id: string, furnishing: string) => void }) {
  const person = bed.occupant;
  const initial = String(person?.name || "?").trim().charAt(0).toUpperCase();
  return (
    <article className="seat-profile overflow-hidden rounded-xl border border-slate-200">
      <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <SeatDot status={bed.status} label={bed.code} />
          <div>
            <p className="font-semibold text-slate-900">Seat {bed.code}</p>
            <p className="text-xs text-slate-500">{seatKind(bed.furnishing)} · {pkr(bed.monthly_rent)} / month</p>
          </div>
        </div>
        <StatusPill value={person?.status || bed.status} />
      </div>
      {person?.restricted ? (
        <p className="px-4 py-4 text-sm text-slate-600">Occupied. Guest details are only for this branch manager.</p>
      ) : person ? (
        <div className="grid gap-4 p-4 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
          {person.photo ? (
            <img src={person.photo} alt={person.name} className="h-36 w-full rounded-lg object-cover sm:w-[7.5rem]" />
          ) : (
            <div className="grid h-36 w-full place-items-center rounded-lg bg-royal-50 font-display text-4xl text-royal-800 sm:w-[7.5rem]">{initial}</div>
          )}
          <div className="min-w-0">
            <Link href={`/hostel/customers/${person.id}`} className="font-display text-2xl text-slate-900">{person.name}</Link>
            {person.father_name ? <p className="text-sm text-slate-500">S/O {person.father_name}</p> : null}
            <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <Fact label="CNIC" value={person.cnic} />
              <Fact label="Gender" value={person.gender ? `${person.gender.charAt(0).toUpperCase()}${person.gender.slice(1)}` : ""} />
              <Fact label="Date of birth" value={person.date_of_birth} />
              <Fact label="Phone" value={person.phone} />
              <Fact label="WhatsApp" value={person.whatsapp} />
              <Fact label="Email" value={person.email} />
              <Fact label="Guardian" value={[person.guardian_name, person.guardian_contact].filter(Boolean).join(" · ")} />
              <Fact label="Emergency" value={person.emergency_contact} />
              <Fact label="Joined" value={person.check_in_date} />
              <Fact label="Leaving" value={person.expected_checkout} />
              <Fact label="Rent" value={pkr(person.monthly_rent)} />
              <div className="sm:col-span-2"><Fact label="Address" value={person.current_address || person.permanent_address} /></div>
            </div>
            {person.notice_leave_on ? <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">Notice given {person.notice_given_on}. Leaves this seat on {person.notice_leave_on}.{person.notice_note ? ` ${person.notice_note}` : ""}</p> : null}
            {person.notes ? <p className="mt-2 text-sm text-slate-600">{person.notes}</p> : null}
          </div>
          {person.cnic_front || person.cnic_back ? (
            <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
              {person.cnic_front ? <figure><img src={person.cnic_front} alt="CNIC front" className="h-36 w-full rounded-lg border border-slate-100 object-cover" /><figcaption className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">CNIC front</figcaption></figure> : null}
              {person.cnic_back ? <figure><img src={person.cnic_back} alt="CNIC back" className="h-36 w-full rounded-lg border border-slate-100 object-cover" /><figcaption className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">CNIC back</figcaption></figure> : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="px-4 py-4">
          <p className="text-sm font-medium text-emerald-700">This seat is empty.</p>
          {onFurnishing && can(session, "seats.manage") ? (
            <select className="field no-sheet-print mt-3 max-w-xs" value={bed.furnishing || "bed"} onChange={(event) => onFurnishing(bed.id, event.target.value)}>
              <option value="bed">Bed</option>
              <option value="mattress">Mattress</option>
            </select>
          ) : null}
        </div>
      )}
    </article>
  );
}
