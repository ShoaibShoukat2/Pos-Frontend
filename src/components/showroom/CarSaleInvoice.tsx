"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { ImageCapture } from "@/components/showroom/ImageCapture";
import { SignaturePad } from "@/components/showroom/SignaturePad";
import { api, apiBase } from "@/lib/api";
import { listOsPrinters, printToConnectedPrinter, rememberPrinter, savedPrinterName, type OsPrinter } from "@/lib/desktopPrint";
import { useHardware } from "@/lib/hardware";

export type CarInvoiceData = {
  sale_id?: string;
  invoice_number: string;
  sale_date: string;
  // Shop
  shop_name: string;
  shop_address?: string;
  shop_phone?: string;
  shop_ntn?: string;
  // Customer
  customer_name: string;
  customer_phone?: string;
  customer_cnic?: string;
  customer_address?: string;
  // Car details
  car_brand: string;
  car_model: string;
  car_variant?: string;
  car_year: number;
  car_color?: string;
  registration_number?: string;
  chassis_number?: string;
  engine_number?: string;
  engine_cc?: number;
  fuel_type?: string;
  transmission?: string;
  mileage_km?: number;
  // Financial
  selling_price: number;
  discount: number;
  final_amount: number;
  received_amount: number;
  remaining_amount: number;
  payment_method: string;
  // Optional
  notes?: string;
  cashier_name?: string;
  customer_signature?: string;
  dealer_signature?: string;
  customer_photo?: string;
  customer_thumbprint?: string;
  payments?: { date: string; amount: number; method: string }[];
};

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  bank: "Bank Transfer",
  card: "Card",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
};

