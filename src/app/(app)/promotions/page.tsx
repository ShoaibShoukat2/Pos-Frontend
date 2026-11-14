"use client";

import { FormEvent, useEffect, useState } from "react";

import { Badge, Button, Empty, Field, Input, Modal, PageHeader, Select } from "@/components/ui";
import { ApiError, api, asList, fieldErrors } from "@/lib/api";
import type { Category, Promotion } from "@/lib/types";

const blank = {
  name: "",
  kind: "percent" as Promotion["kind"],
  value: "",
  buy_qty: "1",
  get_qty: "1",
  category: "",
};

const KIND_LABEL: Record<Promotion["kind"], string> = {
  percent: "% off",
  fixed: "Rs off",
  price: "Special price",
  bogo: "Buy X get Y",
};

export default function PromotionsPage() {
  const [rows, setRows] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [promos, cats] = await Promise.all([
      api<Promotion[] | { results: Promotion[] }>("/api/promotions/"),
      api<Category[] | { results: Category[] }>("/api/categories/"),
    ]);
    setRows(asList(promos));
    setCategories(asList(cats));
  }

  useEffect(() => {
    load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  function startCreate() {
    setForm(blank);
    setErrors({});
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      await api("/api/promotions/", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          kind: form.kind,
          value: form.kind === "bogo" ? "0" : form.value || "0",
          buy_qty: form.kind === "bogo" ? form.buy_qty || "1" : "1",
          get_qty: form.kind === "bogo" ? form.get_qty || "1" : "1",
          category: form.category || null,
          product: null,
          variant: null,
          is_active: true,
        }),
      });
      setOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
      else setErrors({ detail: "Could not save this offer." });
    } finally {
      setPending(false);
    }
  }

  async function toggle(row: Promotion) {
    await api(`/api/promotions/${row.id}/`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !row.is_active }),
    });
    await load();
  }

  async function remove(row: Promotion) {
    await api(`/api/promotions/${row.id}/`, { method: "DELETE" });
    setRows((prev) => prev.filter((item) => item.id !== row.id));
  }

  function describe(row: Promotion) {
    if (row.kind === "bogo") return `Buy ${row.buy_qty} get ${row.get_qty} free`;
    if (row.kind === "percent") return `${row.value}% off`;
    if (row.kind === "fixed") return `Rs ${row.value} off`;
    return `Rs ${row.value}`;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Offers"
        title="Promotions"
        description="These prices apply on the POS counter as soon as the offer is active."
        action={<Button onClick={startCreate}>Add offer</Button>}
      />

      {loading ? (
        <p className="text-sm text-surface-400">Loading offers…</p>
      ) : rows.length === 0 ? (
        <Empty title="No offers yet" hint="Add a percent, fixed, special price, or buy-one-get-one deal." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-50 text-xs uppercase tracking-wide text-surface-400">
              <tr>
                <th className="px-4 py-3">Offer</th>
                <th className="px-4 py-3">Deal</th>
                <th className="px-4 py-3">Applies to</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-surface-100">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-surface-400">{KIND_LABEL[row.kind]} · </span>
                    {describe(row)}
                  </td>
                  <td className="px-4 py-3">{row.category_name || row.product_name || row.variant_name || "All products"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={row.is_active ? "good" : "warn"}>{row.is_active ? "Live" : "Paused"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="mr-3 text-xs font-medium text-brand-700" onClick={() => toggle(row)}>
                      {row.is_active ? "Pause" : "Turn on"}
                    </button>
                    <button type="button" className="text-xs font-medium text-red-600" onClick={() => remove(row)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New offer">
        <form onSubmit={onSubmit} className="grid gap-4">
          {errors.detail ? <p className="text-sm text-red-600">{errors.detail}</p> : null}
          <Field label="Name" error={errors.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Type" error={errors.kind}>
            <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Promotion["kind"] })}>
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed rupees off</option>
              <option value="price">Special unit price</option>
              <option value="bogo">Buy X get Y free</option>
            </Select>
          </Field>
          {form.kind === "bogo" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Buy quantity">
                <Input type="number" min={1} value={form.buy_qty} onChange={(e) => setForm({ ...form, buy_qty: e.target.value })} />
              </Field>
              <Field label="Free quantity">
                <Input type="number" min={1} value={form.get_qty} onChange={(e) => setForm({ ...form, get_qty: e.target.value })} />
              </Field>
            </div>
          ) : (
            <Field label={form.kind === "percent" ? "Percent" : "Amount (Rs)"} error={errors.value}>
              <Input type="number" min={0} step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
            </Field>
          )}
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">All products</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save offer"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
