"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Notice, UploadField } from "@/components/hostel/bits";
import { api, asList } from "@/lib/api";
import { errText } from "@/lib/hostel";

type Branch = { id: string; name: string };
type Room = { id: string; number: string; branch: string; floor: number };
type Bed = { id: string; code: string; room_number: string };

export default function NewCustomerPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Record<string, string | boolean>>({
    full_name: "", father_name: "", mobile: "", whatsapp: "", email: "", gender: "male",
    date_of_birth: "", permanent_address: "", current_address: "", emergency_contact: "",
    guardian_name: "", guardian_contact: "", cnic: "", branch: "", room: "", bed_id: "",
    admission_date: "", check_in_date: "", expected_checkout: "", monthly_rent: "",
    security_deposit: "", registration_fee: "", notes: "", photo: "", cnic_front: "", cnic_back: "",
    check_in_now: true,
  });

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => { api("/api/hostel/branches/").then((data) => setBranches(asList(data))).catch(() => undefined); }, []);
  useEffect(() => {
    if (!form.branch) return;
    api(`/api/hostel/rooms/?branch=${form.branch}`).then((data) => setRooms(asList(data))).catch(() => undefined);
  }, [form.branch]);
  useEffect(() => {
    if (!form.branch || !form.check_in_date || !form.expected_checkout) return;
    const query = new URLSearchParams({ branch: String(form.branch), check_in: String(form.check_in_date), check_out: String(form.expected_checkout) });
    if (form.room) query.set("room", String(form.room));
    api(`/api/hostel/beds/open/?${query.toString()}`).then((data) => setBeds(asList(data))).catch(() => setBeds([]));
  }, [form.branch, form.room, form.check_in_date, form.expected_checkout]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const body = { ...form, bed_id: form.bed_id || null, monthly_rent: form.monthly_rent || "0", security_deposit: form.security_deposit || "0", registration_fee: form.registration_fee || "0" };
      const saved = await api<{ id: string }>("/api/hostel/customers/", { method: "POST", body: JSON.stringify(body) });
      router.push(`/hostel/customers/${saved.id}`);
    } catch (err) {
      setError(errText(err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-4">
      <h1 className="font-display text-3xl text-slate-900">Register customer</h1>
      <Notice tone="bad" text={error} />
      <section className="grid gap-3 rounded-2xl border border-royal-100 bg-white p-4 shadow-card sm:grid-cols-2">
        <Field label="Full name"><input className="field w-full" value={String(form.full_name)} onChange={(event) => set("full_name", event.target.value)} required /></Field>
        <Field label="Father name"><input className="field w-full" value={String(form.father_name)} onChange={(event) => set("father_name", event.target.value)} /></Field>
        <Field label="Mobile"><input className="field w-full" value={String(form.mobile)} onChange={(event) => set("mobile", event.target.value)} /></Field>
        <Field label="WhatsApp"><input className="field w-full" value={String(form.whatsapp)} onChange={(event) => set("whatsapp", event.target.value)} /></Field>
        <Field label="Email"><input className="field w-full" value={String(form.email)} onChange={(event) => set("email", event.target.value)} /></Field>
        <Field label="Gender"><select className="field w-full" value={String(form.gender)} onChange={(event) => set("gender", event.target.value)}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></Field>
        <Field label="Date of birth"><input type="date" className="field w-full" value={String(form.date_of_birth)} onChange={(event) => set("date_of_birth", event.target.value)} /></Field>
        <Field label="CNIC"><input className="field w-full" value={String(form.cnic)} onChange={(event) => set("cnic", event.target.value)} /></Field>
        <Field label="Permanent address"><textarea className="field w-full" value={String(form.permanent_address)} onChange={(event) => set("permanent_address", event.target.value)} /></Field>
        <Field label="Current address"><textarea className="field w-full" value={String(form.current_address)} onChange={(event) => set("current_address", event.target.value)} /></Field>
        <Field label="Emergency contact"><input className="field w-full" value={String(form.emergency_contact)} onChange={(event) => set("emergency_contact", event.target.value)} /></Field>
        <Field label="Guardian name"><input className="field w-full" value={String(form.guardian_name)} onChange={(event) => set("guardian_name", event.target.value)} /></Field>
        <Field label="Guardian contact"><input className="field w-full" value={String(form.guardian_contact)} onChange={(event) => set("guardian_contact", event.target.value)} /></Field>
        <UploadField label="Profile photo" onPick={(value) => set("photo", value)} />
        <UploadField label="CNIC front" onPick={(value) => set("cnic_front", value)} />
        <UploadField label="CNIC back" onPick={(value) => set("cnic_back", value)} />
      </section>
      <section className="grid gap-3 rounded-2xl border border-royal-100 bg-white p-4 shadow-card sm:grid-cols-2">
        <Field label="Branch"><select className="field w-full" value={String(form.branch)} onChange={(event) => set("branch", event.target.value)} required><option value="">Choose</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Room"><select className="field w-full" value={String(form.room)} onChange={(event) => set("room", event.target.value)}><option value="">Any</option>{rooms.map((item) => <option key={item.id} value={item.id}>Floor {item.floor} · {item.number}</option>)}</select></Field>
        <Field label="Admission"><input type="date" className="field w-full" value={String(form.admission_date)} onChange={(event) => set("admission_date", event.target.value)} /></Field>
        <Field label="Check-in"><input type="date" className="field w-full" value={String(form.check_in_date)} onChange={(event) => set("check_in_date", event.target.value)} /></Field>
        <Field label="Expected checkout"><input type="date" className="field w-full" value={String(form.expected_checkout)} onChange={(event) => set("expected_checkout", event.target.value)} /></Field>
        <Field label="Available seat"><select className="field w-full" value={String(form.bed_id)} onChange={(event) => set("bed_id", event.target.value)}><option value="">Assign later</option>{beds.map((bed) => <option key={bed.id} value={bed.id}>Room {bed.room_number} · {bed.code}</option>)}</select></Field>
        <Field label="Monthly rent"><input className="field w-full" value={String(form.monthly_rent)} onChange={(event) => set("monthly_rent", event.target.value)} /></Field>
        <Field label="Security deposit"><input className="field w-full" value={String(form.security_deposit)} onChange={(event) => set("security_deposit", event.target.value)} /></Field>
        <Field label="Registration fee"><input className="field w-full" value={String(form.registration_fee)} onChange={(event) => set("registration_fee", event.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={Boolean(form.check_in_now)} onChange={(event) => set("check_in_now", event.target.checked)} /> Check in now if the date is today or earlier</label>
      </section>
      <button className="btn btn-primary" type="submit">Save customer</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}{children}</label>;
}
