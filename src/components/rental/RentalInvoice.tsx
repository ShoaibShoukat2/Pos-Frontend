"use client";

import { useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { ContractEvidence, type ContractEvidenceValues } from "@/components/contract/ContractEvidence";
import { ApiError, api, apiBase, fieldErrors } from "@/lib/api";
import { listOsPrinters, printToConnectedPrinter, rememberPrinter, savedPrinterName, type OsPrinter } from "@/lib/desktopPrint";
import { useHardware } from "@/lib/hardware";
import { TermsDocument } from "@/components/rental/TermsDocument";
import { rentalMessage, whatsAppLink, type RentalInvoiceData } from "@/lib/rental";
import { blankTerms, type TermsSheetData } from "@/lib/rentalTerms";
import { readShowroomPaper, saveShowroomPaper, type ShowroomPaper } from "@/lib/showroomInvoice";

function rs(v: number) {
  return `Rs ${v.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

const METHOD: Record<string, string> = {
  cash: "Cash", bank: "Bank Transfer", card: "Card", jazzcash: "JazzCash", easypaisa: "Easypaisa",
};

export function RentalInvoice({
  data,
  onClose,
  layout = "modal",
  autoPrint = false,
}: {
  data: RentalInvoiceData;
  onClose?: () => void;
  layout?: "modal" | "preview";
  autoPrint?: boolean;
}) {
  const hardware = useHardware();
  const preview = layout === "preview";
  const [evidence, setEvidence] = useState<ContractEvidenceValues>({
    ownerSignature: data.dealer_signature || "",
    partySignature: data.customer_signature || "",
    guarantorSignature: data.guarantor_signature || "",
    partyPhoto: data.customer_photo || "",
    cnicFront: data.cnic_front || "",
    cnicBack: data.cnic_back || "",
    partyThumb: data.customer_thumbprint || "",
    guarantorThumb: data.guarantor_thumbprint || "",
  });
  const [terms, setTerms] = useState({
    end_date: data.end_date,
    days: data.days,
    total_amount: data.total_amount,
    received_amount: data.received_amount,
    balance: data.balance,
    closed: data.status === "completed",
  });
  const [extendDate, setExtendDate] = useState(data.end_date);
  const [payAmount, setPayAmount] = useState("");
  const [action, setAction] = useState<"" | "extend" | "pay">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [paper, setPaper] = useState<ShowroomPaper>("a4");
  const [includeTerms, setIncludeTerms] = useState(true);
  const [printers, setPrinters] = useState<OsPrinter[] | null>(null);
  const [printerName, setPrinterName] = useState("");
  const [shop, setShop] = useState({ phone: "", address: "", logo: "" });
  const [termsSheet, setTermsSheet] = useState<TermsSheetData>(blankTerms(data.shop_name));

  useEffect(() => { setPaper(readShowroomPaper()); }, []);

  useEffect(() => {
    api<TermsSheetData>("/api/rental/terms/")
      .then((row) => setTermsSheet(row.title ? row : { ...row, title: data.shop_name }))
      .catch(() => setTermsSheet(blankTerms(data.shop_name)));
  }, [data.shop_name]);

  useEffect(() => {
    api<{ phone?: string; address?: string; city?: string; logo?: string | null }>("/api/business/")
      .then((biz) => {
        const logo = biz.logo ? (biz.logo.startsWith("http") ? biz.logo : `${apiBase()}${biz.logo}`) : "";
        setShop({ phone: biz.phone || "", address: [biz.address, biz.city].filter(Boolean).join(", "), logo });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      const rows = await listOsPrinters();
      if (!alive || rows === null) return;
      setPrinters(rows);
      const saved = savedPrinterName();
      setPrinterName(rows.find((row) => row.name === saved)?.name || rows.find((row) => row.isDefault)?.name || rows[0]?.name || "");
    }
    load();
    return () => { alive = false; };
  }, []);

  const desktop = typeof window !== "undefined" && Boolean(window.electronAPI?.printPage);
  const activePrinter = desktop
    ? (printers?.find((row) => row.name === printerName)?.name || "")
    : (hardware.printer.connected ? hardware.printer.name : "");
  const printerReady = desktop ? Boolean(activePrinter) : true;

  function choosePaper(next: ShowroomPaper) {
    setPaper(next);
    saveShowroomPaper(next);
  }

  async function printInvoice() {
    setNote("");
    document.body.setAttribute("data-car-print-size", paper);
    document.body.classList.add("printing-car-invoice");
    const cleanup = () => {
      document.body.classList.remove("printing-car-invoice");
      document.body.removeAttribute("data-car-print-size");
    };
    await new Promise((resolve) => window.setTimeout(resolve, 80));
    try {
      if (window.electronAPI?.printPage) {
        const fresh = (await listOsPrinters()) || [];
        const chosen = fresh.find((row) => row.name === printerName) || fresh.find((row) => row.isDefault) || fresh[0];
        if (!chosen) {
          setNote("Printer is not connected. Plug it in, turn it on, then print again.");
          cleanup();
          return;
        }
        const result = await printToConnectedPrinter(paper, chosen.name);
        if (result?.success) {
          rememberPrinter(result.printer || chosen.name);
          setNote(`Invoice sent to ${result.printer || chosen.name}.`);
        } else setNote(result?.reason || "The printer did not accept the invoice.");
        cleanup();
        return;
      }
      window.addEventListener("afterprint", cleanup, { once: true });
      window.print();
      window.setTimeout(cleanup, 1500);
    } catch {
      cleanup();
      setNote("Could not print. Check the printer and try again.");
    }
  }

  const printRef = useRef(printInvoice);
  printRef.current = printInvoice;
  const autoPrinted = useRef(false);
  useEffect(() => {
    if (!autoPrint || preview || autoPrinted.current) return;
    autoPrinted.current = true;
    const timer = window.setTimeout(() => { void printRef.current(); }, 700);
    return () => window.clearTimeout(timer);
  }, [autoPrint, preview]);

  function setEvidenceField(key: keyof ContractEvidenceValues, value: string) {
    setEvidence((current) => ({ ...current, [key]: value }));
  }

  function applySaved(saved: Parameters<typeof import("@/lib/rental").invoiceFromRental>[0] & { status?: string }) {
    const nextEnd = saved.end_date || terms.end_date;
    const start = new Date(`${saved.start_date || data.start_date}T00:00:00`);
    const end = new Date(`${nextEnd}T00:00:00`);
    const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
    setTerms({
      end_date: nextEnd,
      days: saved.days || Math.max(1, diff || 1),
      total_amount: Number(saved.total_amount || 0),
      received_amount: Number(saved.received_amount || 0),
      balance: Number(saved.balance || 0),
      closed: saved.status === "completed",
    });
    setExtendDate(nextEnd);
  }

  async function saveEvidence(thenPrint: boolean) {
    const payload = {
      dealer_signature: evidence.ownerSignature,
      customer_signature: evidence.partySignature,
      guarantor_signature: evidence.guarantorSignature,
      customer_photo: evidence.partyPhoto,
      cnic_front: evidence.cnicFront,
      cnic_back: evidence.cnicBack,
      customer_thumbprint: evidence.partyThumb,
      guarantor_thumbprint: evidence.guarantorThumb,
    };
    if (data.rental_id && Object.values(payload).some(Boolean)) {
      setSaving(true);
      setError("");
      try {
        const saved = await api<{ customer_photo?: string }>(`/api/rental/rentals/${data.rental_id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        if (payload.customer_photo && !saved.customer_photo) {
          setError("The photo was not stored. Update the server, then save again.");
          setSaving(false);
          return;
        }
      } catch {
        setError("Signatures or photos could not be saved.");
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    if (thenPrint) window.setTimeout(() => { void printInvoice(); }, 200);
  }

  async function runAction(path: string, body?: Record<string, string>) {
    if (!data.rental_id) return;
    setSaving(true);
    setError("");
    try {
      const saved = await api<Parameters<typeof applySaved>[0]>(`/api/rental/rentals/${data.rental_id}/${path}/`, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
      applySaved(saved);
      setAction("");
      setPayAmount("");
    } catch (err) {
      const fields = err instanceof ApiError ? fieldErrors(err.body) : {};
      setError(fields.detail || fields.amount || fields.end_date || "Could not update this rental.");
    } finally {
      setSaving(false);
    }
  }

  const wa = whatsAppLink(data.customer_phone || "", rentalMessage({
    shop: data.shop_name,
    invoice_number: data.invoice_number,
    car: data.car_name,
    registration_number: data.registration_number,
    customer: data.customer_name,
    start_date: data.start_date,
    end_date: terms.end_date,
    days: terms.days,
    daily_rate: data.daily_rate,
    total_amount: terms.total_amount,
    deposit: data.deposit,
    received_amount: terms.received_amount,
    balance: terms.balance,
  }));

  return (
    <div className={preview ? "w-full" : "fixed inset-0 z-[80] overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm"}>
      <div className={preview ? "w-full" : "mx-auto w-full max-w-3xl"}>
        <div className="invoice-no-print mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-royal-800">{preview ? "Preview" : "Rental invoice"}</p>
              <p className="font-medium text-slate-900">{data.invoice_number}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button type="button" onClick={() => choosePaper("a4")} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${paper === "a4" ? "bg-white shadow-sm" : "text-slate-400"}`}>A4</button>
                <button type="button" onClick={() => choosePaper("80mm")} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${paper === "80mm" ? "bg-white shadow-sm" : "text-slate-400"}`}>80mm</button>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">
                <input type="checkbox" checked={includeTerms} onChange={(event) => setIncludeTerms(event.target.checked)} className="h-3.5 w-3.5 accent-royal-800" />
                شرائط
              </label>
              {wa ? (
                <a href={wa} target="_blank" rel="noreferrer" className="rounded-xl border border-royal-200 bg-royal-50 px-3 py-2 text-sm font-medium text-royal-900">WhatsApp</a>
              ) : null}
              <button
                type="button"
                onClick={() => (preview || !data.rental_id ? void printInvoice() : saveEvidence(true))}
                disabled={saving || !printerReady}
                className="flex items-center gap-2 rounded-xl bg-royal-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
              >
                <Printer size={15} />
                {saving ? "Saving…" : "Print contract"}
              </button>
              {onClose ? <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">Close</button> : null}
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            A4 page / Save as PDF. {activePrinter ? `Printer connected: ${activePrinter}` : desktop ? "Printer not connected" : "Print uses the connected printer."}
            {includeTerms && paper === "80mm" ? " Terms sheet prints on A4." : ""}
            {note ? ` ${note}` : ""}
          </p>
        </div>

        <div id="car-invoice-print-root" className={`rounded-2xl border border-slate-200 bg-white shadow-lg ${paper === "80mm" ? "car-invoice-80mm" : "car-invoice-a4"}`}>
          <div className="border-b-2 border-slate-900 px-8 py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {shop.logo ? <img src={shop.logo} alt="" className="h-14 w-14 rounded-lg object-cover" /> : null}
                <div>
                  <h1 className="font-display text-3xl font-bold">{data.shop_name}</h1>
                  {shop.address ? <p className="text-sm text-slate-500">{shop.address}</p> : null}
                  {shop.phone ? <p className="text-sm text-slate-500">Tel: {shop.phone}</p> : null}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Rental agreement</p>
                <p className="font-display text-2xl font-bold">{data.invoice_number}</p>
                <p className="text-sm text-slate-500">{data.start_date} → {terms.end_date}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-0 border-b border-slate-200">
            <div className="border-r border-slate-200 px-8 py-5 text-sm">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Customer</p>
              <p className="font-medium">{data.customer_name}</p>
              {data.customer_phone ? <p className="text-slate-500">{data.customer_phone}</p> : null}
              {data.customer_cnic ? <p className="text-slate-500">CNIC {data.customer_cnic}</p> : null}
              {data.customer_address ? <p className="text-slate-500">{data.customer_address}</p> : null}
            </div>
            <div className="px-8 py-5 text-sm">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Vehicle</p>
              <p className="font-medium">{data.car_name}</p>
              {data.registration_number ? <p className="text-slate-500">Reg. {data.registration_number}</p> : null}
              <p className="text-slate-500">{terms.days} day{terms.days === 1 ? "" : "s"} · {rs(data.daily_rate)} / day</p>
            </div>
          </div>
          <div className="px-8 py-6 text-sm">
            <table className="w-full">
              <tbody className="divide-y divide-slate-100">
                <tr><td className="py-2 text-slate-500">Rent total</td><td className="py-2 text-right font-medium">{rs(terms.total_amount)}</td></tr>
                <tr><td className="py-2 text-slate-500">Security deposit</td><td className="py-2 text-right font-medium">{rs(data.deposit)}</td></tr>
                <tr><td className="py-2 text-slate-500">Paid ({METHOD[data.payment_method] || data.payment_method})</td><td className="py-2 text-right font-medium text-royal-800">{rs(terms.received_amount)}</td></tr>
                <tr><td className="py-2 font-semibold">Balance</td><td className={`py-2 text-right font-display text-lg font-bold ${terms.balance > 0 ? "text-red-600" : ""}`}>{terms.balance > 0 ? rs(terms.balance) : "Cleared"}</td></tr>
              </tbody>
            </table>
            {data.notes ? <p className="mt-3 text-slate-500">{data.notes}</p> : null}
          </div>
          <div className="border-t-2 border-dashed border-slate-300 px-8 py-6">
            <ContractEvidence
              partyLabel="Renter"
              values={evidence}
              onChange={setEvidenceField}
              preview={preview}
              saving={saving}
              error={error}
              onSave={preview ? undefined : () => saveEvidence(false)}
            />
            {!preview && data.rental_id && !terms.closed ? (
              <div className="invoice-no-print mt-4 space-y-2">
                <button type="button" disabled={saving} onClick={() => { if (window.confirm("Check this car in and mark it available?")) void runAction("complete"); }} className="w-full rounded-xl bg-royal-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">Check in</button>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setAction(action === "extend" ? "" : "extend")} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium">Extend</button>
                  <button type="button" onClick={() => setAction(action === "pay" ? "" : "pay")} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium">Take payment</button>
                </div>
                {action === "extend" ? (
                  <div className="flex gap-2">
                    <input type="date" value={extendDate} onChange={(event) => setExtendDate(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                    <button type="button" disabled={saving} onClick={() => runAction("extend", { end_date: extendDate })} className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">Save</button>
                  </div>
                ) : null}
                {action === "pay" ? (
                  <div className="flex gap-2">
                    <input value={payAmount} onChange={(event) => setPayAmount(event.target.value)} inputMode="decimal" placeholder="Amount" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                    <button type="button" disabled={saving || !payAmount} onClick={() => runAction("pay", { amount: payAmount })} className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">Save</button>
                  </div>
                ) : null}
              </div>
            ) : null}
            {!preview && terms.closed ? <p className="invoice-no-print mt-3 text-center text-sm text-royal-800">Car checked in.</p> : null}
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-8 py-4 text-center text-xs text-slate-400">
            Rental agreement from {data.shop_name}. {data.cashier_name ? `Prepared by ${data.cashier_name}.` : ""}
          </div>
          {includeTerms && paper === "a4" ? (
            <div className="rental-terms-sheet bg-white px-3 py-4 sm:px-6">
              <TermsDocument data={termsSheet} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

