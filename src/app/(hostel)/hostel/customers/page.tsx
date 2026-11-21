"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { EmptyState, StatusPill } from "@/components/hostel/bits";
import { api } from "@/lib/api";
import { errText, pkr, pageOf } from "@/lib/hostel";

type Row = {
  id: string; full_name: string; mobile: string; cnic: string; branch_name: string;
  room_number: string; seat: string; status: string; monthly_rent: string; balance: string;
  notice_given_on?: string | null; notice_leave_on?: string | null;
};

function CustomersBody() {
  const params = useSearchParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState(params.get("notice") || "");
  const [error, setError] = useState("");
  const branch = params.get("branch") || "";

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), page_size: "25" });
    if (search) query.set("search", search);
    if (status) query.set("status", status);
    if (notice) query.set("notice", notice);
    if (branch) query.set("branch", branch);
    api(`/api/hostel/customers/?${query.toString()}`)
      .then((data) => {
        const list = pageOf<Row>(data);
        setRows(list.results);
        setCount(list.count);
      })
      .catch((err) => setError(errText(err)));
  }, [page, search, status, notice, branch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">{count} records. Search by name, phone, CNIC, room, or seat.</p>
        </div>
        <Link href="/hostel/customers/new" className="btn btn-primary w-full sm:w-auto">New admission</Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <input className="field w-full sm:min-w-56" placeholder="Search" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} />
        <select className="field w-full sm:w-auto" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="reserved">Reserved</option>
          <option value="checked_out">Checked out</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="field w-full sm:w-auto" value={notice} onChange={(event) => { setPage(1); setNotice(event.target.value); }}>
          <option value="">Any notice</option>
          <option value="1">Notice given</option>
        </select>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {rows.length === 0 ? <EmptyState title="No customers" text="Take details and assign a room seat on one page." /> : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <Link key={row.id} href={`/hostel/customers/${row.id}`} className="block rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{row.full_name}</p>
                    <p className="text-sm text-slate-500">{row.mobile || "No phone"}</p>
                    <p className="mt-1 text-sm text-royal-800">{row.room_number ? `Room ${row.room_number} · seat ${row.seat || "—"}` : "No seat yet"}</p>
                  </div>
                  <StatusPill value={row.status} />
                </div>
                <p className="mt-2 text-xs text-slate-400">Balance {pkr(row.balance)} · rent {pkr(row.monthly_rent)}</p>
                {row.notice_leave_on ? <p className="mt-1 text-xs font-semibold text-amber-800">Notice given · leaves {row.notice_leave_on}</p> : null}
              </Link>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-2xl border border-royal-100 bg-white shadow-card md:block">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-3 py-2">Name</th><th>Phone</th><th>Branch</th><th>Room</th><th>Rent</th><th>Balance</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{row.full_name}<p className="text-xs text-slate-400">{row.cnic}</p>{row.notice_leave_on ? <p className="text-xs font-semibold text-amber-800">Notice · leaves {row.notice_leave_on}</p> : null}</td>
                  <td>{row.mobile || "—"}</td>
                  <td>{row.branch_name || "—"}</td>
                  <td>{row.room_number ? `${row.room_number} / ${row.seat || "—"}` : "—"}</td>
                  <td>{pkr(row.monthly_rent)}</td>
                  <td>{pkr(row.balance)}</td>
                  <td><StatusPill value={row.status} /></td>
                  <td><Link className="text-sm font-semibold text-royal-800" href={`/hostel/customers/${row.id}`}>View details</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
      <div className="flex items-center justify-between text-sm">
        <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
        <span className="text-slate-400">Page {page}</span>
        <button className="btn btn-ghost" disabled={page * 25 >= count} onClick={() => setPage((value) => value + 1)}>Next</button>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  return <Suspense fallback={<p className="text-sm text-slate-400">Loading customers…</p>}><CustomersBody /></Suspense>;
}
