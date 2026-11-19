"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Modal, Notice, StatusPill, UploadField } from "@/components/hostel/bits";
import { useHostel } from "@/components/hostel/session";
import { api } from "@/lib/api";
import { errText, paymentSummary, pkr, printNow, waLink, listOf } from "@/lib/hostel";

type Finance = {
  total_payable: string; total_paid: string; remaining: string; credit: string;
  last_payment: string | null; last_amount: string; next_due: string | null;
  paid_months: string[]; unpaid_months: string[]; overdue_months: string[];
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const { session } = useHostel();
  const [row, setRow] = useState<any>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [beds, setBeds] = useState<any[]>([]);
  const [pay, setPay] = useState({ amount: "", payment_type: "rent", method: "cash", payment_date: "", period_year: "", period_month: "", transaction_id: "", notes: "", screenshot: "" });
  const [extendDate, setExtendDate] = useState("");
  const [nextBed, setNextBed] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});

  function load() {
    api(`/api/hostel/customers/${params.id}/`).then((data: any) => {
      setRow(data);
      setDraft({
        full_name: data.full_name || "", mobile: data.mobile || "", whatsapp: data.whatsapp || "",
        email: data.email || "", cnic: data.cnic || "", father_name: data.father_name || "",
        guardian_name: data.guardian_name || "", guardian_contact: data.guardian_contact || "",
        permanent_address: data.permanent_address || "", monthly_rent: data.monthly_rent || "",
        notes: data.notes || "",
      });
    }).catch((err) => setError(errText(err)));
  }
  useEffect(() => { load(); }, [params.id]);

  const stay = row?.reservations?.find((item: any) => item.status === "checked_in");
  const finance: Finance | undefined = row?.finance;

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(`/api/hostel/customers/${params.id}/`, { method: "PATCH", body: JSON.stringify(draft) });
      setEditing(false);
      setMessage("Customer updated.");
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function recordPay(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/hostel/payments/", { method: "POST", body: JSON.stringify({ ...pay, customer: params.id, amount: pay.amount, period_year: pay.period_year || undefined, period_month: pay.period_month || undefined }) });
      setPayOpen(false);
      setMessage("Payment recorded.");
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function extendStay(event: FormEvent) {
    event.preventDefault();
    if (!stay) return;
    try {
      await api(`/api/hostel/reservations/${stay.id}/extend/`, { method: "POST", body: JSON.stringify({ expected_checkout: extendDate }) });
      setExtendOpen(false);
      setMessage("Stay extended.");
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function loadBeds() {
    if (!row?.branch || !row?.expected_checkout) return;
    const start = new Date().toISOString().slice(0, 10);
    const data = await api(`/api/hostel/beds/open/?branch=${row.branch}&check_in=${start}&check_out=${extendDate || row.expected_checkout}`);
    setBeds(listOf(data));
    setMoveOpen(true);
  }

  async function moveRoom(event: FormEvent) {
    event.preventDefault();
    try {
      await api(`/api/hostel/customers/${params.id}/change-room/`, { method: "POST", body: JSON.stringify({ bed: nextBed, expected_checkout: extendDate || row.expected_checkout }) });
      setMoveOpen(false);
      setMessage("Room changed.");
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  function summary(kind: "balance" | "reminder" | "details") {
    const text = paymentSummary({
      hostel: session?.hostel_name || "Hostel",
      branch: row?.branch_name || "",
      customer: row?.full_name || "",
      room: row?.room_number || row?.reservations?.[0]?.room_number || "",
      seat: row?.seat || row?.reservations?.[0]?.seat || "",
      rent: row?.monthly_rent || 0,
      paid: finance?.total_paid || 0,
      remaining: finance?.remaining || 0,
      paidMonths: finance?.paid_months || [],
      pendingMonths: finance?.unpaid_months || [],
    });
    if (kind === "reminder") return `MONTHLY RENT REMINDER\n\n${text}\nNext due: ${finance?.next_due || "this month"}`;
    if (kind === "details") return `CUSTOMER DETAILS\n\n${text}\nCNIC: ${row?.cnic || "-"}\nPhone: ${row?.mobile || "-"}`;
    return text;
  }

  if (!row && !error) return <p className="text-sm text-slate-400">Loading profile…</p>;
  if (!row) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <div id="hostel-print-root" className="hostel-print-only">
        <article className="hostel-sheet p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-royal-700">{session?.hostel_name}</p>
          <h1>{row.full_name}</h1>
          <p>{row.branch_name} · Room {row.room_number || row.reservations?.[0]?.room_number || "-"} · Seat {row.seat || row.reservations?.[0]?.seat || "-"}</p>
          <p>CNIC {row.cnic || "-"} · {row.mobile || "-"}</p>
          <p>Admission {row.admission_date || "-"} · Rent {pkr(row.monthly_rent)} · Deposit {pkr(row.security_deposit)}</p>
          <p>Paid {pkr(finance?.total_paid)} · Balance {pkr(finance?.remaining)}</p>
          <p>Paid months: {(finance?.paid_months || []).join(", ") || "-"}</p>
          <p>Unpaid months: {(finance?.unpaid_months || []).join(", ") || "-"}</p>
          <table className="mt-4">
            <thead><tr><th>Date</th><th>Receipt</th><th>Type</th><th>Amount</th></tr></thead>
            <tbody>
              {(row.payments || []).map((item: any) => (
                <tr key={item.id}><td>{item.payment_date}</td><td>{item.receipt_no}</td><td>{item.payment_type}</td><td>{pkr(item.amount)}</td></tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>
      <Link href="/hostel/customers" className="text-xs font-semibold uppercase tracking-wide text-royal-700">Customers</Link>
      <Notice text={message} />
      <Notice tone="bad" text={error} />
      <section className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="rounded-2xl border border-royal-100 bg-white p-4 shadow-card">
          {row.photo ? <img src={row.photo} alt="" className="h-44 w-full rounded-xl object-cover" /> : <div className="grid h-44 place-items-center rounded-xl bg-royal-50 text-sm text-royal-700">No photo</div>}
          <h1 className="mt-3 font-display text-2xl text-slate-900">{row.full_name}</h1>
          <p className="text-sm text-slate-500">{row.mobile || "No phone"} · {row.cnic || "No CNIC"}</p>
          <div className="mt-2"><StatusPill value={row.status} /></div>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={printNow}>Print / Save PDF</button>
            <a className="btn btn-ghost" target="_blank" rel="noreferrer" href={waLink(row.whatsapp || row.mobile, summary("details"))}>WhatsApp details</a>
            <a className="btn btn-ghost" target="_blank" rel="noreferrer" href={waLink(row.whatsapp || row.mobile, summary("balance"))}>Share balance</a>
            <a className="btn btn-ghost" target="_blank" rel="noreferrer" href={waLink(row.whatsapp || row.mobile, summary("reminder"))}>Rent reminder</a>
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn btn-ghost" onClick={() => setPayOpen(true)}>Record payment</button>
            <button className="btn btn-ghost" disabled={!stay} onClick={() => setExtendOpen(true)}>Change leaving date</button>
            <button className="btn btn-ghost" disabled={!stay} onClick={loadBeds}>Change room</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Money label="Payable" value={finance?.total_payable} />
            <Money label="Paid" value={finance?.total_paid} />
            <Money label="Balance" value={finance?.remaining} />
            <Money label="Next due" value={finance?.next_due || "—"} plain />
          </div>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Personal">
          <p>Father: {row.father_name || "—"}</p>
          <p>Guardian: {row.guardian_name || "—"} · {row.guardian_contact || ""}</p>
          <p>WhatsApp: {row.whatsapp || "—"}</p>
          <p>Address: {row.permanent_address || "—"}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {row.cnic_front ? <img src={row.cnic_front} alt="CNIC front" className="h-28 w-full rounded-lg object-cover" /> : null}
            {row.cnic_back ? <img src={row.cnic_back} alt="CNIC back" className="h-28 w-full rounded-lg object-cover" /> : null}
          </div>
        </Card>
        <Card title="Hostel">
          <p>Branch: {row.branch_name || "—"}</p>
          <p>Room: {row.room_number || row.reservations?.[0]?.room_number || "—"} · Floor {row.floor || row.reservations?.[0]?.floor || "—"} · Seat {row.seat || row.reservations?.[0]?.seat || "—"}</p>
          <p>Admission: {row.admission_date || "—"}</p>
          <p>Joining: {row.check_in_date || "—"} · Leaving: {row.checkout_date || row.expected_checkout || "—"}</p>
          <p>Rent {pkr(row.monthly_rent)} · Deposit {pkr(row.security_deposit)}</p>
        </Card>
      </div>
      <Card title="Monthly dues">
        <div className="flex flex-wrap gap-2">
          {(row.months || []).map((month: any) => (
            <div key={month.id} className="rounded-xl border border-slate-100 px-3 py-2 text-sm">
              <p className="font-medium">{month.month}/{month.year}</p>
              <StatusPill value={month.status} />
              <p className="text-xs text-slate-400">{pkr(month.amount_paid)} / {pkr(month.amount_due)}</p>
            </div>
          ))}
          {(row.months || []).length === 0 ? <p className="text-sm text-slate-400">No monthly bills yet.</p> : null}
        </div>
        {(finance?.overdue_months || []).length ? <p className="mt-2 text-sm text-red-600">Overdue: {finance?.overdue_months.join(", ")}</p> : null}
      </Card>
      <Card title="Payments">
        {(row.payments || []).map((item: any) => (
          <div key={item.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm">
            <div><p className="font-medium">{item.receipt_no} · {item.payment_type}</p><p className="text-xs text-slate-400">{item.payment_date} · {item.method} · {item.received_by_name}</p></div>
            <div className="text-right"><p className="font-semibold">{pkr(item.amount)}</p><Link className="text-xs text-royal-700" href={`/hostel/payments/history?receipt=${item.id}`}>Receipt</Link></div>
          </div>
        ))}
      </Card>
      <Card title="Reservations">
        {(row.reservations || []).map((item: any) => (
          <div key={item.id} className="flex items-center justify-between py-2 text-sm">
            <p>{item.number} · Room {item.room_number} seat {item.seat} · {item.check_in_date} to {item.expected_checkout}</p>
            <StatusPill value={item.status} />
          </div>
        ))}
        {(row.checkins || []).map((item: any) => <p key={item.id} className="text-xs text-slate-500">Joined {String(item.at).slice(0, 16)} by {item.by || "staff"} · room {item.room}</p>)}
        {(row.checkouts || []).map((item: any) => <p key={item.id} className="text-xs text-slate-500">Left {String(item.at).slice(0, 16)} · {item.notes || "room " + item.room}</p>)}
      </Card>
      <Card title="Documents">
        <div className="flex flex-wrap gap-2">
          {(row.documents || []).map((doc: any) => <Link key={doc.id} href={`/hostel/documents?customer=${row.id}`} className="rounded-full bg-royal-50 px-3 py-1 text-xs font-semibold text-royal-800">{doc.title}</Link>)}
        </div>
      </Card>
      {editing ? (
        <Modal title="Edit customer" onClose={() => setEditing(false)}>
          <form onSubmit={saveEdit} className="grid gap-3 sm:grid-cols-2">
            {Object.entries(draft).map(([key, value]) => (
              <label key={key} className="text-xs uppercase text-slate-500">{key.replaceAll("_", " ")}<input className="field mt-1 w-full normal-case" value={value} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>
            ))}
            <button className="btn btn-primary sm:col-span-2" type="submit">Save</button>
          </form>
        </Modal>
      ) : null}
      {payOpen ? (
        <Modal title="Record payment" onClose={() => setPayOpen(false)}>
          <form onSubmit={recordPay} className="grid gap-3">
            <input className="field" placeholder="Amount" value={pay.amount} onChange={(event) => setPay({ ...pay, amount: event.target.value })} required />
            <select className="field" value={pay.payment_type} onChange={(event) => setPay({ ...pay, payment_type: event.target.value })}>
              {["rent", "deposit", "advance", "registration", "electricity", "gas", "laundry", "internet", "other"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="field" value={pay.method} onChange={(event) => setPay({ ...pay, method: event.target.value })}>
              {["cash", "bank", "jazzcash", "easypaisa", "online", "other"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input type="date" className="field" value={pay.payment_date} onChange={(event) => setPay({ ...pay, payment_date: event.target.value })} required />
            <div className="grid grid-cols-2 gap-2">
              <input className="field" placeholder="Year" value={pay.period_year} onChange={(event) => setPay({ ...pay, period_year: event.target.value })} />
              <input className="field" placeholder="Month" value={pay.period_month} onChange={(event) => setPay({ ...pay, period_month: event.target.value })} />
            </div>
            <input className="field" placeholder="Transaction ID" value={pay.transaction_id} onChange={(event) => setPay({ ...pay, transaction_id: event.target.value })} />
            <textarea className="field" placeholder="Notes" value={pay.notes} onChange={(event) => setPay({ ...pay, notes: event.target.value })} />
            <UploadField label="Screenshot" onPick={(screenshot) => setPay({ ...pay, screenshot })} />
            <button className="btn btn-primary" type="submit">Save payment</button>
          </form>
        </Modal>
      ) : null}
      {extendOpen ? (
        <Modal title="Extend stay" onClose={() => setExtendOpen(false)}>
          <form onSubmit={extendStay} className="space-y-3">
            <input type="date" className="field w-full" value={extendDate} onChange={(event) => setExtendDate(event.target.value)} required />
            <button className="btn btn-primary" type="submit">Extend</button>
          </form>
        </Modal>
      ) : null}
      {moveOpen ? (
        <Modal title="Change room" onClose={() => setMoveOpen(false)}>
          <form onSubmit={moveRoom} className="space-y-3">
            <select className="field w-full" value={nextBed} onChange={(event) => setNextBed(event.target.value)} required>
              <option value="">Choose a free seat</option>
              {beds.map((bed) => <option key={bed.id} value={bed.id}>Room {bed.room_number} · {bed.code}</option>)}
            </select>
            <button className="btn btn-primary" type="submit">Move guest</button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function Money({ label, value, plain = false }: { label: string; value?: string | null; plain?: boolean }) {
  return <div className="rounded-2xl border border-royal-100 bg-white p-3 shadow-card"><p className="text-xs text-slate-400">{label}</p><p className="font-display text-xl">{plain ? value : pkr(value)}</p></div>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-royal-100 bg-white p-4 shadow-card"><h2 className="mb-2 font-semibold text-slate-900">{title}</h2><div className="space-y-1 text-sm text-slate-600">{children}</div></section>;
}
