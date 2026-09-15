"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { ListState, Pager, SearchField } from "@/components/DataTable";
import { Badge, Button, Field, Input, Modal, PageHeader, Select } from "@/components/ui";
import { ApiError, api, apiCached, fieldErrors, invalidateApiCache } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { rs } from "@/lib/money";
import { usePagedList } from "@/lib/query";
import type { Category, Product, Unit } from "@/lib/types";

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  unit: "",
  cost_price: "0",
  selling_price: "0",
  duration_minutes: "0",
  warranty_days: "0",
  description: "",
};

export default function ServicesPage() {
  const { can } = useAuth();
  const services = usePagedList<Product>("/api/products/", { extraParams: { item_kind: "service" } });
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [form, setForm] = useState(emptyForm);

  const serviceCategories = useMemo(
    () => categories.filter((row) => !row.kind || row.kind === "service"),
    [categories],
  );

  async function loadLookups() {
    const [c, u] = await Promise.all([
      apiCached<Category[]>("/api/categories/?kind=service"),
      apiCached<Unit[]>("/api/units/"),
    ]);
    const allCats = Array.isArray(c) ? c : [];
    setCategories(allCats);
    setUnits(u);
    const job = u.find((row) => row.short_code.toLowerCase() === "job") || u[0];
    setForm((prev) => ({
      ...prev,
      unit: prev.unit || job?.id || "",
      category: prev.category || allCats[0]?.id || "",
    }));
  }

  useEffect(() => {
    loadLookups().catch(() => {});
  }, []);

  function startCreate() {
    const job = units.find((row) => row.short_code.toLowerCase() === "job") || units[0];
    setEditing(null);
    setErrors({});
    setForm({
      ...emptyForm,
      unit: job?.id || "",
      category: serviceCategories[0]?.id || "",
    });
    setOpen(true);
  }

  function startEdit(row: Product) {
    setEditing(row);
    setErrors({});
    setForm({
      name: row.name,
      sku: row.sku,
      category: row.category || "",
      unit: row.unit,
      cost_price: row.cost_price,
      selling_price: row.selling_price,
      duration_minutes: String(row.duration_minutes ?? 0),
      warranty_days: String(row.warranty_days ?? 0),
      description: row.description || "",
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    const payload = {
      name: form.name,
      sku: form.sku,
      category: form.category || null,
      unit: form.unit,
      cost_price: form.cost_price,
      selling_price: form.selling_price,
      duration_minutes: Number(form.duration_minutes || 0),
      warranty_days: Number(form.warranty_days || 0),
      description: form.description,
      item_kind: "service",
      track_stock: false,
      has_variants: false,
    };
    try {
      if (editing) {
        await api(`/api/products/${editing.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await api("/api/products/", { method: "POST", body: JSON.stringify(payload) });
      }
      setOpen(false);
      invalidateApiCache("/api/products");
      await services.reload();
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
    } finally {
      setPending(false);
    }
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    await api("/api/categories/", {
      method: "POST",
      body: JSON.stringify({ name: newCategory.trim(), kind: "service" }),
    });
    setNewCategory("");
    invalidateApiCache("/api/categories");
    await loadLookups();
  }

  async function seedTemplates() {
    setSeeding(true);
    try {
      await api("/api/products/seed-templates/", { method: "POST" });
      invalidateApiCache("/api/products");
      invalidateApiCache("/api/categories");
      invalidateApiCache("/api/units");
      await loadLookups();
      await services.reload();
    } finally {
      setSeeding(false);
    }
  }

  async function toggleActive(row: Product) {
    await api(`/api/products/${row.id}/`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !row.is_active, item_kind: "service" }),
    });
    invalidateApiCache("/api/products");
    await services.reload();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Services"
        description="Repair, installation and other jobs with a selling price. They appear on POS with products, without stock tracking."
        action={
          can("product.manage") ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <Button type="button" variant="ghost" onClick={seedTemplates} disabled={seeding}>
                {seeding ? "Loading…" : "Load electronics starters"}
              </Button>
              <Button onClick={startCreate}>Add service</Button>
            </div>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1">
          <SearchField value={services.search} onChange={services.setSearch} placeholder="Search service name or SKU" />
        </div>
        {can("category.manage") || can("product.manage") ? (
          <div className="flex min-w-0 flex-1 gap-2">
            <Input className="min-w-0 flex-1" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New service category" />
            <Button type="button" variant="ghost" className="shrink-0" onClick={addCategory}>
              Add
            </Button>
          </div>
        ) : null}
      </div>

      {serviceCategories.length ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {serviceCategories.map((row) => (
            <span key={row.id} className="rounded-full border border-paper-200 bg-white px-3 py-1 text-xs text-ink-700">
              {row.name}
              {row.product_count != null ? ` · ${row.product_count}` : ""}
            </span>
          ))}
        </div>
      ) : null}

      <ListState
        loading={services.loading}
        count={services.count}
        emptyTitle="No services yet"
        emptyHint="Add a repair or installation with cost and selling price, or load electronics starter jobs."
        cols={8}
      >
        <div className="card overflow-x-auto">
          <table className="min-w-[64rem] w-full text-left text-sm">
            <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
              <tr>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Selling price</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Warranty</th>
                <th className="px-4 py-3">Status</th>
                {can("product.manage") ? <th className="px-4 py-3" /> : null}
              </tr>
            </thead>
            <tbody>
              {services.rows.map((row) => (
                <tr key={row.id} className="border-t border-paper-100 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.name}</p>
                    {row.description ? <p className="mt-0.5 max-w-xs text-xs text-ink-700/55">{row.description}</p> : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{row.sku || "—"}</td>
                  <td className="px-4 py-3">{row.category_name || "—"}</td>
                  <td className="px-4 py-3">{rs(row.cost_price)}</td>
                  <td className="px-4 py-3 font-medium">{rs(row.selling_price)}</td>
                  <td className="px-4 py-3">{row.duration_minutes ? `${row.duration_minutes} min` : "—"}</td>
                  <td className="px-4 py-3">{row.warranty_days ? `${row.warranty_days} days` : "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={row.is_active ? "good" : "warn"}>{row.is_active ? "Active" : "Inactive"}</Badge>
                  </td>
                  {can("product.manage") ? (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" className="text-xs text-copper-700" onClick={() => startEdit(row)}>
                          Edit
                        </button>
                        <button type="button" className="text-xs text-ink-700/60" onClick={() => toggleActive(row)}>
                          {row.is_active ? "Hide" : "Show"}
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={services.page} pages={services.pages} count={services.count} onPage={services.setPage} />
      </ListState>

      <Modal open={open} title={editing ? "Edit service" : "New service"} onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1">
          {errors.detail ? <p className="text-sm text-red-700">{errors.detail}</p> : null}
          <Field label="Service name" error={errors.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="SKU" error={errors.sku}>
              <Input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="Auto if left blank"
              />
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">None</option>
                {serviceCategories.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cost price" error={errors.cost_price}>
              <Input type="number" min="0" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
            </Field>
            <Field label="Selling price" error={errors.selling_price}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.selling_price}
                onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                required
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Unit">
              <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required>
                {units.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name} ({row.short_code})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Duration (minutes)">
              <Input
                type="number"
                min="0"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              />
            </Field>
            <Field label="Warranty (days)">
              <Input
                type="number"
                min="0"
                value={form.warranty_days}
                onChange={(e) => setForm({ ...form, warranty_days: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Notes">
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What this job includes"
            />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : editing ? "Save service" : "Create service"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
