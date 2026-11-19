"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Car, KeyRound, Pencil, Printer, ScrollText, Share2, Trash2, Wallet, X } from "lucide-react";

import { DashHeader, Donut, Panel, StatCard, StatGrid } from "@/components/dashboard/kit";
import { CarEditDialog, CarStatusDialog, RentalEditDialog, RentalUpdateDialog } from "@/components/rental/DeskDialogs";
import { RentalInvoice } from "@/components/rental/RentalInvoice";
import { TermsDocument, TermsEditor } from "@/components/rental/TermsDocument";
import { ApiError, api, fieldErrors } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { invoiceFromRental, rentalMessage, whatsAppLink, type RentalInvoiceData } from "@/lib/rental";
import { blankTerms, type TermsSheetData } from "@/lib/rentalTerms";

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

type DeskFilter = "open" | "due" | "all";

const STATUS: Record<string, string> = {
  active: "bg-royal-50 text-royal-800 ring-royal-100",
  due_today: "bg-amber-50 text-amber-800 ring-amber-100",
  overdue: "bg-red-50 text-red-700 ring-red-100",
  completed: "bg-slate-100 text-slate-500 ring-slate-200",
  available: "bg-royal-50 text-royal-800 ring-royal-100",
  rented: "bg-gold-300/40 text-royal-950 ring-gold-300",
  maintenance: "bg-amber-50 text-amber-800 ring-amber-100",
};

