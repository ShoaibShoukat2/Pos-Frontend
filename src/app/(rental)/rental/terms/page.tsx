"use client";

import { useEffect, useState } from "react";
import { Pencil, Printer } from "lucide-react";

import { TermsDocument, TermsEditor } from "@/components/rental/TermsDocument";
import { listOsPrinters, printToConnectedPrinter, rememberPrinter, savedPrinterName, type OsPrinter } from "@/lib/desktopPrint";
import { ApiError, api, fieldErrors } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { blankTerms, type TermsSheetData } from "@/lib/rentalTerms";

export default function RentalTermsPage() {
  const { user } = useAuth();
  const [printers, setPrinters] = useState<OsPrinter[] | null>(null);
  const [printerName, setPrinterName] = useState("");
  const [note, setNote] = useState("");
  const [printing, setPrinting] = useState(false);
  const [sheet, setSheet] = useState<TermsSheetData | null>(null);
  const [draft, setDraft] = useState<TermsSheetData | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    api<TermsSheetData>("/api/rental/terms/")
      .then(setSheet)
      .catch(() => setSheet(blankTerms(user?.business_name || "")));
  }, [user?.business_name]);

  const desktop = typeof window !== "undefined" && Boolean(window.electronAPI?.printPage);
  const activePrinter = desktop
    ? (printers?.find((row) => row.name === printerName)?.name || "")
    : "";
  const shown = sheet || blankTerms(user?.business_name || "");

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      const saved = await api<TermsSheetData>("/api/rental/terms/", {
        method: "PUT",
        body: JSON.stringify(draft),
      });
      setSheet(saved);
      setEditing(false);
      setNote("Terms updated.");
    } catch (err) {
      const fields = err instanceof ApiError ? fieldErrors(err.body) : {};
      setError(fields.clauses || fields.detail || "Could not update the terms.");
    } finally {
      setSaving(false);
    }
  }

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
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-royal-800">Owner terms</p>
          <h1 className="font-urdu text-3xl font-bold text-slate-950">شرائط</h1>
          <p className="mt-0.5 text-sm text-slate-500">Edit a line, delete it, or update the sheet. It prints after the rental contract.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => { setDraft(shown); setError(""); setEditing(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800"
          >
            <Pencil size={15} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => { void printTerms(); }}
            disabled={printing || editing || (desktop && !activePrinter)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-royal-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            <Printer size={15} />
            {printing ? "Printing…" : "Print terms"}
          </button>
        </div>
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

      {editing && draft ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <TermsEditor
            value={draft}
            saving={saving}
            error={error}
            onChange={setDraft}
            onSave={() => { void save(); }}
            onCancel={() => { setEditing(false); setError(""); }}
          />
        </div>
      ) : (
        <div id="car-invoice-print-root" className="rounded-2xl bg-white p-2 shadow-sm sm:p-4">
          <TermsDocument data={shown} />
        </div>
      )}
    </div>
  );
}
