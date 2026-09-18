"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button, Field, Input, PageHeader, Select, Textarea, Toggle } from "@/components/ui";
import { api } from "@/lib/api";
import type { InvoiceSettings } from "@/lib/types";

export default function InvoicePage() {
  const [form, setForm] = useState<Partial<InvoiceSettings>>({});
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<InvoiceSettings>("/api/invoice-settings/").then(setForm);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setSaved(false);
    const updated = await api<InvoiceSettings>("/api/invoice-settings/", {
      method: "PATCH",
      body: JSON.stringify(form),
    });
    setForm(updated);
    setSaved(true);
    setPending(false);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Module 1"
        title="Invoice settings"
        description="Number format and receipt layout. POS printing will read these values later."
      />
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card grid gap-4 p-6 md:grid-cols-2">
          <Field label="Prefix">
            <Input value={form.prefix || ""} onChange={(e) => setForm({ ...form, prefix: e.target.value })} />
          </Field>
          <Field label="Next number">
            <Input
              type="number"
              value={form.next_number || 1}
              onChange={(e) => setForm({ ...form, next_number: Number(e.target.value) })}
            />
          </Field>
          <Field label="Padding">
            <Input
              type="number"
              value={form.number_padding || 6}
              onChange={(e) => setForm({ ...form, number_padding: Number(e.target.value) })}
            />
          </Field>
          <Field label="Paper size">
            <Select
              value={form.paper_size || "80mm"}
              onChange={(e) => setForm({ ...form, paper_size: e.target.value as InvoiceSettings["paper_size"] })}
            >
              <option value="80mm">80mm thermal</option>
              <option value="58mm">58mm thermal</option>
              <option value="A4">A4</option>
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Footer note">
              <Input value={form.footer_note || ""} onChange={(e) => setForm({ ...form, footer_note: e.target.value })} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Terms">
              <Textarea value={form.terms || ""} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
            </Field>
          </div>
          <Toggle label="Show logo" checked={!!form.show_logo} onChange={(show_logo) => setForm({ ...form, show_logo })} />
          <Toggle
            label="Show cashier name"
            checked={!!form.show_cashier_name}
            onChange={(show_cashier_name) => setForm({ ...form, show_cashier_name })}
          />
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save invoice settings"}
            </Button>
            {saved ? <span className="text-sm text-emerald-700">Saved</span> : null}
          </div>
        </div>
        <div className="card p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-copper-600">Preview number</p>
          <p className="stat-value mt-3">{form.preview_number || "INV-000001"}</p>
          <p className="mt-4 text-sm text-ink-700/70">{form.footer_note}</p>
        </div>
      </form>
    </div>
  );
}
