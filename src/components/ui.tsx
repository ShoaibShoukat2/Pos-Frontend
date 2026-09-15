"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-copper-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-2xl tracking-tight text-ink-950 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-ink-700/70">{description}</p> : null}
      </div>
      {action ? <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:max-w-md sm:items-end">{action}</div> : null}
    </div>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-ink-700/70">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`field ${props.className || ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`field ${props.className || ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`field min-h-28 ${props.className || ""}`} />;
}

export function Button({
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "copper" | "ghost" }) {
  const cls = variant === "copper" ? "btn-copper" : variant === "ghost" ? "btn-ghost" : "btn-primary";
  return <button {...props} className={`${cls} ${props.className || ""}`} />;
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "copper";
}) {
  const map = {
    neutral: "bg-paper-100 text-ink-800",
    good: "bg-emerald-50 text-emerald-800",
    warn: "bg-red-50 text-red-800",
    copper: "bg-amber-50 text-amber-900",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}>
      {children}
    </span>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-display text-xl text-ink-950">{title}</p>
      {hint ? <p className="mt-1 text-sm text-ink-700/70">{hint}</p> : null}
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink-950/45 p-0 backdrop-blur-sm sm:items-start sm:p-4">
      <div className="card max-h-[92dvh] w-full overflow-y-auto rounded-b-none p-4 sm:mt-10 sm:max-w-[min(32rem,calc(100vw-2rem))] sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="min-w-0 break-words font-display text-xl text-ink-950 sm:text-2xl">{title}</h2>
          <button type="button" onClick={onClose} className="min-h-11 shrink-0 px-1 text-sm text-ink-700/70 hover:text-ink-950">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{children}</div>;
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-4 rounded-xl border border-paper-200 bg-paper-50 px-3 py-2.5"
    >
      <span className="text-sm text-ink-800">{label}</span>
      <span className={`h-5 w-9 rounded-full p-0.5 transition ${checked ? "bg-copper-500" : "bg-paper-200"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}