function rs(v: number) {
  return `Rs ${v.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function CarSaleInvoice({ data, onClose }: { data: CarInvoiceData; onClose?: () => void }) {
  const hardware = useHardware();
  const [customerSig, setCustomerSig] = useState(data.customer_signature || "");
  const [dealerSig, setDealerSig] = useState(data.dealer_signature || "");
  const [photo, setPhoto] = useState(data.customer_photo || "");
  const [thumb, setThumb] = useState(data.customer_thumbprint || "");
  const [sigsDone, setSigsDone] = useState(Boolean(data.customer_photo && data.customer_thumbprint));
  const [redrawCustomer, setRedrawCustomer] = useState(!data.customer_signature);
  const [redrawDealer, setRedrawDealer] = useState(!data.dealer_signature);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [printSize, setPrintSize] = useState<"a4" | "80mm">("a4");
  const [printNote, setPrintNote] = useState("");
  const [osPrinters, setOsPrinters] = useState<OsPrinter[] | null>(null);
  const [printerName, setPrinterName] = useState("");
  const [shop, setShop] = useState({ phone: data.shop_phone || "", address: data.shop_address || "", ntn: data.shop_ntn || "", logo: "" });

  useEffect(() => {
    api<{ phone?: string; address?: string; city?: string; tax_number?: string; logo?: string | null }>("/api/business/")
      .then((biz) => {
        const address = [biz.address, biz.city].filter(Boolean).join(", ");
        const logo = biz.logo ? (biz.logo.startsWith("http") ? biz.logo : `${apiBase()}${biz.logo}`) : "";
        setShop({
          phone: biz.phone || data.shop_phone || "",
          address: address || data.shop_address || "",
          ntn: biz.tax_number || data.shop_ntn || "",
          logo,
        });
      })
      .catch(() => {});
  }, [data.shop_address, data.shop_ntn, data.shop_phone]);

  useEffect(() => {
    let alive = true;
    async function loadPrinters() {
      const rows = await listOsPrinters();
      if (!alive || rows === null) return;
      setOsPrinters(rows);
      setPrinterName((current) => {
        if (current && rows.some((printer) => printer.name === current)) return current;
        const saved = savedPrinterName();
        return (
          rows.find((printer) => printer.name === saved)?.name
          || rows.find((printer) => printer.isDefault)?.name
          || rows[0]?.name
          || ""
        );
      });
    }
    loadPrinters();
    window.addEventListener("focus", loadPrinters);
    return () => {
      alive = false;
      window.removeEventListener("focus", loadPrinters);
    };
  }, []);

  const desktopApp = typeof window !== "undefined" && Boolean(window.electronAPI?.printPage);
  const desktopPrint = osPrinters !== null;
  const activePrinter = desktopApp
    ? (osPrinters?.find((printer) => printer.name === printerName)?.name || osPrinters?.[0]?.name || "")
    : (hardware.printer.connected ? hardware.printer.name : "");
  const printerReady = desktopApp ? Boolean(activePrinter) : true;

  function markPrinter(name: string) {
    setPrinterName(name);
    rememberPrinter(name);
  }

  async function printInvoice() {
    setPrintNote("");
    document.body.setAttribute("data-car-print-size", printSize);
    document.body.classList.add("printing-car-invoice");
    const cleanup = () => {
      document.body.classList.remove("printing-car-invoice");
      document.body.removeAttribute("data-car-print-size");
    };
    await new Promise((resolve) => window.setTimeout(resolve, 80));
    try {
      if (window.electronAPI?.printPage) {
        const fresh = (await listOsPrinters()) || [];
        setOsPrinters(fresh);
        const chosen = fresh.find((printer) => printer.name === printerName) || fresh.find((printer) => printer.isDefault) || fresh[0];
        if (!chosen) {
          setPrintNote("Printer is not connected. Plug it in, turn it on, then print again.");
          cleanup();
          return;
        }
        const result = await printToConnectedPrinter(printSize, chosen.name);
        if (result?.success) {
          markPrinter(result.printer || chosen.name);
          setPrintNote(`Invoice sent to ${result.printer || chosen.name}.`);
        } else {
          setPrintNote(result?.reason || "The printer did not accept the invoice.");
        }
        cleanup();
        return;
      }
      window.addEventListener("afterprint", cleanup, { once: true });
      window.print();
      window.setTimeout(cleanup, 1500);
      setPrintNote(hardware.printer.connected ? `Invoice sent to ${hardware.printer.name}.` : "Choose the connected printer in the print window.");
    } catch {
      cleanup();
      setPrintNote("Could not print. Check the printer and try again.");
    }
  }

  async function saveEvidence(thenPrint: boolean) {
    const changed =
      photo !== (data.customer_photo || "")
      || thumb !== (data.customer_thumbprint || "")
      || customerSig !== (data.customer_signature || "")
      || dealerSig !== (data.dealer_signature || "");
    if (data.sale_id && (changed || photo || thumb || customerSig || dealerSig)) {
      setSaving(true);
      setSaveError("");
      try {
        await api(`/api/showroom/car-sales/${data.sale_id}/`, {
          method: "PATCH",
          body: JSON.stringify({
            customer_signature: customerSig,
            dealer_signature: dealerSig,
            customer_photo: photo,
            customer_thumbprint: thumb,
          }),
        });
      } catch {
        setSaveError("Photo, thumb impression, or signatures could not be saved. Check the connection and try again.");
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    setSigsDone(true);
    if (thenPrint) window.setTimeout(() => { void printInvoice(); }, 200);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[48rem]">
        {/* Toolbar — hidden on print */}
        <div className="invoice-no-print mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Sale Invoice</p>
            <p className="font-medium text-slate-900">{data.invoice_number}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Print size selector */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setPrintSize("a4")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  printSize === "a4"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                A4
              </button>
              <button
                type="button"
                onClick={() => setPrintSize("80mm")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  printSize === "80mm"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                80mm Thermal
              </button>
            </div>
            {!sigsDone ? (
              <p className="hidden text-xs text-amber-700 sm:block">Photo, thumb, then save & print.</p>
            ) : printerReady ? (
              <p className="hidden text-xs text-emerald-700 sm:block">Ready to print.</p>
            ) : (
              <p className="hidden text-xs text-amber-700 sm:block">Connect a printer to print.</p>
            )}
            <button
              type="button"
              onClick={() => (sigsDone ? printInvoice() : saveEvidence(true))}
              disabled={saving || (sigsDone && !printerReady)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-40"
            >
              <Printer size={15} />
              {saving ? "Saving…" : sigsDone ? `Print (${printSize === "a4" ? "A4" : "Thermal"})` : "Save & print"}
            </button>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            ) : null}
          </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <Printer size={14} className={activePrinter ? "text-emerald-600" : "text-amber-600"} />
            {activePrinter ? (
              <span className="text-xs font-medium text-emerald-700">Printer connected: {activePrinter}</span>
            ) : desktopApp ? (
              <span className="text-xs font-medium text-amber-700">{desktopPrint ? "Printer not connected" : "Looking for a printer…"}</span>
            ) : (
              <span className="text-xs font-medium text-slate-600">Print uses the connected printer.</span>
            )}
            {desktopPrint && osPrinters.length > 1 ? (
              <select
                value={printerName}
                onChange={(event) => markPrinter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
              >
                {osPrinters.map((printer) => (
                  <option key={printer.name} value={printer.name}>
                    {printer.name}{printer.isDefault ? " (default)" : ""}
                  </option>
                ))}
              </select>
            ) : null}
            {desktopPrint && osPrinters.length === 0 ? (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("focus"))}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Check again
              </button>
            ) : null}
            {!desktopPrint && !hardware.printer.connected ? (
              <button
                type="button"
                disabled={hardware.busy === "printer"}
                onClick={() => hardware.connectPrinter()}
                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                {hardware.busy === "printer" ? "Connecting…" : "Connect printer"}
              </button>
            ) : null}
            {printNote ? <span className="text-xs text-slate-600">{printNote}</span> : null}
          </div>
        </div>

        {/* Invoice body */}
        <div
          id="car-invoice-print-root"
          className={`car-invoice rounded-2xl border border-slate-200 bg-white shadow-lg ${
            printSize === "80mm" ? "car-invoice-80mm" : "car-invoice-a4"
          }`}
        >

          {/* Header */}
          <div className="border-b-2 border-slate-900 px-8 py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {shop.logo ? (
                  <img src={shop.logo} alt="" className="h-14 w-14 rounded-lg object-cover" />
                ) : null}
                <div>
                  <h1 className="font-display text-3xl font-bold text-slate-900">{data.shop_name}</h1>
                  {shop.address ? <p className="mt-1 text-sm text-slate-500">{shop.address}</p> : null}
                  {shop.phone ? <p className="text-sm text-slate-500">Tel: {shop.phone}</p> : null}
                  {shop.ntn ? <p className="text-sm text-slate-500">NTN: {shop.ntn}</p> : null}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sale Invoice</p>
                <p className="mt-1 font-display text-2xl font-bold text-slate-900">{data.invoice_number}</p>
                <p className="mt-1 text-sm text-slate-500">{data.sale_date}</p>
                {data.cashier_name ? <p className="text-xs text-slate-400">Processed by: {data.cashier_name}</p> : null}
              </div>
            </div>
          </div>

          {/* Customer + Car in two columns */}
          <div className="grid grid-cols-2 gap-0 border-b border-slate-200">
            {/* Customer */}
            <div className="border-r border-slate-200 px-8 py-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Customer Details</p>
              <table className="w-full text-sm">
                <tbody className="space-y-1">
                  <InfoRow label="Name" value={data.customer_name} />
                  {data.customer_phone ? <InfoRow label="Phone" value={data.customer_phone} /> : null}
                  {data.customer_cnic ? <InfoRow label="CNIC" value={data.customer_cnic} /> : null}
                  {data.customer_address ? <InfoRow label="Address" value={data.customer_address} /> : null}
                </tbody>
              </table>
            </div>
            {/* Vehicle */}
            <div className="px-8 py-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Vehicle Details</p>
              <table className="w-full text-sm">
                <tbody>
                  <InfoRow label="Make / Model" value={`${data.car_brand} ${data.car_model}${data.car_variant ? ` ${data.car_variant}` : ""}`} />
                  <InfoRow label="Year" value={String(data.car_year)} />
                  {data.car_color ? <InfoRow label="Color" value={data.car_color} /> : null}
                  {data.registration_number ? <InfoRow label="Reg. No." value={data.registration_number} /> : null}
                  {data.chassis_number ? <InfoRow label="Chassis No." value={data.chassis_number} /> : null}
                  {data.engine_number ? <InfoRow label="Engine No." value={data.engine_number} /> : null}
                  {data.engine_cc ? <InfoRow label="Engine CC" value={`${data.engine_cc} cc`} /> : null}
                  {data.fuel_type ? <InfoRow label="Fuel Type" value={data.fuel_type} /> : null}
                  {data.transmission ? <InfoRow label="Transmission" value={data.transmission} /> : null}
                  {data.mileage_km ? <InfoRow label="Mileage" value={`${data.mileage_km.toLocaleString()} km`} /> : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial summary */}
          <div className="px-8 py-6">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Payment Summary</p>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50">
                    <td className="px-5 py-3 text-slate-500">Vehicle selling price</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-900">{rs(data.selling_price)}</td>
                  </tr>
                  {data.discount > 0 ? (
                    <tr>
                      <td className="px-5 py-3 text-slate-500">Discount</td>
                      <td className="px-5 py-3 text-right text-emerald-600">− {rs(data.discount)}</td>
                    </tr>
                  ) : null}
                  <tr className="bg-slate-900 text-white">
                    <td className="px-5 py-4 font-bold">Total Amount</td>
                    <td className="px-5 py-4 text-right font-display text-xl font-bold">{rs(data.final_amount)}</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 text-slate-500">
                      Amount received
                      <span className="ml-2 text-xs text-slate-400">({METHOD_LABEL[data.payment_method] || data.payment_method})</span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-emerald-600">{rs(data.received_amount)}</td>
                  </tr>
                  <tr className={data.remaining_amount > 0 ? "bg-red-50" : "bg-emerald-50"}>
                    <td className={`px-5 py-3 font-semibold ${data.remaining_amount > 0 ? "text-red-700" : "text-emerald-700"}`}>
                      {data.remaining_amount > 0 ? "Balance remaining" : "Fully paid"}
                    </td>
                    <td className={`px-5 py-3 text-right font-display text-lg font-bold ${data.remaining_amount > 0 ? "text-red-700" : "text-emerald-700"}`}>
                      {data.remaining_amount > 0 ? rs(data.remaining_amount) : "✓ Cleared"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {data.payments && data.payments.length > 0 ? (
            <div className="border-t border-slate-100 px-8 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Payments received</p>
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {data.payments.map((row, index) => (
                    <tr key={`${row.date}-${index}`}>
                      <td className="py-1 text-slate-500">{row.date}</td>
                      <td className="py-1 text-slate-500">{METHOD_LABEL[row.method] || row.method}</td>
                      <td className="py-1 text-right font-medium text-slate-900">{rs(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* Notes */}
          {data.notes ? (
            <div className="border-t border-slate-100 px-8 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Notes</p>
              <p className="mt-2 text-sm text-slate-600">{data.notes}</p>
            </div>
          ) : null}

          {/* Photo, thumb impression, and signatures */}
          <div className="border-t-2 border-dashed border-slate-300 px-8 py-6">
            {!sigsDone ? (
              <div className="invoice-no-print mb-6 space-y-5">
                <p className="text-center text-sm font-semibold text-slate-700">
                  Take the customer photo and thumb impression, then sign
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <ImageCapture
                    label="Customer photo"
                    hint="Face the camera and capture the customer."
                    value={photo}
                    onChange={setPhoto}
                    facing="user"
                  />
                  <ImageCapture
                    label="Thumb impression"
                    hint="Ink the thumb, then capture it with the camera."
                    value={thumb}
                    onChange={setThumb}
                    facing="environment"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {!redrawCustomer && customerSig ? (
                    <SavedMark label="Customer Signature" src={customerSig} onAgain={() => setRedrawCustomer(true)} />
                  ) : (
                    <SignaturePad label="Customer Signature" onSave={setCustomerSig} />
                  )}
                  {!redrawDealer && dealerSig ? (
                    <SavedMark label="Dealer Signature" src={dealerSig} onAgain={() => setRedrawDealer(true)} />
                  ) : (
                    <SignaturePad label="Dealer Signature" onSave={setDealerSig} />
                  )}
                </div>
                {saveError ? <p className="text-center text-sm text-red-600">{saveError}</p> : null}
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    disabled={saving || (!customerSig && !dealerSig && !photo && !thumb)}
                    onClick={() => saveEvidence(false)}
                    className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-40"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    disabled={!printerReady}
                    onClick={() => { void printInvoice(); }}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Print without saving
                  </button>
                </div>
              </div>
            ) : (
              <div className="invoice-no-print mb-4 text-center">
                <button type="button" className="text-xs font-medium text-indigo-600" onClick={() => setSigsDone(false)}>
                  Change photo, thumb or signatures
                </button>
              </div>
            )}
            <div className="car-evidence grid grid-cols-2 gap-6 sm:grid-cols-4">
              <EvidenceShot label="Customer photo" src={photo} name={data.customer_name} cover />
              <EvidenceShot label="Thumb impression" src={thumb} name={data.customer_name} />
              <EvidenceShot label="Customer signature" src={customerSig} name={data.customer_name} />
              <EvidenceShot label="Dealer signature" src={dealerSig} name={data.shop_name} />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-8 py-4 text-center">
            <p className="text-xs text-slate-400">
              This is a computer-generated invoice. Thank you for your purchase from {data.shop_name}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SavedMark({ label, src, onAgain }: { label: string; src: string; onAgain: () => void }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <img src={src} alt={label} className="mt-2 h-16 w-full object-contain" />
      <button type="button" onClick={onAgain} className="mt-2 text-xs font-medium text-indigo-600">
        Sign again
      </button>
    </div>
  );
}

function EvidenceShot({ label, src, name, cover = false }: { label: string; src: string; name: string; cover?: boolean }) {
  return (
    <div className="text-center">
      {src ? (
        <img
          src={src}
          alt={label}
          className={`mx-auto mb-2 rounded-lg border border-slate-200 bg-white object-center ${
            cover ? "h-28 w-24 object-cover" : "h-20 w-full object-contain"
          }`}
        />
      ) : (
        <div className={`mx-auto mb-2 flex items-center justify-center rounded-lg border border-dashed border-slate-300 text-[10px] text-slate-300 ${
          cover ? "h-28 w-24" : "h-20 w-full"
        }`}
        >
          {label}
        </div>
      )}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs text-slate-600">{name}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-0.5 pr-3 text-slate-400 align-top">{label}</td>
      <td className="py-0.5 font-medium text-slate-900">{value}</td>
    </tr>
  );
}
