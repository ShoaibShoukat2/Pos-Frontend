"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Notice, UploadField } from "@/components/hostel/bits";
import { useHostel } from "@/components/hostel/session";
import { api } from "@/lib/api";
import { errText, listOf } from "@/lib/hostel";

type Branch = { id: string; name: string };
type Seat = { id: string; code: string; status: string; occupant?: { name: string } | null };
type Room = {
  id: string;
  number: string;
  floor: number;
  monthly_rent: string;
  security_deposit: string;
  beds: Seat[];
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function laterIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function NewCustomerPage() {
  const router = useRouter();
  const { session } = useHostel();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Record<string, string>>({
    full_name: "", father_name: "", mobile: "", whatsapp: "", email: "", gender: "male",
    date_of_birth: "", permanent_address: "", current_address: "", emergency_contact: "",
    guardian_name: "", guardian_contact: "", cnic: "", branch: "", room: "", bed_id: "",
    admission_date: todayIso(), check_in_date: todayIso(), expected_checkout: laterIso(30),
    monthly_rent: "", security_deposit: "", registration_fee: "", notes: "",
    photo: "", cnic_front: "", cnic_back: "",
  });

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    api("/api/hostel/branches/").then((data) => setBranches(listOf(data))).catch(() => undefined);
  }, []);
  useEffect(() => {
    const branch = session?.role === "owner" ? form.branch : session?.branch_id || form.branch;
    if (branch && branch !== form.branch) set("branch", branch);
  }, [session?.role, session?.branch_id, form.branch]);
  useEffect(() => {
    if (!form.branch) return;
    api(`/api/hostel/rooms/?branch=${form.branch}`).then((data) => setRooms(listOf(data))).catch(() => setRooms([]));
  }, [form.branch]);

  const picked = useMemo(() => {
    for (const room of rooms) {
      const seat = room.beds.find((bed) => bed.id === form.bed_id);
      if (seat) return { room, seat };
    }
    return null;
  }, [rooms, form.bed_id]);

  function chooseSeat(room: Room, seat: Seat) {
    if (seat.status !== "available") return;
    setForm((prev) => ({
      ...prev,
      room: room.id,
      bed_id: seat.id,
      monthly_rent: prev.monthly_rent || room.monthly_rent || "",
      security_deposit: prev.security_deposit || room.security_deposit || "",
    }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.bed_id) {
      setError("Choose a free seat in this branch.");
      return;
    }
    try {
      const body: Record<string, unknown> = { check_in_now: true, branch: form.branch };
      for (const [key, value] of Object.entries(form)) {
        if (key === "room" || value === "") continue;
        body[key] = value;
      }
      body.monthly_rent = form.monthly_rent || "0";
      body.security_deposit = form.security_deposit || "0";
      body.registration_fee = form.registration_fee || "0";
      const saved = await api<{ id: string }>("/api/hostel/customers/", { method: "POST", body: JSON.stringify(body) });
      router.push(`/hostel/customers/${saved.id}`);
    } catch (err) {
      setError(errText(err));
    }
  }

  const branchName = session?.role === "owner"
    ? branches.find((item) => item.id === form.branch)?.name || "Choose a branch"
    : session?.branch_name || "Your branch";

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-4 pb-24">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-royal-700">{branchName}</p>
        <h1 className="font-display text-3xl text-slate-900">New admission</h1>
        <p className="mt-1 text-sm text-slate-500">Take the customer details and give a room seat on this page. The room or seat can be changed later.</p>
      </div>
      <Notice tone="bad" text={error} />

      <section className="space-y-3 rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
        <h2 className="font-semibold text-slate-900">Customer</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name"><input className="field w-full" value={form.full_name} onChange={(event) => set("full_name", event.target.value)} required autoComplete="name" /></Field>
          <Field label="Father name"><input className="field w-full" value={form.father_name} onChange={(event) => set("father_name", event.target.value)} /></Field>
          <Field label="Mobile"><input className="field w-full" inputMode="tel" value={form.mobile} onChange={(event) => set("mobile", event.target.value)} required /></Field>
          <Field label="WhatsApp"><input className="field w-full" inputMode="tel" value={form.whatsapp} onChange={(event) => set("whatsapp", event.target.value)} /></Field>
          <Field label="CNIC"><input className="field w-full" value={form.cnic} onChange={(event) => set("cnic", event.target.value)} /></Field>
          <Field label="Gender">
            <select className="field w-full" value={form.gender} onChange={(event) => set("gender", event.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Guardian name"><input className="field w-full" value={form.guardian_name} onChange={(event) => set("guardian_name", event.target.value)} /></Field>
          <Field label="Guardian contact"><input className="field w-full" inputMode="tel" value={form.guardian_contact} onChange={(event) => set("guardian_contact", event.target.value)} /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <UploadField label="Photo" onPick={(value) => set("photo", value)} />
          <UploadField label="CNIC front" onPick={(value) => set("cnic_front", value)} />
          <UploadField label="CNIC back" onPick={(value) => set("cnic_back", value)} />
        </div>
        <details className="rounded-xl bg-royal-50 px-3 py-2 text-sm text-slate-600">
          <summary className="cursor-pointer font-medium text-royal-900">More details</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Email"><input className="field w-full" value={form.email} onChange={(event) => set("email", event.target.value)} /></Field>
            <Field label="Date of birth"><input type="date" className="field w-full" value={form.date_of_birth} onChange={(event) => set("date_of_birth", event.target.value)} /></Field>
            <Field label="Emergency contact"><input className="field w-full" value={form.emergency_contact} onChange={(event) => set("emergency_contact", event.target.value)} /></Field>
            <Field label="Permanent address"><textarea className="field w-full" rows={2} value={form.permanent_address} onChange={(event) => set("permanent_address", event.target.value)} /></Field>
            <Field label="Current address"><textarea className="field w-full" rows={2} value={form.current_address} onChange={(event) => set("current_address", event.target.value)} /></Field>
            <Field label="Notes"><textarea className="field w-full" rows={2} value={form.notes} onChange={(event) => set("notes", event.target.value)} /></Field>
          </div>
        </details>
      </section>

      <section className="space-y-3 rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-semibold text-slate-900">Room and seat</h2>
            <p className="text-sm text-slate-500">Tap a green seat. Taken seats stay locked.</p>
          </div>
          {picked ? <p className="rounded-full bg-gold-300 px-3 py-1 text-sm font-semibold text-royal-950">Room {picked.room.number} · seat {picked.seat.code}</p> : null}
        </div>
        {session?.role === "owner" ? (
          <Field label="Branch">
            <select className="field w-full" value={form.branch} onChange={(event) => setForm((prev) => ({ ...prev, branch: event.target.value, room: "", bed_id: "" }))} required>
              <option value="">Choose</option>
              {branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Joining"><input type="date" className="field w-full" value={form.check_in_date} onChange={(event) => set("check_in_date", event.target.value)} required /></Field>
          <Field label="Stay until"><input type="date" className="field w-full" value={form.expected_checkout} onChange={(event) => set("expected_checkout", event.target.value)} required /></Field>
          <Field label="Admission"><input type="date" className="field w-full" value={form.admission_date} onChange={(event) => set("admission_date", event.target.value)} /></Field>
        </div>
        {rooms.length === 0 ? <p className="rounded-xl bg-royal-50 px-3 py-6 text-center text-sm text-slate-500">No rooms in this branch yet.</p> : (
          <div className="space-y-3">
            {rooms.map((room) => {
              const free = room.beds.filter((bed) => bed.status === "available").length;
              return (
                <div key={room.id} className="rounded-2xl border border-slate-100 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">Room {room.number}</p>
                    <p className="text-xs text-slate-500">Floor {room.floor} · {free} free · {room.beds.length - free} taken</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {room.beds.map((seat) => {
                      const open = seat.status === "available";
                      const selected = form.bed_id === seat.id;
                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={!open}
                          onClick={() => chooseSeat(room, seat)}
                          className={`min-h-12 min-w-16 rounded-xl px-3 text-sm font-semibold ${selected ? "bg-gold-400 text-royal-950" : open ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-400"}`}
                        >
                          <span className="block">{seat.code}</span>
                          <span className="block text-[10px] font-medium">{selected ? "Selected" : open ? "Free" : seat.occupant?.name || "Taken"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-3 rounded-2xl border border-royal-100 bg-white p-4 shadow-card sm:grid-cols-3">
        <Field label="Monthly rent"><input className="field w-full" inputMode="decimal" value={form.monthly_rent} onChange={(event) => set("monthly_rent", event.target.value)} /></Field>
        <Field label="Security deposit"><input className="field w-full" inputMode="decimal" value={form.security_deposit} onChange={(event) => set("security_deposit", event.target.value)} /></Field>
        <Field label="Registration fee"><input className="field w-full" inputMode="decimal" value={form.registration_fee} onChange={(event) => set("registration_fee", event.target.value)} /></Field>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-royal-100 bg-white/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <p className="hidden min-w-0 flex-1 truncate text-sm text-slate-500 sm:block">{picked ? `Room ${picked.room.number} · seat ${picked.seat.code}` : "Pick a free seat"}</p>
          <button className="btn btn-primary w-full sm:w-auto" type="submit">Save customer and seat</button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}{children}</label>;
}
