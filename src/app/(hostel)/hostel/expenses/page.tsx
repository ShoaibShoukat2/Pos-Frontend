"use client";

import { FormEvent, useEffect, useState } from "react";

import { EmptyState, Notice, StatusPill, UploadField } from "@/components/hostel/bits";
import { useHostel } from "@/components/hostel/session";
import { api } from "@/lib/api";
import { can, errText, pkr, listOf, pageOf } from "@/lib/hostel";

const CATEGORIES = ["electricity", "gas", "water", "internet", "salary", "cleaning", "repairs", "furniture", "maintenance", "security", "food", "other"];

export default function ExpensesPage() {
  const { session } = useHostel();
  const [tab, setTab] = useState<"expenses" | "maintenance">("expenses");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [expense, setExpense] = useState({ branch: "", title: "", category: "other", amount: "", expense_date: "", description: "", method: "cash", receipt_image: "" });
  const [job, setJob] = useState({ branch: "", room: "", title: "", description: "", priority: "medium", estimated_cost: "", assigned_worker: "", images: [] as string[] });

  function load() {
    api("/api/hostel/expenses/?page_size=50").then((data) => setExpenses(pageOf<any>(data).results)).catch((err) => setError(errText(err)));
    api("/api/hostel/maintenance/?page_size=50").then((data) => setJobs(pageOf<any>(data).results)).catch(() => undefined);
    api("/api/hostel/branches/").then((data) => setBranches(listOf(data))).catch(() => undefined);
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!job.branch) return;
    api(`/api/hostel/rooms/?branch=${job.branch}`).then((data) => setRooms(listOf(data))).catch(() => undefined);
  }, [job.branch]);

  async function saveExpense(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/api/hostel/expenses/", { method: "POST", body: JSON.stringify(expense) });
      setMessage("Expense submitted for approval.");
      setExpense({ ...expense, title: "", amount: "", description: "", receipt_image: "" });
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function saveJob(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/api/hostel/maintenance/", { method: "POST", body: JSON.stringify({ ...job, room: job.room || null, estimated_cost: job.estimated_cost || "0" }) });
      setMessage("Maintenance request sent.");
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function decide(id: string, approval: string) {
    try {
      await api(`/api/hostel/expenses/${id}/approve/`, { method: "POST", body: JSON.stringify({ approval }) });
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function updateJob(row: any, status: string) {
    try {
      await api(`/api/hostel/maintenance/${row.id}/`, { method: "PATCH", body: JSON.stringify({ status, actual_cost: row.actual_cost || row.estimated_cost || "0", completion_date: status === "completed" ? new Date().toISOString().slice(0, 10) : null }) });
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-slate-900">Expenses & maintenance</h1>
      <div className="flex gap-2">
        <button className={`btn ${tab === "expenses" ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab("expenses")}>Expenses</button>
        <button className={`btn ${tab === "maintenance" ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab("maintenance")}>Maintenance</button>
      </div>
      <Notice text={message} />
      <Notice tone="bad" text={error} />
      {tab === "expenses" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-2">
            {expenses.length === 0 ? <EmptyState title="No expenses" text="Record electricity, salaries, repairs, and other costs." /> : expenses.map((row) => (
              <article key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
                <div>
                  <p className="font-semibold">{row.title}</p>
                  <p className="text-xs text-slate-500">{row.branch_name} · {row.category} · {row.expense_date} · {row.recorded_by_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{pkr(row.amount)}</p>
                  <StatusPill value={row.approval} />
                  {can(session, "expenses.approve") && row.approval === "pending" ? (
                    <>
                      <button className="btn btn-ghost" onClick={() => decide(row.id, "approved")}>Approve</button>
                      <button className="btn btn-ghost" onClick={() => decide(row.id, "rejected")}>Reject</button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          <form onSubmit={saveExpense} className="space-y-2 rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
            <h2 className="font-semibold">New expense</h2>
            <select className="field w-full" value={expense.branch} onChange={(event) => setExpense({ ...expense, branch: event.target.value })} required><option value="">Branch</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <input className="field w-full" placeholder="Title" value={expense.title} onChange={(event) => setExpense({ ...expense, title: event.target.value })} required />
            <select className="field w-full" value={expense.category} onChange={(event) => setExpense({ ...expense, category: event.target.value })}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
            <input className="field w-full" placeholder="Amount" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: event.target.value })} required />
            <input type="date" className="field w-full" value={expense.expense_date} onChange={(event) => setExpense({ ...expense, expense_date: event.target.value })} required />
            <textarea className="field w-full" placeholder="Description" value={expense.description} onChange={(event) => setExpense({ ...expense, description: event.target.value })} />
            <UploadField allowPdf label="Invoice" onPick={(receipt_image) => setExpense({ ...expense, receipt_image })} />
            <button className="btn btn-primary w-full" type="submit">Submit</button>
          </form>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-2">
            {jobs.length === 0 ? <EmptyState title="No maintenance" text="Report a room issue with a photo." /> : jobs.map((row) => (
              <article key={row.id} className="rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
                <div className="flex items-start justify-between"><div><p className="font-semibold">{row.title}</p><p className="text-xs text-slate-500">{row.branch_name} · room {row.room_number || "—"} · {row.priority} · {row.reported_by_name}</p><p className="text-sm text-slate-600">{row.description}</p></div><StatusPill value={row.status} /></div>
                <p className="mt-2 text-xs text-slate-400">Estimate {pkr(row.estimated_cost)} · actual {pkr(row.actual_cost)} · {row.assigned_worker || "Unassigned"}</p>
                {can(session, "maintenance.manage") ? (
                  <div className="mt-2 flex gap-2">
                    <button className="btn btn-ghost" onClick={() => updateJob(row, "in_progress")}>Start</button>
                    <button className="btn btn-ghost" onClick={() => updateJob(row, "completed")}>Complete</button>
                    <button className="btn btn-ghost" onClick={() => updateJob(row, "rejected")}>Reject</button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
          <form onSubmit={saveJob} className="space-y-2 rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
            <h2 className="font-semibold">Report an issue</h2>
            <select className="field w-full" value={job.branch} onChange={(event) => setJob({ ...job, branch: event.target.value })} required><option value="">Branch</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <select className="field w-full" value={job.room} onChange={(event) => setJob({ ...job, room: event.target.value })}><option value="">Room</option>{rooms.map((item) => <option key={item.id} value={item.id}>{item.number}</option>)}</select>
            <input className="field w-full" placeholder="Title" value={job.title} onChange={(event) => setJob({ ...job, title: event.target.value })} required />
            <textarea className="field w-full" placeholder="What is wrong?" value={job.description} onChange={(event) => setJob({ ...job, description: event.target.value })} />
            <select className="field w-full" value={job.priority} onChange={(event) => setJob({ ...job, priority: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
            <input className="field w-full" placeholder="Estimated cost" value={job.estimated_cost} onChange={(event) => setJob({ ...job, estimated_cost: event.target.value })} />
            <input className="field w-full" placeholder="Assign worker" value={job.assigned_worker} onChange={(event) => setJob({ ...job, assigned_worker: event.target.value })} />
            <UploadField label="Issue photo" onPick={(image) => setJob({ ...job, images: [image] })} />
            <button className="btn btn-primary w-full" type="submit">Submit request</button>
          </form>
        </div>
      )}
    </div>
  );
}
