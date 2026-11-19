"use client";

import { FormEvent, useEffect, useState } from "react";

import { EmptyState, Notice, UploadField } from "@/components/hostel/bits";
import { useHostel } from "@/components/hostel/session";
import { api } from "@/lib/api";
import { can, errText, pkr, listOf, pageOf } from "@/lib/hostel";

export default function EmployeesPage() {
  const { session } = useHostel();
  const [rows, setRows] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [invite, setInvite] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", branch: "", designation: "", salary: "", joining_date: "", role: "employee", can_manage_staff: false, can_approve_expenses: false, can_view_reports: false, photo: "" });

  function load() {
    api("/api/hostel/employees/").then((data) => setRows(listOf(data))).catch((err) => setError(errText(err)));
    api("/api/hostel/audit/?page_size=20").then((data) => setActivity(pageOf<any>(data).results)).catch(() => undefined);
    api("/api/hostel/branches/").then((data) => setBranches(listOf(data))).catch(() => undefined);
  }
  useEffect(() => { load(); }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const saved = await api<any>("/api/hostel/employees/", { method: "POST", body: JSON.stringify({ ...form, salary: form.salary || "0" }) });
      setInvite(saved.invite_path ? `${window.location.origin}${saved.invite_path}` : "");
      setMessage(saved.invite_path ? "Account created. Share the password setup link once." : "Employee can sign in with the password you set.");
      setForm({ ...form, full_name: "", email: "", phone: "", password: "", photo: "" });
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function saveAccess(row: any) {
    try {
      await api(`/api/hostel/employees/${row.id}/`, { method: "PATCH", body: JSON.stringify({ role: row.role, can_manage_staff: row.can_manage_staff, can_approve_expenses: row.can_approve_expenses, can_view_reports: row.can_view_reports, designation: row.designation, salary: row.salary }) });
      setMessage("Permissions updated.");
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function deactivate(id: string) {
    if (!window.confirm("Deactivate this employee? They will not be able to sign in.")) return;
    try {
      await api(`/api/hostel/employees/${id}/`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-slate-900">Employees</h1>
      <p className="text-sm text-slate-500">Collections this month are tied to the person who received the payment.</p>
      <Notice text={message} />
      {invite ? <p className="break-all rounded-xl bg-gold-300/30 px-3 py-2 text-sm text-royal-950">{invite}</p> : null}
      <Notice tone="bad" text={error} />
      {rows.length === 0 ? <EmptyState title="No staff yet" text="Add a branch manager or warden with their own login." /> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((row) => (
            <article key={row.id} className="rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-royal-700">{row.employee_code} · {row.branch_name}</p>
                  <h2 className="font-display text-xl">{row.full_name}</h2>
                  <p className="text-sm text-slate-500">{row.designation || row.role} · {row.email} · {row.phone}</p>
                </div>
                <div className="text-right"><p className="font-semibold">{pkr(row.collected)}</p><p className="text-xs text-slate-400">{row.transactions} payments</p></div>
              </div>
              {session?.role === "owner" ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <select className="field" value={row.role} onChange={(event) => setRows(rows.map((item) => item.id === row.id ? { ...item, role: event.target.value } : item))}><option value="employee">Employee</option><option value="manager">Manager</option></select>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={row.can_view_reports} onChange={(event) => setRows(rows.map((item) => item.id === row.id ? { ...item, can_view_reports: event.target.checked } : item))} /> Branch reports</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={row.can_approve_expenses} onChange={(event) => setRows(rows.map((item) => item.id === row.id ? { ...item, can_approve_expenses: event.target.checked } : item))} /> Approve expenses</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={row.can_manage_staff} onChange={(event) => setRows(rows.map((item) => item.id === row.id ? { ...item, can_manage_staff: event.target.checked } : item))} /> Manage staff</label>
                  <button className="btn btn-primary" onClick={() => saveAccess(row)}>Save access</button>
                  <button className="btn btn-ghost" onClick={() => deactivate(row.id)}>Deactivate</button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
      <section className="rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
        <h2 className="font-semibold">Activity</h2>
        {activity.map((row) => <p key={row.id} className="border-b border-slate-100 py-2 text-sm"><span className="font-medium">{row.actor_name || "System"}</span> · {row.summary}<span className="block text-xs text-slate-400">{row.action} · {row.branch_name}</span></p>)}
      </section>
      {can(session, "staff.manage") ? (
        <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-royal-100 bg-white p-4 shadow-card sm:grid-cols-2">
          <h2 className="sm:col-span-2 font-semibold">Add employee</h2>
          <input className="field" placeholder="Full name" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required />
          <input className="field" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <input className="field" placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <input className="field" placeholder="Password, or leave blank for an invite link" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <select className="field" value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} required><option value="">Branch</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <input className="field" placeholder="Designation" value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} />
          <input className="field" placeholder="Salary" value={form.salary} onChange={(event) => setForm({ ...form, salary: event.target.value })} />
          <input type="date" className="field" value={form.joining_date} onChange={(event) => setForm({ ...form, joining_date: event.target.value })} />
          {session?.role === "owner" ? <select className="field" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="employee">Employee</option><option value="manager">Branch manager</option></select> : null}
          <UploadField label="Photo" onPick={(photo) => setForm({ ...form, photo })} />
          {session?.role === "owner" && form.role === "manager" ? (
            <div className="sm:col-span-2 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.can_view_reports} onChange={(event) => setForm({ ...form, can_view_reports: event.target.checked })} /> Branch reports</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.can_approve_expenses} onChange={(event) => setForm({ ...form, can_approve_expenses: event.target.checked })} /> Approve expenses</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.can_manage_staff} onChange={(event) => setForm({ ...form, can_manage_staff: event.target.checked })} /> Manage staff</label>
            </div>
          ) : null}
          <button className="btn btn-primary sm:col-span-2" type="submit">Create login</button>
        </form>
      ) : null}
    </div>
  );
}
