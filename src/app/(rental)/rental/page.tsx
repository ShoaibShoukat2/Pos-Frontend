"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { KeyRound, Printer, Share2 } from "lucide-react";

import { RentalInvoice } from "@/components/rental/RentalInvoice";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { invoiceFromRental, rentalMessage, whatsAppLink, type RentalInvoiceData } from "@/lib/rental";

type RentalRow = {
  id: string;
  invoice_number: string;
  car: string;
  registration_number: string;
  customer: string;
  phone: string;
  cnic: string;
  start_date: string;
  end_date: string;
  days: number;
  daily_rate: string;
  total_amount: string;
  deposit: string;
  received_amount: string;
  balance: string;
  payment_method: string;
  status: string;
  signed: boolean;
};

type FleetRow = {
  id: string;
  name: string;
  registration_number: string;
  color: string;
  daily_rate: string;
  status: string;
};

type Dashboard = {
  cars_total: number;
  available: number;
  rented: number;
  maintenance: number;
  active_count: number;
  due_today: number;
  overdue: number;
  month_revenue: string;
  deposits_held: string;
  outstanding: string;
  rentals: RentalRow[];
  fleet: FleetRow[];
};

const STATUS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  due_today: "bg-amber-50 text-amber-700",
  overdue: "bg-red-50 text-red-700",
  completed: "bg-slate-100 text-slate-500",
  available: "bg-emerald-50 text-emerald-700",
  rented: "bg-sky-50 text-sky-700",
  maintenance: "bg-amber-50 text-amber-700",
};

