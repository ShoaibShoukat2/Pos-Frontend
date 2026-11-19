"use client";

import { useState } from "react";

import { readUpload } from "@/lib/hostel";

export function SeatDot({ status, label }: { status: string; label?: string }) {
  const tone: Record<string, string> = {
    available: "bg-emerald-500 text-white",
    occupied: "bg-red-500 text-white",
    reserved: "bg-orange-500 text-white",
    maintenance: "bg-slate-400 text-white",
    blocked: "bg-slate-300 text-slate-700",
  };
  return (
    <span className={`inline-flex min-w-8 items-center justify-center rounded-md px-1.5 py-1 text-[11px] font-semibold ${tone[status] || tone.blocked}`} title={status}>
      {label || status}
    </span>
  );
}

export function StatusPill({ value }: { value: string }) {
  const tone: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700",
    active: "bg-emerald-50 text-emerald-700",
    available: "bg-emerald-50 text-emerald-700",
    approved: "bg-emerald-50 text-emerald-700",
    completed: "bg-slate-100 text-slate-600",
    partial: "bg-amber-50 text-amber-800",
    reserved: "bg-orange-50 text-orange-700",
    pending: "bg-orange-50 text-orange-700",
    confirmed: "bg-royal-50 text-royal-800",
    checked_in: "bg-royal-50 text-royal-800",
    unpaid: "bg-slate-100 text-slate-600",
    overdue: "bg-red-50 text-red-700",
    rejected: "bg-red-50 text-red-700",
    inactive: "bg-slate-100 text-slate-500",
    maintenance: "bg-slate-100 text-slate-600",
    in_progress: "bg-amber-50 text-amber-800",
  };
  const label = value.replaceAll("_", " ");
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${tone[value] || "bg-slate-100 text-slate-600"}`}>{label}</span>;
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-royal-200 bg-white px-4 py-10 text-center">
      <p className="font-medium text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-card" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-slate-500">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function UploadField({ label, allowPdf = false, onPick }: { label: string; allowPdf?: boolean; onPick: (value: string, name: string) => void }) {
  const [error, setError] = useState("");
  return (
    <label className="block space-y-1.5 text-xs font-medium uppercase tracking-wide text-surface-500">
      {label}
      <input
        type="file"
        accept={allowPdf ? "image/jpeg,image/png,image/webp,application/pdf" : "image/jpeg,image/png,image/webp"}
        className="field block w-full text-sm normal-case"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          try {
            setError("");
            onPick(await readUpload(file, allowPdf), file.name);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read the file.");
          }
        }}
      />
      {error ? <span className="text-xs normal-case text-red-600">{error}</span> : null}
    </label>
  );
}

export function Notice({ tone = "ok", text }: { tone?: "ok" | "bad"; text: string }) {
  if (!text) return null;
  return <p className={`rounded-xl px-3 py-2 text-sm ${tone === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{text}</p>;
}
