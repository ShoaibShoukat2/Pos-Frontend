"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useHostel } from "@/components/hostel/session";
import { api } from "@/lib/api";
import { errText, pkr, printNow, waLink, listOf } from "@/lib/hostel";

const TYPES = [
  ["occupancy", "Branch occupancy"],
  ["seats", "Available seats"],
  ["collections", "Monthly collection"],
  ["outstanding", "Outstanding payments"],
  ["customers", "Customer list"],
  ["employees", "Employee collection"],
  ["expenses", "Expenses"],
  ["maintenance", "Maintenance"],
  ["branch", "Complete branch"],
];

function ReportsBody() {
  const params = useSearchParams();
  const { session } = useHostel();
  const [kind, setKind] = useState(params.get("type") || "occupancy");
  const [branch, setBranch] = useState(params.get("branch") || "");
  const [branches, setBranches] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => { api("/api/hostel/branches/").then((data) => setBranches(listOf(data))).catch(() => undefined); }, []);
  useEffect(() => {
    const query = new URLSearchParams({ type: kind });
    if (branch) query.set("branch", branch);
    api(`/api/hostel/reports/?${query.toString()}`).then(setReport).catch((err) => setError(errText(err)));
  }, [kind, branch]);

  const rows = report?.rows || [];
  const keys = rows[0] ? Object.keys(rows[0]) : [];
  const share = report ? `${report.title}\n${report.hostel}\n${report.period?.from} to ${report.period?.to}\n${report.total ? `Total ${pkr(report.total)}` : `${rows.length} rows`}` : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500">Print on A4 or share a summary. Private documents stay inside the account.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="field" value={kind} onChange={(event) => setKind(event.target.value)}>{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          {session?.role === "owner" ? <select className="field" value={branch} onChange={(event) => setBranch(event.target.value)}><option value="">All branches</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : null}
          <button className="btn btn-primary" onClick={printNow}>Print / Save PDF</button>
          <a className="btn btn-ghost" target="_blank" rel="noreferrer" href={waLink("", share)}>WhatsApp summary</a>
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div id="hostel-print-root">
        <article className="hostel-sheet rounded-2xl border border-royal-100 bg-white p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.18em] text-royal-700">{report?.hostel}</p>
          <h1 className="font-display text-2xl">{report?.title || "Report"}</h1>
          <p className="text-sm text-slate-500">{report?.period?.from} to {report?.period?.to}</p>
          {report?.stats ? <p className="mt-2 text-sm">Seats {report.stats.seats} · occupied {report.stats.occupied} · collected {pkr(report.stats.month_revenue)} · profit {report.stats.profit != null ? pkr(report.stats.profit) : "—"}</p> : null}
          {report?.total ? <p className="mt-2 font-semibold">Total {pkr(report.total)}</p> : null}
          {keys.length ? (
            <table className="mt-4">
              <thead><tr>{keys.map((key) => <th key={key}>{key}</th>)}</tr></thead>
              <tbody>{rows.map((row: any, index: number) => <tr key={index}>{keys.map((key) => <td key={key}>{String(row[key] ?? "")}</td>)}</tr>)}</tbody>
            </table>
          ) : <p className="mt-4 text-sm text-slate-400">No rows for this report.</p>}
        </article>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return <Suspense fallback={<p className="text-sm text-slate-400">Loading reports…</p>}><ReportsBody /></Suspense>;
}
