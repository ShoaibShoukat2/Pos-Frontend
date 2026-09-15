"use client";

import { Barcode, Printer } from "lucide-react";

import { Button, Modal } from "@/components/ui";
import type { useHardware } from "@/lib/hardware";

type Hardware = ReturnType<typeof useHardware>;

export function HardwareToasts({ hardware }: { hardware: Hardware }) {
  if (!hardware.toasts.length) return null;
  return (
    <div className="pointer-events-none fixed right-3 z-[70] flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2" style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}>
      {hardware.toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg ${
            toast.tone === "good"
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              <p className="mt-0.5 text-xs opacity-80">{toast.detail}</p>
            </div>
            <button type="button" className="text-xs opacity-60 hover:opacity-100" onClick={() => hardware.dismissToast(toast.id)}>
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HardwareStatus({ hardware }: { hardware: Hardware }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusChip
        live={hardware.printer.connected}
        label={hardware.printer.connected ? "Printer live" : "Printer off"}
        name={hardware.printer.name}
      />
      <StatusChip
        live={hardware.scanner.connected}
        label={hardware.scanner.connected ? "Barcode live" : "Barcode off"}
        name={hardware.scanner.name}
      />
    </div>
  );
}

function StatusChip({ live, label, name }: { live: boolean; label: string; name?: string }) {
  return (
    <span
      title={name || label}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
        live ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-paper-50/70"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-300" : "bg-paper-50/40"}`} />
      {label}
    </span>
  );
}

export function HardwareSetup({ hardware, compact = false }: { hardware: Hardware; compact?: boolean }) {
  const body = compact ? (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-paper-200 bg-white px-3 py-2">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-700/50">Hardware</span>
      <Button
        type="button"
        className="h-9 px-3 py-1.5 text-xs"
        disabled={hardware.busy === "printer"}
        onClick={() => hardware.setHelp("printer")}
      >
        <Printer size={14} />
        {hardware.busy === "printer" ? "Opening…" : hardware.printer.connected ? "Printer" : "Connect printer"}
      </Button>
      <LiveText connected={hardware.printer.connected} name={hardware.printer.name} fallback="Printer off" />
      <Button
        type="button"
        variant="copper"
        className="h-9 px-3 py-1.5 text-xs"
        disabled={hardware.busy === "scanner"}
        onClick={() => hardware.setHelp("scanner")}
      >
        <Barcode size={14} />
        {hardware.busy === "scanner" ? "Opening…" : hardware.scanner.connected ? "Scanner" : "Connect scanner"}
      </Button>
      <LiveText connected={hardware.scanner.connected} name={hardware.scanner.name} fallback="Scanner off" />
    </div>
  ) : (
    <div className="mb-4 grid gap-3 sm:grid-cols-2">
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-950 text-paper-50">
            <Printer size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">1. Connect printer here</p>
            <p className="mt-0.5 text-xs text-ink-700/65">Plug in the receipt printer, then press the button. A green alert will appear.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button type="button" disabled={hardware.busy === "printer"} onClick={() => hardware.setHelp("printer")}>
                {hardware.busy === "printer" ? "Opening…" : hardware.printer.connected ? "Change printer" : "Connect printer"}
              </Button>
              <LiveText connected={hardware.printer.connected} name={hardware.printer.name} fallback="Not connected" />
            </div>
          </div>
        </div>
      </div>
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-copper-500 text-ink-950">
            <Barcode size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">2. Connect barcode reader here</p>
            <p className="mt-0.5 text-xs text-ink-700/65">Plug in the scanner, press the button, or scan any barcode.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button type="button" variant="copper" disabled={hardware.busy === "scanner"} onClick={() => hardware.setHelp("scanner")}>
                {hardware.busy === "scanner" ? "Opening…" : hardware.scanner.connected ? "Change reader" : "Connect barcode"}
              </Button>
              <LiveText connected={hardware.scanner.connected} name={hardware.scanner.name} fallback="Not connected" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {body}
      <Modal open={hardware.help === "printer"} title="Connect printer" onClose={() => hardware.setHelp(null)}>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-800">
          <li>Plug the printer USB into the computer and turn the printer on.</li>
          <li>Press the button below.</li>
          <li>Choose your printer from the list.</li>
        </ol>
        <p className="mt-3 text-xs text-ink-700/60">Use Chrome or Edge. When it connects, a green alert will say: Printer connected.</p>
        <Button className="mt-4 w-full" disabled={hardware.busy === "printer"} onClick={() => hardware.connectPrinter()}>
          {hardware.busy === "printer" ? "Waiting…" : "Choose printer"}
        </Button>
      </Modal>
      <Modal open={hardware.help === "scanner"} title="Connect barcode reader" onClose={() => hardware.setHelp(null)}>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-800">
          <li>Plug the barcode reader USB into the computer.</li>
          <li>Press the button below and choose the reader from the list.</li>
          <li>Or scan any product barcode — status will turn Live.</li>
        </ol>
        <p className="mt-3 text-xs text-ink-700/60">When it connects, a green alert will say: Barcode reader connected.</p>
        <Button className="mt-4 w-full" variant="copper" disabled={hardware.busy === "scanner"} onClick={() => hardware.connectScanner()}>
          {hardware.busy === "scanner" ? "Waiting…" : "Choose barcode reader"}
        </Button>
      </Modal>
    </>
  );
}

function LiveText({ connected, name, fallback }: { connected: boolean; name?: string; fallback: string }) {
  return (
    <p className={`text-xs ${connected ? "text-emerald-700" : "text-ink-700/55"}`}>
      {connected ? `Live · ${name || "Connected"}` : fallback}
    </p>
  );
}
