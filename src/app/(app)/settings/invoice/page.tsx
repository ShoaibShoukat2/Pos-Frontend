"use client";

import { FormEvent, useEffect, useState } from "react";

import { INVOICE_DESIGNS, ReceiptSlip } from "@/components/ReceiptSlip";
import { Button, Field, Input, PageHeader, Select, Textarea, Toggle } from "@/components/ui";
import { api } from "@/lib/api";
import type { InvoiceSettings, PosSale } from "@/lib/types";

const SAMPLE_SALE: PosSale = {
  id: "preview",
  number: "INV-000001",
  client_uuid: "preview",
  subtotal: "680.00",
  total: "650.00",
  net_total: "650.00",
  paid_amount: "700.00",
  due_amount: "0.00",
  discount_total: "30.00",
  loyalty_earned: "0",
  payment_method: "cash",
  customer_name: "Walk-in",
  cashier_name: "Cashier",
  branch_name: "Head office",
  sold_at: new Date().toISOString(),
  lines: [
    {
      id: "1",
      product_name: "Sample product",
      variant_name: "Sample product",
      sku: "SKU-100",
      quantity: "2",
      unit_price: "250.00",
      line_total: "500.00",
    },
    {
      id: "2",
      product_name: "Second item",
      variant_name: "Second item",
      sku: "SKU-240",
      quantity: "1",
      unit_price: "180.00",
      line_total: "180.00",
    },
  ],
};

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
        description="Number format, paper size, and the invoice design used when you print."
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
            <p className="text-sm font-medium text-ink-950">Invoice design</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {INVOICE_DESIGNS.map((item) => {
                const active = (form.design || "classic") === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setForm({ ...form, design: item.id })}
                    className={`rounded-xl border px-3 py-3 text-left ${
                      active ? "border-copper-500 bg-copper-400/10 ring-2 ring-copper-500/20" : "border-paper-200 bg-white"
                    }`}
                  >
                    <span className="block text-sm font-medium text-ink-950">{item.label}</span>
                    <span className="mt-1 block text-xs text-ink-700/70">{item.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
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
        <div className="card bg-paper-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-copper-600">Slip preview</p>
          <p className="mt-1 text-sm text-ink-700/70">This is the invoice the owner and cashier print.</p>
          <div className="mt-4 overflow-x-auto">
            <ReceiptSlip
              sale={{ ...SAMPLE_SALE, number: form.preview_number || SAMPLE_SALE.number }}
              shop={{ name: "Your business", city: "City", phone: "03xx-xxxxxxx" }}
              invoice={form as InvoiceSettings}
              tendered={700}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
