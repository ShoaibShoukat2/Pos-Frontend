"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  manager: string | null;
  manager_email: string;
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
  const router = useRouter();
  const [rows, setRows] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [invite, setInvite] = useState("");
  const [handover, setHandover] = useState<Branch | null>(null);
  const [managers, setManagers] = useState<{ id: string; full_name: string; branch: string; branch_name: string; email: string }[]>([]);
  const [handMode, setHandMode] = useState<"existing" | "new">("new");
  const [handEmployee, setHandEmployee] = useState("");
  const [handForm, setHandForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const owner = can(session, "branches.manage");

  function load() {
    api("/api/hostel/branches/").then((data) => setRows(listOf(data))).catch((err) => setError(errText(err)));
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!handover) return;
    api("/api/hostel/employees/").then((data) => {
      const list = listOf<{ id: string; full_name: string; branch: string; branch_name: string; email: string; role: string; status: string }>(data)
        .filter((row) => row.role === "manager" && row.status !== "inactive");
      setManagers(list);
      setHandMode(list.length ? "existing" : "new");
      setHandEmployee(list[0]?.id || "");
    }).catch(() => undefined);
  }, [handover]);
  useEffect(() => {
    if (session && session.role !== "owner") router.replace("/hostel");
  }, [session, router]);

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
      const saved = editing
        ? await api<Branch>(`/api/hostel/branches/${editing}/`, { method: "PATCH", body: JSON.stringify(body) })
        : await api<Branch>("/api/hostel/branches/", { method: "POST", body: JSON.stringify(body) });
      setOpen(false);
      setEditing(null);
      setForm(blank);
      setMessage("Branch saved.");
      load();
      if (!editing) {
        setHandForm({ full_name: "", email: "", phone: "", password: "" });
        setHandover(saved);
      }
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

  async function handOver(event: FormEvent) {
    event.preventDefault();
    if (!handover) return;
    setError("");
    try {
      const body = handMode === "existing" ? { employee: handEmployee } : handForm;
      const saved = await api<Branch & { invite_path?: string }>(`/api/hostel/branches/${handover.id}/handover/`, { method: "POST", body: JSON.stringify(body) });
      setInvite(saved.invite_path ? `${window.location.origin}${saved.invite_path}` : "");
      setMessage(saved.invite_path ? `${saved.manager_name} can run ${saved.name} after setting a password.` : `${saved.manager_name} can now sign in and run ${saved.name}.`);
      setHandover(null);
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  const chosenManager = managers.find((item) => item.id === handEmployee);

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
      {invite ? <p className="break-all rounded-xl bg-gold-300/30 px-3 py-2 text-sm text-royal-950">{invite}</p> : null}
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
              <p className="mt-1 text-xs text-slate-600">{row.manager ? `Manager: ${row.manager_name}${row.manager_email ? ` · ${row.manager_email}` : ""}` : "No manager login yet"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link className="btn btn-ghost" href={`/hostel/branches/${row.id}`}>Dashboard</Link>
                {owner ? <button className="btn btn-ghost" onClick={() => { setHandForm({ full_name: "", email: "", phone: "", password: "" }); setHandover(row); }}>Hand over</button> : null}
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
            <label className="text-xs font-medium uppercase text-slate-500">Manager name<input className="field mt-1 w-full normal-case" value={form.manager_name} onChange={(event) => setForm({ ...form, manager_name: event.target.value })} /><span className="mt-1 block normal-case text-slate-400">Name only. Hand over the branch to give a manager login.</span></label>
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
      {handover ? (
        <Modal title={`Hand over ${handover.name}`} onClose={() => setHandover(null)}>
          <form onSubmit={handOver} className="space-y-3">
            <p className="text-sm text-slate-500">Give this branch to a manager you already created, or create the manager now. After that, they sign in and only this branch is open for them.</p>
            <div className="flex gap-2">
              <button type="button" className={`btn ${handMode === "existing" ? "btn-primary" : "btn-ghost"}`} onClick={() => setHandMode("existing")} disabled={managers.length === 0}>Existing manager</button>
              <button type="button" className={`btn ${handMode === "new" ? "btn-primary" : "btn-ghost"}`} onClick={() => setHandMode("new")}>New manager</button>
            </div>
            {handMode === "existing" ? (
              <>
                <select className="field w-full" value={handEmployee} onChange={(event) => setHandEmployee(event.target.value)} required>
                  <option value="">Choose a manager</option>
                  {managers.map((item) => <option key={item.id} value={item.id}>{item.full_name} · {item.branch_name}</option>)}
                </select>
                {chosenManager && chosenManager.branch !== handover.id ? <p className="text-sm text-slate-500">{chosenManager.full_name} will leave {chosenManager.branch_name} and only see {handover.name}.</p> : null}
                {chosenManager && chosenManager.branch === handover.id ? <p className="text-sm text-slate-500">{chosenManager.full_name} already works here. This makes them the manager of {handover.name}.</p> : null}
              </>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field" placeholder="Manager name" value={handForm.full_name} onChange={(event) => setHandForm({ ...handForm, full_name: event.target.value })} required />
                <input className="field" placeholder="Phone" value={handForm.phone} onChange={(event) => setHandForm({ ...handForm, phone: event.target.value })} />
                <input className="field" placeholder="Email" value={handForm.email} onChange={(event) => setHandForm({ ...handForm, email: event.target.value })} required />
                <input className="field" placeholder="Password" value={handForm.password} onChange={(event) => setHandForm({ ...handForm, password: event.target.value })} />
              </div>
            )}
            <button className="btn btn-primary" type="submit">Hand over branch</button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
