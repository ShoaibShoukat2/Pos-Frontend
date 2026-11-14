export type OsPrinter = { name: string; isDefault: boolean };

export type PrintResult = { success: boolean; printer: string; reason: string };

const PRINTER_KEY = "upos_printer_name";

export function savedPrinterName() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(PRINTER_KEY) || "";
}

export function rememberPrinter(name: string) {
  if (name) localStorage.setItem(PRINTER_KEY, name);
}

export async function listOsPrinters(): Promise<OsPrinter[] | null> {
  const list = window.electronAPI?.listPrinters;
  if (!list) return null;
  try {
    const rows = await list();
    return Array.isArray(rows) ? rows.filter((row) => Boolean(row?.name)) : [];
  } catch {
    return [];
  }
}

export async function printToConnectedPrinter(paper: "a4" | "80mm", deviceName: string): Promise<PrintResult | null> {
  const printPage = window.electronAPI?.printPage;
  if (!printPage) return null;
  return printPage({ deviceName, paper });
}
