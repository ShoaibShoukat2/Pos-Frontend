"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { HardwareSetup, HardwareToasts } from "@/components/HardwareBar";
import { RentalInvoice } from "@/components/rental/RentalInvoice";
import { ApiError, api, asList, fieldErrors } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useHardware } from "@/lib/hardware";
import { invoiceFromRental, type RentalInvoiceData } from "@/lib/rental";

type Car = { id: string; display_name: string; registration_number: string; daily_rate: string; status: string };
type Customer = { id: string; name: string; phone: string; cnic: string; address: string };
type SavedRental = Parameters<typeof invoiceFromRental>[0];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function plusDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function money(value: number) {
  return `Rs ${value.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export default function RentCounterPage() {
  const hardware = useHardware();
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [carId, setCarId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(plusDays(today(), 1));
  const [rate, setRate] = useState("");
  const [deposit, setDeposit] = useState("");
  const [received, setReceived] = useState("");
  const [method, setMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [printSlip, setPrintSlip] = useState(true);
  const [preview, setPreview] = useState<RentalInvoiceData | null>(null);
  const [invoice, setInvoice] = useState<RentalInvoiceData | null>(null);
  const [savedNote, setSavedNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  function loadLists() {
    api<Car[] | { results?: Car[] }>("/api/rental/rental-cars/?status=available").then((data) => setCars(asList(data))).catch(() => setCars([]));
    api<Customer[] | { results?: Customer[] }>("/api/rental/rental-customers/").then((data) => setCustomers(asList(data))).catch(() => setCustomers([]));
  }

  useEffect(() => { loadLists(); }, []);

  const car = cars.find((row) => row.id === carId);
  const customer = customers.find((row) => row.id === customerId);
  const days = useMemo(() => {
    const diff = Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000);
    return Math.max(1, diff || 1);
  }, [start, end]);
  const daily = Number(rate || 0);
  const total = daily * days;

  function chooseCar(id: string) {
    setCarId(id);
    const next = cars.find((row) => row.id === id);
    if (next) setRate(String(Number(next.daily_rate || 0)));
  }

  function draft(): RentalInvoiceData {
    return {
      invoice_number: "Preview",
      customer_name: customer?.name || "Customer",
      customer_phone: customer?.phone || "",
      customer_cnic: customer?.cnic || "",
      customer_address: customer?.address || "",
      car_name: car?.display_name || "Car",
      registration_number: car?.registration_number || "",
      start_date: start,
      end_date: end,
      days,
      daily_rate: daily,
      total_amount: total,
      deposit: Number(deposit || 0),
      received_amount: Number(received || 0),
      balance: Math.max(0, total - Number(received || 0)),
      payment_method: method,
      notes,
      shop_name: user?.business_name || "Rent a Car",
      cashier_name: user?.full_name || "",
    };
  }

  function resetForm() {
    setCarId("");
    setCustomerId("");
    setStart(today());
    setEnd(plusDays(today(), 1));
    setRate("");
    setDeposit("");
    setReceived("");
    setNotes("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setErrors({});
    setSavedNote("");
    if (!carId || !customerId) {
      setErrors({ form: "Choose a car and a customer." });
      return;
    }
    setPending(true);
    try {
      const saved = await api<SavedRental>("/api/rental/rentals/", {
        method: "POST",
        body: JSON.stringify({
          car: carId,
          customer: customerId,
          start_date: start,
          end_date: end,
          daily_rate: daily,
          deposit: Number(deposit || 0),
          received_amount: Number(received || 0),
          payment_method: method,
          notes,
        }),
      });
      resetForm();
      loadLists();
      if (printSlip) setInvoice(invoiceFromRental(saved, { name: user?.business_name, cashier: user?.full_name }));
      else setSavedNote(`Rental ${saved.invoice_number || ""} saved.`);
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
      else setErrors({ form: "Could not save this rental." });
    } finally {
      setPending(false);
    }
  }

  const field = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-royal-800 focus:ring-2 focus:ring-royal-700/10";

  return (
    <div className="mx-auto max-w-6xl">
      {invoice ? <RentalInvoice data={invoice} onClose={() => setInvoice(null)} /> : null}
      {preview ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-3xl">
            <RentalInvoice layout="preview" data={preview} onClose={() => setPreview(null)} />
          </div>
        </div>
      ) : null}
      <HardwareToasts hardware={hardware} />

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-royal-800">Rent a Car</p>
        <h1 className="font-display text-2xl font-semibold text-slate-900">Rent Counter</h1>
        <p className="mt-0.5 text-sm text-slate-400">Choose the car and customer, then preview or print the rental slip.</p>
      </div>

      <HardwareSetup hardware={hardware} compact />

      <form onSubmit={onSubmit} className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-slate-900">Car</p>
              <Link href="/rental/fleet/new" className="text-xs font-medium text-royal-800">Add car</Link>
            </div>
            <select value={carId} onChange={(event) => chooseCar(event.target.value)} className={field}>
              <option value="">Available cars</option>
              {cars.map((row) => (
                <option key={row.id} value={row.id}>{row.display_name}{row.registration_number ? ` · ${row.registration_number}` : ""}</option>
              ))}
            </select>
            {errors.car ? <p className="mt-2 text-xs text-red-600">{errors.car}</p> : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-slate-900">Customer</p>
              <Link href="/rental/customers/new" className="text-xs font-medium text-royal-800">Add customer</Link>
            </div>
            <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className={field}>
              <option value="">Customers</option>
              {customers.map((row) => (
                <option key={row.id} value={row.id}>{row.name}{row.phone ? ` · ${row.phone}` : ""}</option>
              ))}
            </select>
            {customer ? <p className="mt-2 text-xs text-slate-500">{[customer.cnic && `CNIC ${customer.cnic}`, customer.address].filter(Boolean).join(" · ") || "No CNIC or address saved."}</p> : null}
            {errors.customer ? <p className="mt-2 text-xs text-red-600">{errors.customer}</p> : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 font-semibold text-slate-900">Rental</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Start<input type="date" value={start} onChange={(event) => setStart(event.target.value)} className={field} /></label>
              <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Return<input type="date" value={end} onChange={(event) => setEnd(event.target.value)} className={field} /></label>
              <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Daily rate<input inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} className={field} /></label>
              <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Payment
                <select value={method} onChange={(event) => setMethod(event.target.value)} className={field}>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank transfer</option>
                  <option value="card">Card</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">Easypaisa</option>
                </select>
              </label>
              <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Deposit<input inputMode="decimal" value={deposit} onChange={(event) => setDeposit(event.target.value)} className={field} /></label>
              <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Received<input inputMode="decimal" value={received} onChange={(event) => setReceived(event.target.value)} className={field} /></label>
            </div>
            {errors.start_date || errors.end_date ? <p className="mt-2 text-xs text-red-600">{errors.end_date || errors.start_date}</p> : null}
            <label className="mt-3 block space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Notes
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className={field} />
            </label>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Slip</p>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Days" value={String(days)} />
            <Row label="Rent" value={money(total)} />
            <Row label="Deposit" value={money(Number(deposit || 0))} />
            <Row label="Received" value={money(Number(received || 0))} />
            <Row label="Balance" value={money(Math.max(0, total - Number(received || 0)))} strong />
          </div>
          <label className="mt-5 flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={printSlip} onChange={(event) => setPrintSlip(event.target.checked)} className="mt-0.5" />
            <span>Print slip after this rental. Photo, customer signature, and dealer signature are taken on the invoice.</span>
          </label>
          {errors.form || errors.detail ? <p className="mt-3 text-sm text-red-600">{errors.form || errors.detail}</p> : null}
          {savedNote ? <p className="mt-3 text-sm text-royal-800">{savedNote}</p> : null}
          <button type="button" disabled={!car || !customer} onClick={() => setPreview(draft())} className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-40">
            Preview invoice
          </button>
          <button type="submit" disabled={pending} className="mt-2 w-full rounded-xl bg-royal-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
            {pending ? "Saving…" : printSlip ? "Complete rental & print invoice" : "Complete rental"}
          </button>
        </aside>
      </form>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? "font-display text-lg font-semibold text-slate-900" : "font-medium text-slate-900"}>{value}</span>
    </div>
  );
}
