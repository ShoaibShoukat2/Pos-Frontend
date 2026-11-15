"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ApiError, api, fieldErrors } from "@/lib/api";

export default function NewFleetCarPage() {
  const router = useRouter();
  const [form, setForm] = useState({ brand: "", model: "", model_year: "", registration_number: "", color: "", daily_rate: "", notes: "" });
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      await api("/api/rental/rental-cars/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          model_year: Number(form.model_year || 0),
          daily_rate: Number(form.daily_rate || 0),
        }),
      });
      router.push("/rental/fleet");
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
    } finally {
      setPending(false);
    }
  }

  const field = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-semibold text-slate-900">Add car</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {([
          ["brand", "Brand"],
          ["model", "Model"],
          ["model_year", "Year"],
          ["registration_number", "Registration"],
          ["color", "Color"],
          ["daily_rate", "Daily rate"],
        ] as const).map(([key, label]) => (
          <label key={key} className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
            <input required={key === "brand" || key === "model"} value={form[key]} onChange={(event) => set(key, event.target.value)} className={field} />
            {errors[key] ? <span className="text-xs text-red-600">{errors[key]}</span> : null}
          </label>
        ))}
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
          <textarea value={form.notes} onChange={(event) => set("notes", event.target.value)} rows={2} className={field} />
        </label>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={pending} className="flex-1 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{pending ? "Saving…" : "Save car"}</button>
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">Cancel</button>
        </div>
      </form>
    </div>
  );
}