function money(value: string | number) {
  return `Rs ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function label(status: string) {
  if (status === "due_today") return "Due today";
  if (status === "overdue") return "Overdue";
  return status.replace("_", " ");
}

export default function RentalDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState<RentalInvoiceData | null>(null);
  const [autoPrint, setAutoPrint] = useState(false);
  const [printingId, setPrintingId] = useState("");
  const [shareId, setShareId] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(() => {
    api<Dashboard>("/api/rental/dashboard/")
      .then((row) => {
        setData(row);
        setError("");
      })
      .catch(() => setError("Rental details could not be loaded. Check that this business is signed in on the updated server."));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openInvoice(id: string, print: boolean) {
    if (print) setPrintingId(id);
    const started = Date.now();
    try {
      const row = await api<Parameters<typeof invoiceFromRental>[0]>(`/api/rental/rentals/${id}/`);
      if (print) {
        const wait = Math.max(0, 1100 - (Date.now() - started));
        await new Promise((resolve) => window.setTimeout(resolve, wait));
      }
      setAutoPrint(print);
      setInvoice(invoiceFromRental(row, { name: user?.business_name, cashier: user?.full_name }));
    } catch {
      setError(print ? "Could not print this invoice." : "Could not open this rental invoice.");
    } finally {
      setPrintingId("");
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setToast("Link copied");
    window.setTimeout(() => setToast(""), 2200);
  }

  function shareRow(id: string) {
    setShareId((current) => (current === id ? "" : id));
    setToast("Copy the WhatsApp link");
    window.setTimeout(() => setToast((current) => (current === "Copy the WhatsApp link" ? "" : current)), 2400);
  }

  async function markReturned(id: string) {
    if (!window.confirm("Mark this car as returned and available again?")) return;
    try {
      await api(`/api/rental/rentals/${id}/complete/`, { method: "POST" });
      load();
    } catch {
      setError("Could not close this rental.");
    }
  }

  const stats = data
    ? [
        ["Fleet", data.cars_total],
        ["Available", data.available],
        ["On rent", data.rented],
        ["Due today", data.due_today],
        ["Overdue", data.overdue],
        ["This month", money(data.month_revenue)],
        ["Deposits held", money(data.deposits_held)],
        ["Outstanding", money(data.outstanding)],
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {invoice ? <RentalInvoice data={invoice} autoPrint={autoPrint} onClose={() => { setInvoice(null); setAutoPrint(false); }} /> : null}
      {toast ? <TopNotice text={toast} /> : null}
      {printingId ? <PrintBanner /> : null}
      <style>{RENTAL_MOTION}</style>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Rent a Car</p>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-400">Live rentals, fleet, balances, and return dates.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/rental/terms" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
            شرائط
          </Link>
          <Link href="/rental/counter" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white">
            <KeyRound size={15} /> New rental
          </Link>
        </div>
      </div>

      {error ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(stats.length ? stats : [["Fleet", "—"], ["Available", "—"], ["On rent", "—"], ["Outstanding", "—"]]).map(([name, value]) => (
          <div key={name} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{name}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Rentals</h2>
          <p className="text-xs text-slate-400">{data?.active_count ?? 0} active</p>
        </div>
        {!data ? (
          <p className="p-6 text-sm text-slate-400">Loading rental details…</p>
        ) : data.rentals.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No rentals yet. Start one from the rent counter.</p>
        ) : (
          <>
            <div className="space-y-3 p-3 lg:hidden">
              {data.rentals.map((row) => {
                const wa = whatsAppLink(row.phone, rentalMessage({ ...row, shop: user?.business_name }));
                const open = row.status !== "completed";
                return (
                  <article key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <RentalActions
                      wa={wa}
                      printing={printingId === row.id}
                      shareOpen={shareId === row.id}
                      onPrint={() => openInvoice(row.id, true)}
                      onShare={() => wa && shareRow(row.id)}
                      onCopy={() => wa && copyLink(wa)}
                    />
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{row.car}</p>
                        <p className="text-xs text-slate-500">{row.customer}{row.phone ? ` · ${row.phone}` : ""}</p>
                        <p className="mt-1 text-xs text-slate-400">{row.invoice_number || "—"} · {row.start_date} → {row.end_date}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS[row.status] || STATUS.completed}`}>{label(row.status)}</span>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <Detail label="CNIC" value={row.cnic || "—"} />
                      <Detail label="Days" value={String(row.days)} />
                      <Detail label="Rate" value={money(row.daily_rate)} />
                      <Detail label="Total" value={money(row.total_amount)} />
                      <Detail label="Deposit" value={money(row.deposit)} />
                      <Detail label="Received" value={money(row.received_amount)} />
                      <Detail label="Balance" value={Number(row.balance) > 0 ? money(row.balance) : "Cleared"} />
                      <Detail label="Signed" value={row.signed ? "Yes" : "No"} />
                    </dl>
                    <div className="mt-3 flex gap-3 text-xs font-medium">
                      <button type="button" onClick={() => openInvoice(row.id, false)} className="text-emerald-700">Preview</button>
                      {open ? <button type="button" onClick={() => markReturned(row.id)} className="text-slate-500">Return</button> : null}
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1180px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    {["Invoice", "Car", "Customer", "Phone", "CNIC", "Dates", "Days", "Rate", "Total", "Deposit", "Received", "Balance", "Status", ""].map((head) => (
                      <th key={head || "actions"} className="px-4 py-3 font-semibold">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.rentals.map((row) => {
                    const wa = whatsAppLink(row.phone, rentalMessage({ ...row, shop: user?.business_name }));
                    const open = row.status !== "completed";
                    return (
                      <tr key={row.id} className="align-top hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.invoice_number || "—"}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{row.car}</p>
                          <p className="text-xs text-slate-400">{row.registration_number || "No registration"}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{row.customer}</td>
                        <td className="px-4 py-3 text-slate-600">{row.phone || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{row.cnic || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{row.start_date}<br />{row.end_date}</td>
                        <td className="px-4 py-3">{row.days}</td>
                        <td className="px-4 py-3">{money(row.daily_rate)}</td>
                        <td className="px-4 py-3">{money(row.total_amount)}</td>
                        <td className="px-4 py-3">{money(row.deposit)}</td>
                        <td className="px-4 py-3">{money(row.received_amount)}</td>
                        <td className="px-4 py-3 font-medium">{Number(row.balance) > 0 ? money(row.balance) : "Cleared"}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS[row.status] || STATUS.completed}`}>{label(row.status)}</span>
                          <p className="mt-1 text-[11px] text-slate-400">{row.signed ? "Signed" : "Not signed"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <RentalActions
                            wa={wa}
                            printing={printingId === row.id}
                            shareOpen={shareId === row.id}
                            onPrint={() => openInvoice(row.id, true)}
                            onShare={() => wa && shareRow(row.id)}
                            onCopy={() => wa && copyLink(wa)}
                          />
                          <div className="mt-2 flex gap-3 text-xs font-medium">
                            <button type="button" onClick={() => openInvoice(row.id, false)} className="text-emerald-700">Preview</button>
                            {open ? <button type="button" onClick={() => markReturned(row.id)} className="text-slate-500">Return</button> : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Fleet</h2>
          <Link href="/rental/fleet" className="text-xs font-medium text-emerald-700">Manage fleet</Link>
        </div>
        {!data || data.fleet.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No cars in the fleet yet.</p>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.fleet.map((car) => (
              <div key={car.id} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{car.name}</p>
                    <p className="text-xs text-slate-400">{car.registration_number || "No registration"}{car.color ? ` · ${car.color}` : ""}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS[car.status] || STATUS.completed}`}>{car.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{money(car.daily_rate)} / day</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RentalActions({
  wa,
  printing,
  shareOpen,
  onPrint,
  onShare,
  onCopy,
}: {
  wa: string;
  printing: boolean;
  shareOpen: boolean;
  onPrint: () => void;
  onShare: () => void;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={printing} onClick={onPrint} className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white disabled:opacity-80">
          {printing ? <FillRing /> : <Printer size={16} />}
          Print invoice
        </button>
        <button type="button" disabled={!wa} onClick={onShare} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white disabled:opacity-40">
          <Share2 size={16} />
          WhatsApp share
        </button>
      </div>
      {shareOpen && wa ? (
        <div className="rental-drop mt-2 rounded-xl border border-emerald-200 bg-white p-3">
          <p className="text-xs font-semibold text-emerald-800">Copy link</p>
          <p className="mt-1 truncate text-[11px] text-slate-500">{wa}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onCopy} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Copy link</button>
            <a href={wa} target="_blank" rel="noreferrer" className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800">Open WhatsApp</a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function FillRing() {
  return (
    <svg viewBox="0 0 36 36" className="h-5 w-5 shrink-0" aria-hidden>
      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="3.5" />
      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="88" className="rental-ring" />
    </svg>
  );
}

function TopNotice({ text }: { text: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center px-4 pt-3">
      <div className="rental-drop rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">{text}</div>
    </div>
  );
}

function PrintBanner() {
  return (
    <div className="rental-drop fixed inset-x-0 top-0 z-[91] bg-white shadow-lg">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-emerald-700"><FillRing /></span>
        <div>
          <p className="text-sm font-semibold text-slate-900">Printing invoice</p>
          <p className="text-xs text-slate-500">Filling the slip</p>
        </div>
      </div>
      <div className="h-1 bg-emerald-100">
        <div className="rental-bar h-full bg-emerald-600" />
      </div>
    </div>
  );
}

const RENTAL_MOTION = `
@keyframes rental-drop {
  from { transform: translateY(-18px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.rental-drop { animation: rental-drop 0.35s ease; }
@keyframes rental-spin-fill {
  from { stroke-dashoffset: 88; transform: rotate(0deg); }
  to { stroke-dashoffset: 0; transform: rotate(360deg); }
}
.rental-ring {
  transform-origin: center;
  transform-box: fill-box;
  animation: rental-spin-fill 0.9s ease-in-out infinite;
}
@keyframes rental-bar {
  from { width: 0; }
  to { width: 100%; }
}
.rental-bar { animation: rental-bar 1.1s ease-in-out infinite; }
`;
