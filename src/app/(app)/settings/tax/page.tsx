"use client";

import { FormEvent, useEffect, useState } from "react";

import { Badge, Button, Empty, Field, Input, Modal, PageHeader, Toggle } from "@/components/ui";
import { ApiError, api, fieldErrors } from "@/lib/api";
import type { TaxRate } from "@/lib/types";

const blank = { name: "", code: "", rate: "0", is_inclusive: false, is_default: false, is_active: true };

export default function TaxPage() {
  const [rows, setRows] = useState<TaxRate[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaxRate | null>(null);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function load() {
    setRows(await api<TaxRate[]>("/api/tax-rates/"));
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

  function startEdit(row: TaxRate) {
    setEditing(row);
    setForm({
      name: row.name,
      code: row.code,
      rate: String(row.rate),
      is_inclusive: row.is_inclusive,
      is_default: row.is_default,
      is_active: row.is_active,
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      const payload = { ...form, rate: form.rate };
      if (editing) await api(`/api/tax-rates/${editing.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      else await api("/api/tax-rates/", { method: "POST", body: JSON.stringify(payload) });
      setOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
    } finally {
      setPending(false);
    }
  }

  async function remove(row: TaxRate) {
    if (!confirm(`Delete ${row.name}?`)) return;
    await api(`/api/tax-rates/${row.id}/`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Module 1"
        title="Tax rates"
        description="GST, VAT or local rates. Inclusive vs exclusive is stored here for later POS totals."
        action={<Button onClick={startCreate}>Add tax</Button>}
      />
      {rows.length === 0 ? (
        <Empty title="No tax rates" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Flags</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-paper-100">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.code}</td>
                  <td className="px-4 py-3">{row.rate}%</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.is_default ? <Badge tone="copper">Default</Badge> : null}
                      {row.is_inclusive ? <Badge>Inclusive</Badge> : <Badge>Exclusive</Badge>}
                      <Badge tone={row.is_active ? "good" : "warn"}>{row.is_active ? "Active" : "Off"}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" onClick={() => startEdit(row)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => remove(row)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} title={editing ? "Edit tax" : "New tax"} onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="grid gap-3">
          <Field label="Name" error={errors.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Code" error={errors.code}>
            <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </Field>
          <Field label="Rate %" error={errors.rate}>
            <Input type="number" step="0.001" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} required />
          </Field>
          <Toggle label="Inclusive" checked={form.is_inclusive} onChange={(is_inclusive) => setForm({ ...form, is_inclusive })} />
          <Toggle label="Default" checked={form.is_default} onChange={(is_default) => setForm({ ...form, is_default })} />
          <Toggle label="Active" checked={form.is_active} onChange={(is_active) => setForm({ ...form, is_active })} />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save tax"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
