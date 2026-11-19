"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

import { ApiError, api, fieldErrors } from "@/lib/api";

const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-royal-800";

type RentalDetail = {
  end_date: string;
  start_date: string;
  daily_rate: string;
  deposit: string;
  received_amount: string;
  payment_method: string;
  notes: string;
  status: string;
  car_name?: string;
  customer_name?: string;
};

type CarDetail = {
  brand: string;
  model: string;
  model_year: number;
  registration_number: string;
  color: string;
  daily_rate: string;
  notes: string;
  status: string;
  display_name?: string;
};

function Shell({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-5" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-950">{title}</h2>
            {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function message(err: unknown, fallback: string) {
  if (err instanceof ApiError) {
    const fields = fieldErrors(err.body);
    return fields.detail || fields.end_date || fields.amount || fields.car || Object.values(fields)[0] || fallback;
  }
  return fallback;
}

export function RentalEditDialog({ id, onClose, onSaved }: { id: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<RentalDetail | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<RentalDetail>(`/api/rental/rentals/${id}/`)
      .then(setForm)
      .catch(() => setError("Could not open this rental."));
  }, [id]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setPending(true);
    setError("");
    try {
      await api(`/api/rental/rentals/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          end_date: form.end_date,
          daily_rate: form.daily_rate,
          deposit: form.deposit,
          received_amount: form.received_amount,
          payment_method: form.payment_method,
          notes: form.notes,
        }),
      });
      onSaved();
    } catch (err) {
      setError(message(err, "Could not save this rental."));
    } finally {
      setPending(false);
    }
  }

  return (
    <Shell title="Edit rental" subtitle={form ? `${form.car_name || ""} · ${form.customer_name || ""}` : "Loading…"} onClose={onClose}>
      {!form ? <p className="text-sm text-slate-400">{error || "Loading…"}</p> : (
        <form onSubmit={onSubmit} className="space-y-3">
          <p className="text-xs text-slate-400">Out since {form.start_date}</p>
          <Label text="Return date">
            <input type="date" required value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} className={field} />
          </Label>
          <Label text="Daily rate">
            <input inputMode="decimal" required value={form.daily_rate} onChange={(event) => setForm({ ...form, daily_rate: event.target.value })} className={field} />
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Label text="Deposit">
              <input inputMode="decimal" value={form.deposit} onChange={(event) => setForm({ ...form, deposit: event.target.value })} className={field} />
            </Label>
            <Label text="Received">
              <input inputMode="decimal" value={form.received_amount} onChange={(event) => setForm({ ...form, received_amount: event.target.value })} className={field} />
            </Label>
          </div>
          <Label text="Payment">
            <select value={form.payment_method} onChange={(event) => setForm({ ...form, payment_method: event.target.value })} className={field}>
              <option value="cash">Cash</option>
              <option value="bank">Bank transfer</option>
              <option value="card">Card</option>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">Easypaisa</option>
            </select>
          </Label>
          <Label text="Notes">
            <textarea value={form.notes || ""} rows={2} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={field} />
          </Label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={pending} className="w-full rounded-xl bg-royal-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
            {pending ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </Shell>
  );
}

export function RentalUpdateDialog({ id, endDate, onClose, onSaved }: { id: string; endDate: string; onClose: () => void; onSaved: () => void }) {
  const [nextDate, setNextDate] = useState(endDate);
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const dateChanged = nextDate && nextDate !== endDate;
    const paid = Number(amount || 0);
    if (!dateChanged && !(paid > 0)) {
      setError("Change the return date or enter a payment.");
      return;
    }
    setPending(true);
    setError("");
    try {
      if (dateChanged) {
        await api(`/api/rental/rentals/${id}/extend/`, { method: "POST", body: JSON.stringify({ end_date: nextDate }) });
      }
      if (paid > 0) {
        await api(`/api/rental/rentals/${id}/pay/`, { method: "POST", body: JSON.stringify({ amount: paid }) });
      }
      onSaved();
    } catch (err) {
      setError(message(err, "Could not update this rental."));
    } finally {
      setPending(false);
    }
  }

  return (
    <Shell title="Update rental" subtitle="Move the return date or add a payment." onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <Label text="New return date">
          <input type="date" value={nextDate} onChange={(event) => setNextDate(event.target.value)} className={field} />
        </Label>
        <Label text="Amount received now">
          <input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" className={field} />
        </Label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" disabled={pending} className="w-full rounded-xl bg-royal-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
          {pending ? "Updating…" : "Update"}
        </button>
      </form>
    </Shell>
  );
}

export function CarEditDialog({ id, onClose, onSaved }: { id: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<CarDetail | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<CarDetail>(`/api/rental/rental-cars/${id}/`)
      .then(setForm)
      .catch(() => setError("Could not open this car."));
  }, [id]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setPending(true);
    setError("");
    try {
      await api(`/api/rental/rental-cars/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          brand: form.brand,
          model: form.model,
          model_year: Number(form.model_year || 0),
          registration_number: form.registration_number,
          color: form.color,
          daily_rate: form.daily_rate,
          notes: form.notes,
        }),
      });
      onSaved();
    } catch (err) {
      setError(message(err, "Could not save this car."));
    } finally {
      setPending(false);
    }
  }

  return (
    <Shell title="Edit car" subtitle={form?.display_name} onClose={onClose}>
      {!form ? <p className="text-sm text-slate-400">{error || "Loading…"}</p> : (
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Label text="Brand">
              <input required value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} className={field} />
            </Label>
            <Label text="Model">
              <input required value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} className={field} />
            </Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Label text="Year">
              <input value={form.model_year || ""} onChange={(event) => setForm({ ...form, model_year: Number(event.target.value || 0) })} className={field} />
            </Label>
            <Label text="Daily rate">
              <input inputMode="decimal" value={form.daily_rate} onChange={(event) => setForm({ ...form, daily_rate: event.target.value })} className={field} />
            </Label>
          </div>
          <Label text="Registration">
            <input value={form.registration_number} onChange={(event) => setForm({ ...form, registration_number: event.target.value })} className={field} />
          </Label>
          <Label text="Color">
            <input value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} className={field} />
          </Label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={pending} className="w-full rounded-xl bg-royal-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
            {pending ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </Shell>
  );
}

export function CarStatusDialog({ id, status, name, onClose, onSaved }: { id: string; status: string; name: string; onClose: () => void; onSaved: () => void }) {
  const [next, setNext] = useState(status === "maintenance" ? "maintenance" : "available");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const locked = status === "rented";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (locked) return;
    setPending(true);
    setError("");
    try {
      await api(`/api/rental/rental-cars/${id}/`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      onSaved();
    } catch (err) {
      setError(message(err, "Could not update this car."));
    } finally {
      setPending(false);
    }
  }

  return (
    <Shell title="Update car" subtitle={name} onClose={onClose}>
      {locked ? (
        <p className="text-sm text-slate-600">This car is on rent. Check it in before changing its status.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <Label text="Status">
            <select value={next} onChange={(event) => setNext(event.target.value)} className={field}>
              <option value="available">Available</option>
              <option value="maintenance">Workshop</option>
            </select>
          </Label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={pending} className="w-full rounded-xl bg-royal-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
            {pending ? "Updating…" : "Update"}
          </button>
        </form>
      )}
    </Shell>
  );
}

function Label({ text, children }: { text: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{text}</span>
      {children}
    </label>
  );
}
