"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { EmptyState, Notice } from "@/components/hostel/bits";
import { useHostel } from "@/components/hostel/session";
import { api } from "@/lib/api";
import { errText, paymentSummary, pkr, printNow, waLink, pageOf } from "@/lib/hostel";

function HistoryBody() {
  const params = useSearchParams();
  const { session } = useHostel();
  const [rows, setRows] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");
  const [kind, setKind] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), page_size: "25" });
    if (search) query.set("search", search);
    if (method) query.set("method", method);
    if (kind) query.set("payment_type", kind);
    api(`/api/hostel/payments/?${query.toString()}`).then((data) => {
      const list = pageOf<any>(data);
      setRows(list.results);
      setCount(list.count);
    }).catch((err) => setError(errText(err)));
  }, [page, search, method, kind]);

  useEffect(() => {
    const id = params.get("receipt");
    if (!id) return;
    api(`/api/hostel/payments/${id}/`).then(setReceipt).catch(() => undefined);
  }, [params]);

  async function openReceipt(id: string) {
    const data = await api(`/api/hostel/payments/${id}/`);
    setReceipt(data);
  }

  async function voidPayment(id: string) {
    if (!window.confirm("Void this payment? The balance will be recalculated.")) return;
    try {
      await api(`/api/hostel/payments/${id}/`, { method: "DELETE" });
      setReceipt(null);
      setPage(1);
    } catch (err) {
      setError(errText(err));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-slate-900">Payment history</h1>
      <p className="text-sm text-slate-500">{session?.role === "employee" ? "Payments you collected." : "Every receipt is counted once."} {count} shown in this filter.</p>
      <div className="flex flex-wrap gap-2">
        <input className="field" placeholder="Receipt, customer, phone" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} />
        <select className="field" value={kind} onChange={(event) => setKind(event.target.value)}><option value="">Any type</option>{["rent", "deposit", "advance", "registration", "electricity", "gas", "laundry", "internet", "other"].map((item) => <option key={item}>{item}</option>)}</select>
        <select className="field" value={method} onChange={(event) => setMethod(event.target.value)}><option value="">Any method</option>{["cash", "bank", "jazzcash", "easypaisa", "online", "other"].map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <Notice tone="bad" text={error} />
      {rows.length === 0 ? <EmptyState title="No payments" text="Record a payment from a customer profile." /> : (
        <div className="overflow-x-auto rounded-2xl border border-royal-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400"><tr><th className="px-3 py-2">Receipt</th><th>Customer</th><th>Date</th><th>Method</th><th>By</th><th>Amount</th><th></th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{row.receipt_no}<p className="text-xs text-slate-400">{row.payment_type}</p></td>
                  <td>{row.customer_name}<p className="text-xs text-slate-400">{row.branch_name} · {row.room_number || "—"}/{row.seat || "—"}</p></td>
                  <td>{row.payment_date}</td>
                  <td>{row.method}</td>
                  <td>{row.received_by_name || "—"}</td>
                  <td className="font-semibold">{pkr(row.amount)}</td>
                  <td><button className="text-sm font-semibold text-royal-800" onClick={() => openReceipt(row.id)}>Receipt</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {receipt ? (
        <div className="rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
          <div id="hostel-print-root"><article className="hostel-sheet">
            <p className="text-xs uppercase tracking-[0.18em]">{session?.hostel_name}</p>
            <h1>Receipt {receipt.receipt_no}</h1>
            <p>{receipt.customer_name} · {receipt.branch_name}</p>
            <p>{receipt.payment_date} · {receipt.payment_type} · {receipt.method}</p>
            <p className="text-xl font-semibold">{pkr(receipt.amount)}</p>
            <p>Received by {receipt.received_by_name || "staff"} {receipt.transaction_id ? `· ${receipt.transaction_id}` : ""}</p>
            {receipt.screenshot ? <img src={receipt.screenshot} alt="Payment screenshot" className="mt-3 max-h-48" /> : null}
          </article></div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={printNow}>Print / Save PDF</button>
            <a className="btn btn-ghost" target="_blank" rel="noreferrer" href={waLink("", paymentSummary({ hostel: session?.hostel_name || "Hostel", branch: receipt.branch_name, customer: receipt.customer_name, room: receipt.room_number, seat: receipt.seat, rent: receipt.amount, paid: receipt.amount, remaining: 0, paidMonths: [], pendingMonths: [] }))}>WhatsApp receipt</a>
            {session?.role === "owner" ? <button className="btn btn-ghost" onClick={() => voidPayment(receipt.id)}>Void</button> : null}
            <button className="btn btn-ghost" onClick={() => setReceipt(null)}>Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function PaymentHistoryPage() {
  return <Suspense fallback={<p className="text-sm text-slate-400">Loading payments…</p>}><HistoryBody /></Suspense>;
}
