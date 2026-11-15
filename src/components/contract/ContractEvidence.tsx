"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { ImageCapture } from "@/components/showroom/ImageCapture";
import { SignaturePad } from "@/components/showroom/SignaturePad";

export type ContractEvidenceValues = {
  ownerSignature: string;
  partySignature: string;
  guarantorSignature: string;
  partyPhoto: string;
  cnicFront: string;
  cnicBack: string;
  partyThumb: string;
  guarantorThumb: string;
};

type SlotKey = keyof ContractEvidenceValues;

const SIGNATURES: SlotKey[] = ["ownerSignature", "partySignature", "guarantorSignature"];

export function ContractEvidence({
  partyLabel,
  values,
  onChange,
  preview = false,
  saving = false,
  error = "",
  onSave,
}: {
  partyLabel: string;
  values: ContractEvidenceValues;
  onChange: (key: SlotKey, value: string) => void;
  preview?: boolean;
  saving?: boolean;
  error?: string;
  onSave?: () => void;
}) {
  const [active, setActive] = useState<SlotKey | null>(null);
  const [redo, setRedo] = useState(false);

  const slots: { key: SlotKey; label: string; kind: "sign" | "photo"; facing?: "user" | "environment"; hint: string; cover?: boolean }[] = [
    { key: "ownerSignature", label: "Owner / manager", kind: "sign", hint: "Shop owner or manager signs here." },
    { key: "partySignature", label: partyLabel, kind: "sign", hint: `${partyLabel} signs on the screen.` },
    { key: "guarantorSignature", label: "Guarantor", kind: "sign", hint: "Guarantor signs on the screen." },
    { key: "partyPhoto", label: `${partyLabel} photo`, kind: "photo", facing: "user", hint: "Face the camera, or upload a photo.", cover: true },
    { key: "cnicFront", label: "CNIC front", kind: "photo", facing: "environment", hint: "Capture or upload the front of the CNIC." },
    { key: "cnicBack", label: "CNIC back", kind: "photo", facing: "environment", hint: "Capture or upload the back of the CNIC." },
    { key: "partyThumb", label: `${partyLabel} thumb`, kind: "photo", facing: "environment", hint: "Ink the thumb, then capture or upload it." },
    { key: "guarantorThumb", label: "Guarantor thumb", kind: "photo", facing: "environment", hint: "Ink the guarantor thumb, then capture or upload it." },
  ];

  function openSlot(key: SlotKey) {
    setRedo(false);
    setActive((current) => (current === key ? null : key));
  }

  const activeSlot = slots.find((slot) => slot.key === active);

  return (
    <div>
      {!preview ? (
        <div className="invoice-no-print mb-5 space-y-3">
          <p className="font-semibold text-slate-900">Signatures & photos</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {slots.map((slot) => {
              const filled = Boolean(values[slot.key]);
              const selected = active === slot.key;
              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => openSlot(slot.key)}
                  className={`flex items-center gap-2 rounded-xl px-1 py-1.5 text-left text-sm ${selected ? "bg-slate-100" : ""}`}
                >
                  <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${filled ? "border-emerald-600 bg-emerald-600" : "border-slate-400"}`} />
                  <span className="text-slate-800">{slot.label}</span>
                </button>
              );
            })}
          </div>

          {activeSlot && !redo ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {activeSlot.kind === "sign" ? (
                <SignaturePad label={activeSlot.label} savedUrl={values[activeSlot.key]} onSave={(value) => onChange(activeSlot.key, value)} />
              ) : (
                <ImageCapture
                  label={activeSlot.label}
                  hint={activeSlot.hint}
                  value={values[activeSlot.key]}
                  onChange={(value) => onChange(activeSlot.key, value)}
                  facing={activeSlot.facing}
                />
              )}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => { setRedo((open) => !open); setActive(null); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
          >
            <Pencil size={15} />
            View / redo signatures
          </button>

          {redo ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {SIGNATURES.map((key) => {
                const slot = slots.find((item) => item.key === key)!;
                return <SignaturePad key={key} label={slot.label} savedUrl={values[key]} onSave={(value) => onChange(key, value)} />;
              })}
            </div>
          ) : null}

          {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
          {onSave ? (
            <button
              type="button"
              disabled={saving || !Object.values(values).some(Boolean)}
              onClick={onSave}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save signatures & photos"}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="car-evidence grid grid-cols-2 gap-4 sm:grid-cols-4">
        {slots.map((slot) => (
          <Shot key={slot.key} label={slot.label} src={values[slot.key]} cover={slot.cover} />
        ))}
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
        <div className={`mx-auto mb-2 flex items-center justify-center rounded-lg border border-dashed border-slate-300 px-1 text-[10px] text-slate-300 ${cover ? "h-28 w-24" : "h-16 w-full"}`}>{label}</div>
      )}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  );
}
