"use client";

import { FormEvent, useEffect, useState } from "react";

import { Notice, UploadField } from "@/components/hostel/bits";
import { api } from "@/lib/api";
import { errText } from "@/lib/hostel";

export default function HostelSettingsPage() {
  const [form, setForm] = useState({ display_name: "", tagline: "", logo: "", due_day: "5", late_fee: "0", receipt_prefix: "HST" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api<typeof form>("/api/hostel/settings/").then((data) => setForm({
      display_name: data.display_name || "",
      tagline: data.tagline || "",
      logo: data.logo || "",
      due_day: String(data.due_day || 5),
      late_fee: String(data.late_fee || 0),
      receipt_prefix: data.receipt_prefix || "HST",
    })).catch((err) => setError(errText(err)));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/api/hostel/settings/", { method: "PUT", body: JSON.stringify({ ...form, due_day: Number(form.due_day), late_fee: form.late_fee || "0" }) });
      setMessage("Hostel settings saved.");
    } catch (err) {
      setError(errText(err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-3xl text-slate-900">Hostel settings</h1>
      <p className="text-sm text-slate-500">These details appear on receipts, reports, and WhatsApp messages.</p>
      <Notice text={message} />
      <Notice tone="bad" text={error} />
      <label className="block text-xs uppercase text-slate-500">Hostel name<input className="field mt-1 w-full normal-case" value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} /></label>
      <label className="block text-xs uppercase text-slate-500">Tagline<input className="field mt-1 w-full normal-case" value={form.tagline} onChange={(event) => setForm({ ...form, tagline: event.target.value })} /></label>
      <label className="block text-xs uppercase text-slate-500">Rent due day<input type="number" min={1} max={28} className="field mt-1 w-full normal-case" value={form.due_day} onChange={(event) => setForm({ ...form, due_day: event.target.value })} /></label>
      <label className="block text-xs uppercase text-slate-500">Default late fee<input className="field mt-1 w-full normal-case" value={form.late_fee} onChange={(event) => setForm({ ...form, late_fee: event.target.value })} /></label>
      <label className="block text-xs uppercase text-slate-500">Receipt prefix<input className="field mt-1 w-full normal-case" value={form.receipt_prefix} onChange={(event) => setForm({ ...form, receipt_prefix: event.target.value })} /></label>
      <UploadField label="Logo" onPick={(logo) => setForm({ ...form, logo })} />
      {form.logo ? <img src={form.logo} alt="Hostel logo" className="h-16 w-16 rounded-xl object-cover" /> : null}
      <button className="btn btn-primary" type="submit">Save settings</button>
    </form>
  );
}
