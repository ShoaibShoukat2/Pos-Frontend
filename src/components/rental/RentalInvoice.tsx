"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { ImageCapture } from "@/components/showroom/ImageCapture";
import { SignaturePad } from "@/components/showroom/SignaturePad";
import { api, apiBase } from "@/lib/api";
import { listOsPrinters, printToConnectedPrinter, rememberPrinter, savedPrinterName, type OsPrinter } from "@/lib/desktopPrint";
import { useHardware } from "@/lib/hardware";
import { rentalMessage, whatsAppLink, type RentalInvoiceData } from "@/lib/rental";
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
}: {
  data: RentalInvoiceData;
  onClose?: () => void;
  layout?: "modal" | "preview";
}) {
  const hardware = useHardware();
  const preview = layout === "preview";
  const [photo, setPhoto] = useState(data.customer_photo || "");
  const [customerSig, setCustomerSig] = useState(data.customer_signature || "");
  const [dealerSig, setDealerSig] = useState(data.dealer_signature || "");
  const [done, setDone] = useState(Boolean(data.customer_photo && (data.customer_signature || data.dealer_signature)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [paper, setPaper] = useState<ShowroomPaper>("a4");
  const [printers, setPrinters] = useState<OsPrinter[] | null>(null);
  const [printerName, setPrinterName] = useState("");
  const [shop, setShop] = useState({ phone: "", address: "", logo: "" });

  useEffect(() => { setPaper(readShowroomPaper()); }, []);

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

  async function saveEvidence(thenPrint: boolean) {
    if (data.rental_id && (photo || customerSig || dealerSig)) {
      setSaving(true);
      setError("");
      try {
        const saved = await api<{ customer_photo?: string }>(`/api/rental/rentals/${data.rental_id}/`, {
          method: "PATCH",
          body: JSON.stringify({
            customer_photo: photo,
            customer_signature: customerSig,
            dealer_signature: dealerSig,
          }),
        });
        if (photo && !saved.customer_photo) {
          setError("The photo was not stored. Update the server, then save again.");
          setSaving(false);
          return;
        }
      } catch {
        setError("Photo or signatures could not be saved.");
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    setDone(true);
    if (thenPrint) window.setTimeout(() => { void printInvoice(); }, 200);
  }

  const wa = whatsAppLink(data.customer_phone || "", rentalMessage({
    shop: data.shop_name,
    invoice_number: data.invoice_number,
    car: data.car_name,
    registration_number: data.registration_number,
    customer: data.customer_name,
    start_date: data.start_date,
    end_date: data.end_date,
    days: data.days,
    daily_rate: data.daily_rate,
    total_amount: data.total_amount,
    deposit: data.deposit,
    received_amount: data.received_amount,
    balance: data.balance,
  }));

  return (
    <div className={preview ? "w-full" : "fixed inset-0 z-[80] overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm"}>
      <div className={preview ? "w-full" : "mx-auto w-full max-w-3xl"}>
        <div className="invoice-no-print mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">{preview ? "Preview" : "Rental invoice"}</p>
              <p className="font-medium text-slate-900">{data.invoice_number}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button type="button" onClick={() => choosePaper("a4")} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${paper === "a4" ? "bg-white shadow-sm" : "text-slate-400"}`}>A4</button>
                <button type="button" onClick={() => choosePaper("80mm")} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${paper === "80mm" ? "bg-white shadow-sm" : "text-slate-400"}`}>80mm</button>
              </div>
              {wa ? (
                <a href={wa} target="_blank" rel="noreferrer" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">WhatsApp</a>
              ) : null}
              <button
                type="button"
                onClick={() => (preview || done ? void printInvoice() : saveEvidence(true))}
                disabled={saving || ((preview || done) && !printerReady)}
                className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
              >
                <Printer size={15} />
                {saving ? "Saving…" : preview || done ? "Print" : "Save & print"}
              </button>
              {onClose ? <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">Close</button> : null}
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {activePrinter ? `Printer connected: ${activePrinter}` : desktop ? "Printer not connected" : "Print uses the connected printer."}
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
                <p className="text-sm text-slate-500">{data.start_date} → {data.end_date}</p>
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
              <p className="text-slate-500">{data.days} day{data.days === 1 ? "" : "s"} · {rs(data.daily_rate)} / day</p>
            </div>
          </div>
          <div className="px-8 py-6 text-sm">
            <table className="w-full">
              <tbody className="divide-y divide-slate-100">
                <tr><td className="py-2 text-slate-500">Rent total</td><td className="py-2 text-right font-medium">{rs(data.total_amount)}</td></tr>
                <tr><td className="py-2 text-slate-500">Security deposit</td><td className="py-2 text-right font-medium">{rs(data.deposit)}</td></tr>
                <tr><td className="py-2 text-slate-500">Received ({METHOD[data.payment_method] || data.payment_method})</td><td className="py-2 text-right font-medium text-emerald-700">{rs(data.received_amount)}</td></tr>
                <tr><td className="py-2 font-semibold">Balance</td><td className="py-2 text-right font-display text-lg font-bold">{data.balance > 0 ? rs(data.balance) : "Cleared"}</td></tr>
              </tbody>
            </table>
            {data.notes ? <p className="mt-3 text-slate-500">{data.notes}</p> : null}
          </div>
          <div className="border-t-2 border-dashed border-slate-300 px-8 py-6">
            {!preview && !done ? (
              <div className="invoice-no-print mb-6 space-y-5">
                <p className="text-center text-sm font-semibold text-slate-700">Take the customer photo, then both sides sign</p>
                <ImageCapture label="Customer photo" hint="Face the camera and capture the customer." value={photo} onChange={setPhoto} facing="user" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <SignaturePad label="Customer signature" onSave={setCustomerSig} />
                  <SignaturePad label="Dealer signature" onSave={setDealerSig} />
                </div>
                {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
                <div className="flex justify-center">
                  <button type="button" disabled={saving || (!photo && !customerSig && !dealerSig)} onClick={() => saveEvidence(false)} className="rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : !preview ? (
              <div className="invoice-no-print mb-4 text-center">
                <button type="button" className="text-xs font-medium text-emerald-700" onClick={() => setDone(false)}>Change photo or signatures</button>
              </div>
            ) : null}
            <div className="car-evidence grid grid-cols-3 gap-4">
              <Shot label="Customer photo" src={photo} cover />
              <Shot label="Customer signature" src={customerSig} />
              <Shot label="Dealer signature" src={dealerSig} />
            </div>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-8 py-4 text-center text-xs text-slate-400">
            Rental agreement from {data.shop_name}. {data.cashier_name ? `Prepared by ${data.cashier_name}.` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function Shot({ label, src, cover = false }: { label: string; src?: string; cover?: boolean }) {
  return (
    <div className="text-center">
      {src ? (
        <img src={src} alt={label} className={`mx-auto mb-2 rounded-lg border border-slate-200 bg-white ${cover ? "h-28 w-24 object-cover" : "h-16 w-full object-contain"}`} />
      ) : (
        <div className={`mx-auto mb-2 flex items-center justify-center rounded-lg border border-dashed border-slate-300 text-[10px] text-slate-300 ${cover ? "h-28 w-24" : "h-16 w-full"}`}>{label}</div>
      )}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  );
}
