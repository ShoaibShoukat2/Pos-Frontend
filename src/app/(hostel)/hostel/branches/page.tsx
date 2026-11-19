"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { EmptyState, Modal, Notice, UploadField } from "@/components/hostel/bits";
import { useHostel } from "@/components/hostel/session";
import { api } from "@/lib/api";
import { can, errText, pkr, listOf } from "@/lib/hostel";

type Branch = {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  manager_name: string;
  floors: number;
  monthly_rent: string;
  security_deposit: string;
  opening_date: string | null;
  status: string;
  image: string;
  total_rooms: number;
  total_seats: number;
  available_seats: number;
  occupied_seats: number;
  reserved_seats: number;
};

const blank = {
  name: "", code: "", address: "", city: "", phone: "", email: "", manager_name: "",
  floors: "1", monthly_rent: "", security_deposit: "", opening_date: "", status: "active", image: "",
};

export default function BranchesPage() {
  const { session } = useHostel();
  const [rows, setRows] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const owner = can(session, "branches.manage");

  function load() {
    api("/api/hostel/branches/").then((data) => setRows(listOf(data))).catch((err) => setError(errText(err)));
  }
  useEffect(() => { load(); }, []);

  function edit(row: Branch) {
    setEditing(row.id);
    setForm({
      name: row.name, code: row.code, address: row.address || "", city: row.city || "", phone: row.phone || "",
      email: row.email || "", manager_name: row.manager_name || "", floors: String(row.floors),
      monthly_rent: row.monthly_rent, security_deposit: row.security_deposit,
      opening_date: row.opening_date || "", status: row.status, image: row.image || "",
    });
    setOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const body = { ...form, floors: Number(form.floors || 1), monthly_rent: form.monthly_rent || "0", security_deposit: form.security_deposit || "0", opening_date: form.opening_date || null };
      if (editing) await api(`/api/hostel/branches/${editing}/`, { method: "PATCH", body: JSON.stringify(body) });
      else await api("/api/hostel/branches/", { method: "POST", body: JSON.stringify(body) });
      setOpen(false);
      setEditing(null);
      setForm(blank);
      setMessage("Branch saved.");
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function remove(row: Branch) {
    setError("");
    try {
      await api(`/api/hostel/branches/${row.id}/`, { method: "DELETE" });
      setMessage("Branch removed.");
      load();
    } catch (err) {
      try {
        await api(`/api/hostel/branches/${row.id}/`, { method: "PATCH", body: JSON.stringify({ status: "inactive" }) });
        setMessage("This branch has records, so it was deactivated instead of deleted.");
        load();
      } catch (inner) {
        setError(errText(inner || err));
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-slate-900">Branches</h1>
          <p className="text-sm text-slate-500">Each branch keeps its own rooms, seats, guests, and money.</p>
        </div>
        {owner ? <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(blank); setOpen(true); }}>Add branch</button> : null}
      </div>
      <Notice text={message} />
      <Notice tone="bad" text={error} />
      {rows.length === 0 ? <EmptyState title="No branches yet" text="Add the first hostel branch to start rooms and bookings." /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => (
            <article key={row.id} className="rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-royal-700">{row.code}</p>
                  <h2 className="font-display text-xl text-slate-900">{row.name}</h2>
                  <p className="text-sm text-slate-500">{[row.address, row.city].filter(Boolean).join(", ") || "Address not set"}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{row.status}</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                <div><p className="text-slate-400">Rooms</p><p className="font-semibold">{row.total_rooms}</p></div>
                <div><p className="text-slate-400">Seats</p><p className="font-semibold">{row.total_seats}</p></div>
                <div><p className="text-slate-400">Free</p><p className="font-semibold text-emerald-700">{row.available_seats}</p></div>
                <div><p className="text-slate-400">Taken</p><p className="font-semibold text-red-600">{row.occupied_seats}</p></div>
              </div>
              <p className="mt-3 text-xs text-slate-500">Rent {pkr(row.monthly_rent)} · Deposit {pkr(row.security_deposit)} · {row.phone || "No phone"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link className="btn btn-ghost" href={`/hostel/branches/${row.id}`}>Dashboard</Link>
                {owner ? <button className="btn btn-ghost" onClick={() => edit(row)}>Edit</button> : null}
                {owner ? <button className="btn btn-ghost" onClick={() => remove(row)}>Delete / deactivate</button> : null}
              </div>
            </article>
          ))}
        </div>
      )}
      {open ? (
        <Modal title={editing ? "Edit branch" : "New branch"} onClose={() => setOpen(false)}>
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium uppercase text-slate-500">Name<input className="field mt-1 w-full normal-case" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Code<input className="field mt-1 w-full normal-case" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required /></label>
            <label className="sm:col-span-2 text-xs font-medium uppercase text-slate-500">Address<textarea className="field mt-1 w-full normal-case" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
            <label className="text-xs font-medium uppercase text-slate-500">City<input className="field mt-1 w-full normal-case" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Phone<input className="field mt-1 w-full normal-case" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Manager<input className="field mt-1 w-full normal-case" value={form.manager_name} onChange={(event) => setForm({ ...form, manager_name: event.target.value })} /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Floors<input type="number" min={1} className="field mt-1 w-full normal-case" value={form.floors} onChange={(event) => setForm({ ...form, floors: event.target.value })} /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Monthly rent<input className="field mt-1 w-full normal-case" value={form.monthly_rent} onChange={(event) => setForm({ ...form, monthly_rent: event.target.value })} /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Security deposit<input className="field mt-1 w-full normal-case" value={form.security_deposit} onChange={(event) => setForm({ ...form, security_deposit: event.target.value })} /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Opening date<input type="date" className="field mt-1 w-full normal-case" value={form.opening_date} onChange={(event) => setForm({ ...form, opening_date: event.target.value })} /></label>
            <label className="text-xs font-medium uppercase text-slate-500">Status<select className="field mt-1 w-full normal-case" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
            <div className="sm:col-span-2"><UploadField label="Branch image" onPick={(image) => setForm({ ...form, image })} /></div>
            {error ? <p className="sm:col-span-2 text-sm text-red-600">{error}</p> : null}
            <button className="btn btn-primary sm:col-span-2" type="submit">Save branch</button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
