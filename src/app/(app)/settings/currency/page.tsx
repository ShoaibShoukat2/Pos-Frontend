"use client";

import { FormEvent, useEffect, useState } from "react";

import { Badge, Button, Empty, Field, Input, Modal, PageHeader, Toggle } from "@/components/ui";
import { ApiError, api, fieldErrors } from "@/lib/api";
import type { Currency } from "@/lib/types";

const blank = {
  code: "",
  name: "",
  symbol: "",
  decimal_places: 2,
  exchange_rate: "1",
  is_base: false,
  is_active: true,
};

export default function CurrencyPage() {
  const [rows, setRows] = useState<Currency[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function load() {
    setRows(await api<Currency[]>("/api/currencies/"));
  }
  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing(null);
    setForm(blank);
    setErrors({});
    setOpen(true);
  }

  function startEdit(row: Currency) {
    setEditing(row);
    setForm({
      code: row.code,
      name: row.name,
      symbol: row.symbol,
      decimal_places: row.decimal_places,
      exchange_rate: String(row.exchange_rate),
      is_base: row.is_base,
      is_active: row.is_active,
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      if (editing) await api(`/api/currencies/${editing.id}/`, { method: "PATCH", body: JSON.stringify(form) });
      else await api("/api/currencies/", { method: "POST", body: JSON.stringify(form) });
      setOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
    } finally {
      setPending(false);
    }
  }

  async function remove(row: Currency) {
    if (row.is_base) return;
    if (!confirm(`Delete ${row.code}?`)) return;
    await api(`/api/currencies/${row.id}/`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Module 1"
        title="Currencies"
        description="PKR is seeded as the base currency. Extra currencies keep an exchange rate against the base."
        action={<Button onClick={startCreate}>Add currency</Button>}
      />
      {rows.length === 0 ? (
        <Empty title="No currencies" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
              <tr>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-paper-100">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {row.code} · {row.name}
                    </p>
                  </td>
                  <td className="px-4 py-3">{row.symbol}</td>
                  <td className="px-4 py-3">{row.exchange_rate}</td>
                  <td className="px-4 py-3">
                    {row.is_base ? <Badge tone="copper">Base</Badge> : <Badge>FX</Badge>}{" "}
                    <Badge tone={row.is_active ? "good" : "warn"}>{row.is_active ? "Active" : "Off"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" onClick={() => startEdit(row)}>
                      Edit
                    </Button>
                    {!row.is_base ? (
                      <Button variant="ghost" onClick={() => remove(row)}>
                        Delete
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} title={editing ? "Edit currency" : "New currency"} onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="grid gap-3">
          <Field label="Code" error={errors.code}>
            <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </Field>
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Symbol">
            <Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} required />
          </Field>
          <Field label="Decimal places">
            <Input
              type="number"
              value={form.decimal_places}
              onChange={(e) => setForm({ ...form, decimal_places: Number(e.target.value) })}
            />
          </Field>
          <Field label="Exchange rate">
            <Input value={form.exchange_rate} onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })} />
          </Field>
          <Toggle label="Base currency" checked={form.is_base} onChange={(is_base) => setForm({ ...form, is_base })} />
          <Toggle label="Active" checked={form.is_active} onChange={(is_active) => setForm({ ...form, is_active })} />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save currency"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
