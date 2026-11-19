"use client";

import { Plus, Trash2 } from "lucide-react";

import type { TermsSheetData } from "@/lib/rentalTerms";

const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-royal-800";

export function TermsDocument({ data, dense = false }: { data: TermsSheetData; dense?: boolean }) {
  return (
    <article className={`terms-frame bg-white text-slate-950 ${dense ? "px-3 py-4" : "px-4 py-5 sm:px-8 sm:py-7"}`}>
      <div className="terms-plaque mx-auto mb-3 max-w-[16rem] px-4 py-1.5 text-center font-urdu text-xl font-bold leading-snug sm:text-2xl">
        {data.title || "شرائط"}
      </div>
      <h3 className="mb-4 text-center font-urdu text-lg font-bold">شرائط</h3>
      <ol dir="rtl" className="space-y-3">
        {data.clauses.map((line, index) => (
          <li key={`${index}-${line.slice(0, 12)}`} className="flex items-start gap-2 font-urdu text-[15px] leading-8 text-slate-900 sm:text-base sm:leading-9">
            <span className="shrink-0 font-semibold">({index + 1})</span>
            <span className="min-w-0 flex-1">{line}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex items-end justify-between gap-4 border-t border-dotted border-slate-400 pt-3">
        <p className="font-urdu text-sm text-slate-800">{data.footer || "دستخط / انگوٹھا"}</p>
        <span className="mb-2 hidden h-px flex-1 border-t border-dotted border-slate-300 sm:block" />
      </div>
    </article>
  );
}

export function TermsEditor({
  value,
  saving,
  error,
  onChange,
  onSave,
  onCancel,
}: {
  value: TermsSheetData;
  saving: boolean;
  error: string;
  onChange: (next: TermsSheetData) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  function setClause(index: number, text: string) {
    onChange({ ...value, clauses: value.clauses.map((line, i) => (i === index ? text : line)) });
  }

  function removeClause(index: number) {
    onChange({ ...value, clauses: value.clauses.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-3 p-3 sm:p-5">
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name on the sheet</span>
        <input value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} className={`${field} font-urdu text-base`} dir="auto" />
      </label>
      <div className="space-y-2">
        {value.clauses.map((line, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="w-6 shrink-0 pt-3 text-center text-xs font-semibold text-slate-400">{index + 1}</span>
            <textarea
              value={line}
              dir="rtl"
              rows={3}
              onChange={(event) => setClause(index, event.target.value)}
              className={`${field} min-h-[4.5rem] flex-1 font-urdu text-base leading-8`}
            />
            <button
              type="button"
              onClick={() => removeClause(index)}
              className="mt-1 inline-flex h-10 shrink-0 items-center gap-1 rounded-xl border border-red-200 px-2.5 text-xs font-semibold text-red-700"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange({ ...value, clauses: [...value.clauses, ""] })}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
      >
        <Plus size={15} />
        Add line
      </button>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Footer</span>
        <input value={value.footer} dir="rtl" onChange={(event) => onChange({ ...value, footer: event.target.value })} className={`${field} font-urdu text-base`} />
      </label>
      {error ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" disabled={saving} onClick={onSave} className="inline-flex flex-1 items-center justify-center rounded-xl bg-royal-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
          {saving ? "Updating…" : "Update"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">
          Cancel
        </button>
      </div>
    </div>
  );
}
