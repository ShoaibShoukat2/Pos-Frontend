"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";

import { listOsPrinters, printToConnectedPrinter, rememberPrinter, savedPrinterName, type OsPrinter } from "@/lib/desktopPrint";

export default function RentalTermsPage() {
  const [printers, setPrinters] = useState<OsPrinter[] | null>(null);
  const [printerName, setPrinterName] = useState("");
  const [note, setNote] = useState("");
  const [printing, setPrinting] = useState(false);

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
    : "";

  async function printTerms() {
    setPrinting(true);
    setNote("");
    document.body.setAttribute("data-car-print-size", "a4");
    document.body.classList.add("printing-car-invoice");
    const cleanup = () => {
      document.body.classList.remove("printing-car-invoice");
      document.body.removeAttribute("data-car-print-size");
      setPrinting(false);
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
        const result = await printToConnectedPrinter("a4", chosen.name);
        if (result?.success) {
          rememberPrinter(result.printer || chosen.name);
          setNote(`Terms sent to ${result.printer || chosen.name}.`);
        } else setNote(result?.reason || "The printer did not accept the terms page.");
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

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Rent a Car</p>
          <h1 className="font-display text-2xl font-semibold text-slate-900">شرائط</h1>
          <p className="mt-0.5 text-sm text-slate-400">Owner terms sheet. It also prints after the rental contract on A4.</p>
        </div>
        <button
          type="button"
          onClick={() => { void printTerms(); }}
          disabled={printing || (desktop && !activePrinter)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          <Printer size={15} />
          {printing ? "Printing…" : "Print terms"}
        </button>
      </div>

      {desktop && printers ? (
        <label className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          Printer
          <select value={printerName} onChange={(event) => setPrinterName(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            {printers.length === 0 ? <option value="">No printer</option> : null}
            {printers.map((row) => (
              <option key={row.name} value={row.name}>{row.name}{row.isDefault ? " (default)" : ""}</option>
            ))}
          </select>
        </label>
      ) : null}
      {note ? <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{note}</p> : null}

      <div id="car-invoice-print-root" className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <img src="/rental-terms.jpg" alt="Car rental terms" className="mx-auto w-full" />
      </div>
    </div>
  );
}