function money(value: string | number) {
  return `Rs ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function label(status: string) {
  if (status === "due_today") return "Due today";
  if (status === "overdue") return "Overdue";
  if (status === "rented") return "On rent";
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
  const [filter, setFilter] = useState<DeskFilter>("open");
  const [termsOpen, setTermsOpen] = useState(false);
  const [terms, setTerms] = useState<TermsSheetData | null>(null);
  const [termsDraft, setTermsDraft] = useState<TermsSheetData | null>(null);
  const [termsEditing, setTermsEditing] = useState(false);
  const [termsSaving, setTermsSaving] = useState(false);
  const [termsError, setTermsError] = useState("");
  const [desk, setDesk] = useState<
    | { kind: "rental-edit"; id: string }
    | { kind: "rental-update"; id: string; endDate: string }
    | { kind: "car-edit"; id: string }
    | { kind: "car-status"; id: string; status: string; name: string }
    | null
  >(null);

  const load = useCallback(() => {
    api<Dashboard>("/api/rental/dashboard/")
      .then((row) => {
        setData(row);
        setError("");
      })
      .catch(() => setError("Rental details could not be loaded. Check that this business is signed in on the updated server."));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api<TermsSheetData>("/api/rental/terms/")
      .then((row) => setTerms(row))
      .catch(() => setTerms(blankTerms(user?.business_name || "")));
  }, [user?.business_name]);

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

  async function saveTerms() {
    if (!termsDraft) return;
    setTermsSaving(true);
    setTermsError("");
    try {
      const saved = await api<TermsSheetData>("/api/rental/terms/", {
        method: "PUT",
        body: JSON.stringify(termsDraft),
      });
      setTerms(saved);
      setTermsEditing(false);
      setToast("Terms updated");
      window.setTimeout(() => setToast(""), 2200);
    } catch (err) {
      const fields = err instanceof ApiError ? fieldErrors(err.body) : {};
      setTermsError(fields.clauses || fields.detail || "Could not update the terms.");
    } finally {
      setTermsSaving(false);
    }
  }

  async function removeRental(id: string) {
    if (!window.confirm("Delete this rental? If the car was out, it goes back to available.")) return;
    try {
      await api(`/api/rental/rentals/${id}/`, { method: "DELETE" });
      setToast("Rental deleted");
      window.setTimeout(() => setToast(""), 2200);
      load();
    } catch (err) {
      const fields = err instanceof ApiError ? fieldErrors(err.body) : {};
      setError(fields.detail || "Could not delete this rental.");
    }
  }

  async function removeCar(id: string, name: string) {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await api(`/api/rental/rental-cars/${id}/`, { method: "DELETE" });
      setToast("Car deleted");
      window.setTimeout(() => setToast(""), 2200);
      load();
    } catch (err) {
      const fields = err instanceof ApiError ? fieldErrors(err.body) : {};
      setError(fields.detail || "Could not delete this car.");
    }
  }

  function savedDesk() {
    setDesk(null);
    setToast("Saved");
    window.setTimeout(() => setToast(""), 2200);
    load();
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

  const sheet = terms || blankTerms(user?.business_name || "");

  const rentals = useMemo(() => {
    const rows = data?.rentals || [];
    if (filter === "due") return rows.filter((row) => row.status === "due_today" || row.status === "overdue");
    if (filter === "all") return rows;
    return rows.filter((row) => row.status !== "completed");
  }, [data, filter]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      {invoice ? <RentalInvoice data={invoice} autoPrint={autoPrint} onClose={() => { setInvoice(null); setAutoPrint(false); }} /> : null}
      {termsOpen ? <TermsSheet data={sheet} onClose={() => setTermsOpen(false)} /> : null}
      {desk?.kind === "rental-edit" ? <RentalEditDialog id={desk.id} onClose={() => setDesk(null)} onSaved={savedDesk} /> : null}
      {desk?.kind === "rental-update" ? <RentalUpdateDialog id={desk.id} endDate={desk.endDate} onClose={() => setDesk(null)} onSaved={savedDesk} /> : null}
      {desk?.kind === "car-edit" ? <CarEditDialog id={desk.id} onClose={() => setDesk(null)} onSaved={savedDesk} /> : null}
      {desk?.kind === "car-status" ? <CarStatusDialog id={desk.id} status={desk.status} name={desk.name} onClose={() => setDesk(null)} onSaved={savedDesk} /> : null}
      {toast ? <TopNotice text={toast} /> : null}
      {printingId ? <PrintBanner /> : null}
      <style>{RENTAL_MOTION}</style>

      <DashHeader name={user?.full_name?.split(" ")[0] || user?.business_name || ""} subtitle="Cars out, return dates, and money still open.">
        <button type="button" onClick={() => setTermsOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-royal-200 bg-white px-3 py-2.5 text-sm font-semibold text-royal-900">
          <ScrollText size={15} />
          Owner terms
        </button>
        <Link href="/rental/counter" className="inline-flex items-center justify-center gap-2 rounded-xl bg-royal-900 px-3 py-2.5 text-sm font-semibold text-white">
          <KeyRound size={15} />
          New rental
        </Link>
      </DashHeader>

      {error ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}

      {data && (data.due_today > 0 || data.overdue > 0) ? (
        <div className="flex flex-wrap gap-2">
          {data.overdue > 0 ? (
            <button type="button" onClick={() => setFilter("due")} className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              {data.overdue} overdue return{data.overdue === 1 ? "" : "s"}
            </button>
          ) : null}
          {data.due_today > 0 ? (
            <button type="button" onClick={() => setFilter("due")} className="rounded-full bg-gold-300/50 px-3 py-1 text-xs font-semibold text-royal-950">
              {data.due_today} due back today
            </button>
          ) : null}
        </div>
      ) : null}

      <StatGrid>
        <StatCard icon={Wallet} tone="hero" label="This month" value={data ? money(data.month_revenue) : "—"} hint={`${data?.active_count ?? 0} on the road`} />
        <StatCard icon={Car} label="Available" value={data ? String(data.available) : "—"} hint={`${data?.cars_total ?? 0} in fleet`} href="/rental/fleet" />
        <StatCard icon={KeyRound} label="On rent" value={data ? String(data.rented) : "—"} hint={`${data?.due_today ?? 0} due today`} />
        <StatCard icon={ScrollText} label="Outstanding" value={data ? money(data.outstanding) : "—"} hint={data ? money(data.deposits_held) + " deposits" : "Deposits"} />
      </StatGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)]">
        <Panel title="Fleet status">
          <Donut
            center={String(data?.cars_total ?? 0)}
            caption="Cars"
            parts={[
              { label: "Available", value: data?.available ?? 0 },
              { label: "On rent", value: data?.rented ?? 0 },
              { label: "Workshop", value: data?.maintenance ?? 0 },
            ]}
          />
        </Panel>
        <Panel title="Desk">
          <StatGrid cols="sm:grid-cols-2">
            <StatCard icon={Wallet} label="Deposits held" value={data ? money(data.deposits_held) : "—"} />
            <StatCard icon={Car} label="Due today" value={data ? String(data.due_today) : "—"} />
            <StatCard icon={KeyRound} label="Overdue" value={data ? String(data.overdue) : "—"} />
            <StatCard icon={ScrollText} label="Workshop" value={data ? String(data.maintenance) : "—"} />
          </StatGrid>
        </Panel>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-semibold text-slate-950">Rentals</h2>
            <p className="text-xs text-slate-400">{data?.active_count ?? 0} active · {rentals.length} in this view</p>
          </div>
          <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1 text-xs font-semibold sm:flex">
            {([
              ["open", "On the road"],
              ["due", "Due"],
              ["all", "All"],
            ] as const).map(([key, name]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3 py-2 ${filter === key ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        {!data ? (
          <p className="p-6 text-sm text-slate-400">{error ? "Rental list is waiting on the server." : "Loading rental details…"}</p>
        ) : rentals.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">
            {filter === "open" ? "No open rentals. Start one from the rent counter." : "Nothing in this view."}
          </p>
        ) : (
          <>
            <div className="space-y-3 p-3 lg:hidden">
              {rentals.map((row) => (
                <RentalCard
                  key={row.id}
                  row={row}
                  shop={user?.business_name}
                  printing={printingId === row.id}
                  shareOpen={shareId === row.id}
                  onPrint={() => openInvoice(row.id, true)}
                  onPreview={() => openInvoice(row.id, false)}
                  onShare={() => shareRow(row.id)}
                  onCopy={copyLink}
                  onReturn={() => markReturned(row.id)}
                  onEdit={() => setDesk({ kind: "rental-edit", id: row.id })}
                  onUpdate={() => setDesk({ kind: "rental-update", id: row.id, endDate: row.end_date })}
                  onDelete={() => removeRental(row.id)}
                />
              ))}
            </div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                  <tr>
                    {["Car", "Customer", "Dates", "Money", "Status", ""].map((head) => (
                      <th key={head || "actions"} className="px-4 py-3 font-semibold">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rentals.map((row) => {
                    const wa = whatsAppLink(row.phone, rentalMessage({ ...row, shop: user?.business_name }));
                    const open = row.status !== "completed";
                    const balance = Number(row.balance);
                    return (
                      <tr key={row.id} className="align-top hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-950">{row.car}</p>
                          <p className="text-xs text-slate-400">{row.registration_number || "No registration"} · {row.invoice_number || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{row.customer}</p>
                          <p className="text-xs text-slate-400">{row.phone || "No phone"}{row.cnic ? ` · ${row.cnic}` : ""}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <p>{row.start_date}</p>
                          <p className="text-xs text-slate-400">{row.end_date} · {row.days} day{row.days === 1 ? "" : "s"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{money(row.total_amount)}</p>
                          <p className={`text-xs ${balance > 0 ? "font-medium text-red-600" : "text-slate-400"}`}>
                            {balance > 0 ? `${money(balance)} due` : "Cleared"} · deposit {money(row.deposit)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ${STATUS[row.status] || STATUS.completed}`}>{label(row.status)}</span>
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
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
                            <button type="button" onClick={() => setDesk({ kind: "rental-edit", id: row.id })} className="text-royal-800">Edit</button>
                            {open ? <button type="button" onClick={() => setDesk({ kind: "rental-update", id: row.id, endDate: row.end_date })} className="text-royal-800">Update</button> : null}
                            <button type="button" onClick={() => removeRental(row.id)} className="text-red-600">Delete</button>
                            <button type="button" onClick={() => openInvoice(row.id, false)} className="text-slate-500">Preview</button>
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

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-royal-800">Owner terms</p>
            <h2 className="font-urdu text-2xl font-bold leading-snug text-slate-950">شرائط</h2>
            <p className="text-xs text-slate-400">{sheet.clauses.length} lines · prints after the contract</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => {
                setTermsDraft(sheet);
                setTermsError("");
                setTermsEditing(true);
              }}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800"
            >
              <Pencil size={14} />
              Edit
            </button>
            <button type="button" onClick={() => setTermsOpen(true)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white">
              <ScrollText size={14} />
              View
            </button>
            <Link href="/rental/terms" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700">
              <Printer size={14} />
              Print
            </Link>
          </div>
        </div>
        {termsEditing && termsDraft ? (
          <TermsEditor
            value={termsDraft}
            saving={termsSaving}
            error={termsError}
            onChange={setTermsDraft}
            onSave={() => { void saveTerms(); }}
            onCancel={() => { setTermsEditing(false); setTermsError(""); }}
          />
        ) : (
          <div className="max-h-[22rem] overflow-y-auto bg-slate-50 p-3 sm:max-h-[28rem] sm:p-5">
            <TermsDocument data={sheet} dense />
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="font-semibold text-slate-950">Fleet</h2>
            <p className="text-xs text-slate-400">{data?.available ?? 0} free · {data?.rented ?? 0} out</p>
          </div>
          <Link href="/rental/fleet" className="text-xs font-semibold text-royal-800">Manage</Link>
        </div>
        {!data || data.fleet.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No cars in the fleet yet.</p>
        ) : (
          <div className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
            {data.fleet.map((car) => (
              <div key={car.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-950">{car.name}</p>
                    <p className="truncate text-xs text-slate-400">{car.registration_number || "No registration"}{car.color ? ` · ${car.color}` : ""}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ring-1 ${STATUS[car.status] || STATUS.completed}`}>{label(car.status)}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-700">{money(car.daily_rate)} <span className="font-normal text-slate-400">/ day</span></p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setDesk({ kind: "car-edit", id: car.id })} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800">
                    <Pencil size={13} /> Edit
                  </button>
                  <button type="button" onClick={() => setDesk({ kind: "car-status", id: car.id, status: car.status, name: car.name })} className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-royal-800">
                    Update
                  </button>
                  <button type="button" onClick={() => removeCar(car.id, car.name)} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-red-200 bg-white text-xs font-semibold text-red-700">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RentalCard({
  row,
  shop,
  printing,
  shareOpen,
  onPrint,
  onPreview,
  onShare,
  onCopy,
  onReturn,
  onEdit,
  onUpdate,
  onDelete,
}: {
  row: RentalRow;
  shop?: string;
  printing: boolean;
  shareOpen: boolean;
  onPrint: () => void;
  onPreview: () => void;
  onShare: () => void;
  onCopy: (url: string) => void;
  onReturn: () => void;
  onEdit: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}) {
  const wa = whatsAppLink(row.phone, rentalMessage({ ...row, shop }));
  const open = row.status !== "completed";
  const balance = Number(row.balance);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-950">{row.car}</p>
          <p className="truncate text-xs text-slate-400">{row.registration_number || "No registration"}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ring-1 ${STATUS[row.status] || STATUS.completed}`}>{label(row.status)}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-slate-800">{row.customer}</p>
      <p className="truncate text-xs text-slate-400">{row.phone || "No phone"}{row.cnic ? ` · ${row.cnic}` : ""}</p>
      <p className="mt-1 text-xs text-slate-500">{row.start_date} → {row.end_date} · {row.days} day{row.days === 1 ? "" : "s"}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3">
        <Money label="Total" value={money(row.total_amount)} />
        <Money label="Received" value={money(row.received_amount)} />
        <Money label="Deposit" value={money(row.deposit)} />
        <Money label="Balance" value={balance > 0 ? money(balance) : "Cleared"} emphasis={balance > 0} />
      </dl>
      <div className="mt-3">
        <RentalActions wa={wa} printing={printing} shareOpen={shareOpen} onPrint={onPrint} onShare={() => wa && onShare()} onCopy={() => wa && onCopy(wa)} />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <button type="button" onClick={onEdit} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800">
          <Pencil size={13} /> Edit
        </button>
        {open ? (
          <button type="button" onClick={onUpdate} className="inline-flex h-9 items-center justify-center rounded-xl border border-royal-200 text-xs font-semibold text-royal-800">
            Update
          </button>
        ) : <span />}
        <button type="button" onClick={onDelete} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-red-200 text-xs font-semibold text-red-700">
          <Trash2 size={13} /> Delete
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-slate-400">{row.invoice_number || "—"} · {row.signed ? "Signed" : "Not signed"}</span>
        <span className="flex gap-3 font-medium">
          <button type="button" onClick={onPreview} className="text-royal-800">Preview</button>
          {open ? <button type="button" onClick={onReturn} className="text-slate-500">Return</button> : null}
        </span>
      </div>
    </article>
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
        <button type="button" disabled={printing} onClick={onPrint} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white disabled:opacity-80">
          {printing ? <FillRing /> : <Printer size={15} />}
          Print
        </button>
        <button type="button" disabled={!wa} onClick={onShare} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-royal-800 px-3 text-sm font-semibold text-white disabled:opacity-40">
          <Share2 size={15} />
          WhatsApp
        </button>
      </div>
      {shareOpen && wa ? (
        <div className="rental-drop mt-2 rounded-xl border border-royal-200 bg-royal-50 p-3">
          <p className="text-xs font-semibold text-royal-900">Copy link</p>
          <p className="mt-1 break-all text-[11px] text-slate-500">{wa}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={onCopy} className="rounded-lg bg-royal-900 px-3 py-2 text-xs font-semibold text-white">Copy link</button>
            <a href={wa} target="_blank" rel="noreferrer" className="rounded-lg border border-royal-200 bg-white px-3 py-2 text-xs font-semibold text-royal-900">Open WhatsApp</a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TermsSheet({ data, onClose }: { data: TermsSheetData; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-3 text-white">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-300">Owner terms</p>
            <h2 className="font-urdu text-2xl font-bold">شرائط</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/rental/terms" className="hidden rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-900 sm:inline-flex">Print sheet</Link>
            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white" aria-label="Close terms">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-slate-50 p-2 sm:p-4">
          <TermsDocument data={data} />
        </div>
        <Link href="/rental/terms" className="mt-3 inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 sm:hidden">
          Print sheet
        </Link>
      </div>
    </div>
  );
}

function Money({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`truncate text-sm font-semibold ${emphasis ? "text-red-600" : "text-slate-900"}`}>{value}</dd>
    </div>
  );
}

function FillRing() {
  return (
    <svg viewBox="0 0 36 36" className="h-4 w-4 shrink-0" aria-hidden>
      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="3.5" />
      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="88" className="rental-ring" />
    </svg>
  );
}

function TopNotice({ text }: { text: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center px-4 pt-3">
      <div className="rental-drop rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-xl">{text}</div>
    </div>
  );
}

function PrintBanner() {
  return (
    <div className="rental-drop fixed inset-x-0 top-0 z-[91] bg-white shadow-lg">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-royal-800"><FillRing /></span>
        <div>
          <p className="text-sm font-semibold text-slate-900">Printing invoice</p>
          <p className="text-xs text-slate-500">Filling the slip</p>
        </div>
      </div>
      <div className="h-1 bg-royal-100">
        <div className="rental-bar h-full bg-royal-800" />
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
