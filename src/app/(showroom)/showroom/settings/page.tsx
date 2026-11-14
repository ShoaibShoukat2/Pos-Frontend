"use client";
import { FormEvent, useEffect, useState } from "react";
import { api, asList } from "@/lib/api";

type Item = { id: string; name: string };

function Section({ title, endpoint }: { title: string; endpoint: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { api(endpoint).then((d) => setItems(asList(d as any))).catch(() => {}); }, [endpoint]);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const item = await api<Item>(endpoint, { method: "POST", body: JSON.stringify({ name: name.trim() }) });
      setItems((prev) => [...prev, item]);
      setName("");
    } catch {}
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    try { await api(`${endpoint}${id}/`, { method: "DELETE" }); setItems((prev) => prev.filter((i) => i.id !== id)); } catch {}
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-semibold text-slate-900">{title}</h3>
      <form onSubmit={add} className="mb-4 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Add ${title.toLowerCase()}…`}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
        <button type="submit" disabled={saving} className="btn btn-primary px-4 py-2 text-sm">Add</button>
      </form>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-700">{item.name}</span>
            <button type="button" onClick={() => remove(item.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-slate-400">No {title.toLowerCase()} yet.</li>}
      </ul>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-slate-900">Settings</h1>
      <div className="grid gap-5 sm:grid-cols-2">
        <Section title="Car Brands"          endpoint="/api/showroom/car-brands/" />
        <Section title="Fuel Types"          endpoint="/api/showroom/fuel-types/" />
        <Section title="Transmission Types"  endpoint="/api/showroom/transmissions/" />
        <Section title="Expense Categories"  endpoint="/api/showroom/showroom-expense-categories/" />
      </div>
    </div>
  );
}
