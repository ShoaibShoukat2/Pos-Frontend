"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { ListState, Pager, SearchField } from "@/components/DataTable";
import { Button, Field, Input, Modal, PageHeader, Select, Toggle } from "@/components/ui";
import { ApiError, api, apiCached, fieldErrors, invalidateApiCache } from "@/lib/api";
import { isCashier, useAuth } from "@/lib/auth";
import { usePagedList } from "@/lib/query";
import type { Brand, Branch, Category, Product, Unit } from "@/lib/types";

type Tab = "products" | "categories" | "brands";

type VariantRow = {
  size: string;
  color: string;
  sku: string;
  cost_price: string;
  selling_price: string;
  min_stock: string;
  opening: string;
};

const emptyVariant = (): VariantRow => ({
  size: "",
  color: "",
  sku: "",
  cost_price: "",
  selling_price: "",
  min_stock: "0",
  opening: "0",
});

export default function ProductsPage() {
  const { user, can } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("products");
  const products = usePagedList<Product>("/api/products/", {
    enabled: tab === "products",
    extraParams: { item_kind: "product", is_active: "true" },
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    brand: "",
    unit: "",
    cost_price: "0",
    selling_price: "0",
    min_stock: "0",
    has_variants: false,
    opening: "0",
    branch: "",
  });
  const [variantRows, setVariantRows] = useState<VariantRow[]>([emptyVariant()]);
  const [simpleName, setSimpleName] = useState("");

  function defaultUnit(list: Unit[] = units) {
    return list.find((row) => row.short_code.toLowerCase() === "pcs")?.id || list[0]?.id || "";
  }

  async function loadLookups() {
    const [c, b, u, br] = await Promise.all([
      apiCached<Category[]>("/api/categories/"),
      apiCached<Brand[]>("/api/brands/"),
      apiCached<Unit[]>("/api/units/"),
      apiCached<Branch[]>("/api/branches/"),
    ]);
    setCategories(c);
    setBrands(b);
    setUnits(u);
    setBranches(br);
    if (!form.unit && u[0]) setForm((prev) => ({ ...prev, unit: defaultUnit(u), branch: br[0]?.id || "" }));
  }

  useEffect(() => {
    if (isCashier(user)) router.replace("/cashier/lookup");
  }, [user, router]);

  useEffect(() => {
    loadLookups().catch(() => {});
  }, []);

  function startCreate() {
    setEditing(null);
    setErrors({});
    setForm((prev) => ({
      ...prev,
      name: "",
      sku: "",
      barcode: "",
      cost_price: "0",
      selling_price: "0",
      min_stock: "0",
      has_variants: false,
      opening: "0",
      category: categories.find((c) => !c.kind || c.kind === "product")?.id || "",
      brand: brands[0]?.id || "",
      unit: defaultUnit() || prev.unit,
      branch: branches[0]?.id || prev.branch,
    }));
    setVariantRows([emptyVariant()]);
    setOpen(true);
  }

  function startEdit(row: Product) {
    setEditing(row);
    setErrors({});
    setForm({
      name: row.name,
      sku: row.sku || "",
      barcode: row.barcode || "",
      category: row.category || "",
      brand: row.brand || "",
      unit: row.unit || defaultUnit(),
      cost_price: row.cost_price,
      selling_price: row.selling_price,
      min_stock: row.min_stock || "0",
      has_variants: row.has_variants,
      opening: "0",
      branch: branches[0]?.id || "",
    });
    setVariantRows([emptyVariant()]);
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    const payload: Record<string, unknown> = {
      name: form.name,
      sku: form.sku,
      barcode: form.barcode,
      category: form.category || null,
      brand: form.brand || null,
      unit: form.unit || defaultUnit() || undefined,
      cost_price: form.cost_price,
      selling_price: form.selling_price,
      min_stock: form.min_stock,
      item_kind: "product",
    };
    if (!editing) {
      payload.has_variants = form.has_variants;
      if (form.has_variants) {
        payload.variants = variantRows
          .filter((row) => row.sku && (row.size || row.color))
          .map((row) => ({
            sku: row.sku,
            name: [row.size, row.color].filter(Boolean).join(" / "),
            attributes: { ...(row.size ? { Size: row.size } : {}), ...(row.color ? { Color: row.color } : {}) },
            cost_price: row.cost_price || form.cost_price,
            selling_price: row.selling_price || form.selling_price,
            min_stock: row.min_stock || form.min_stock,
            opening_stock:
              Number(row.opening) > 0 && form.branch
                ? [{ branch: form.branch, quantity: row.opening }]
                : [],
          }));
      } else if (Number(form.opening) > 0 && form.branch) {
        payload.opening_stock = [{ branch: form.branch, quantity: form.opening }];
      }
    }
    try {
      if (editing) {
        await api(`/api/products/${editing.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await api("/api/products/", { method: "POST", body: JSON.stringify(payload) });
      }
      setOpen(false);
      setEditing(null);
      invalidateApiCache("/api/products");
      await products.reload();
      await loadLookups();
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
    } finally {
      setPending(false);
    }
  }

  async function remove(row: Product) {
    if (!confirm(`Delete ${row.name}? If it was already sold it will be hidden instead.`)) return;
    await api(`/api/products/${row.id}/`, { method: "DELETE" });
    invalidateApiCache("/api/products");
    await products.reload();
  }

  async function addNamed(kind: "categories" | "brands", name: string) {
    if (!name.trim()) return;
    const body = kind === "categories" ? { name, kind: "product" } : { name };
    await api(`/api/${kind}/`, { method: "POST", body: JSON.stringify(body) });
    setSimpleName("");
    invalidateApiCache(`/api/${kind}`);
    await loadLookups();
  }

  async function removeNamed(kind: "categories" | "brands", row: { id: string; name: string }) {
    if (!confirm(`Delete ${row.name}?`)) return;
    await api(`/api/${kind}/${row.id}/`, { method: "DELETE" });
    invalidateApiCache(`/api/${kind}`);
    await loadLookups();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Add, edit or delete items in your catalog. Repair and installation jobs live in Services."
        action={can("product.manage") ? <Button onClick={startCreate}>Add product</Button> : undefined}
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {(["products", "categories", "brands"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-full px-3 py-1.5 text-sm capitalize ${tab === item ? "bg-ink-950 text-paper-50" : "bg-white border border-paper-200"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "products" ? (
        <>
          <div className="mb-4">
            <SearchField value={products.search} onChange={products.setSearch} placeholder="Search name, SKU or barcode" />
          </div>
          <ListState
            loading={products.loading}
            count={products.count}
            emptyTitle="No products yet"
            emptyHint="Add a grocery item or a clothing product with size/color variants."
            cols={8}
          >
            <div className="card overflow-x-auto">
              <table className="min-w-[64rem] w-full text-left text-sm">
                <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Barcode</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Brand</th>
                    <th className="px-4 py-3">Cost</th>
                    <th className="px-4 py-3">Sell</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Min</th>
                    {can("product.manage") ? <th className="px-4 py-3" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {products.rows.map((row) => (
                    <tr key={row.id} className="border-t border-paper-100 align-top">
                      <td className="px-4 py-3">
                        <Link href={`/products/${row.id}`} className="font-medium hover:text-copper-600">
                          {row.name}
                        </Link>
                        {row.description ? (
                          <p className="mt-0.5 max-w-xs text-xs text-ink-700/55">{row.description}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{row.sku || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.barcode || "—"}</td>
                      <td className="px-4 py-3">{row.category_name || "—"}</td>
                      <td className="px-4 py-3">{row.brand_name || "—"}</td>
                      <td className="px-4 py-3">Rs {row.cost_price}</td>
                      <td className="px-4 py-3 font-medium">Rs {row.selling_price}</td>
                      <td className="px-4 py-3">{row.total_stock ?? "0"}</td>
                      <td className="px-4 py-3">{row.min_stock || "0"}</td>
                      {can("product.manage") ? (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button type="button" className="text-xs text-copper-700" onClick={() => startEdit(row)}>
                              Edit
                            </button>
                            <button type="button" className="text-xs text-red-700" onClick={() => remove(row)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={products.page} pages={products.pages} count={products.count} onPage={products.setPage} />
          </ListState>
        </>
      ) : null}

      {tab === "categories" ? (
        <NamedList
          rows={categories.filter((c) => !c.kind || c.kind === "product")}
          onAdd={(name) => addNamed("categories", name)}
          onDelete={can("category.manage") || can("product.manage") ? (row) => removeNamed("categories", row) : undefined}
          value={simpleName}
          setValue={setSimpleName}
        />
      ) : null}
      {tab === "brands" ? (
        <NamedList
          rows={brands}
          onAdd={(name) => addNamed("brands", name)}
          onDelete={can("brand.manage") || can("product.manage") ? (row) => removeNamed("brands", row) : undefined}
          value={simpleName}
          setValue={setSimpleName}
        />
      ) : null}

      <Modal open={open} title={editing ? "Edit product" : "New product"} onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1">
          {errors.detail || errors.variants ? <p className="text-sm text-red-700">{errors.detail || errors.variants}</p> : null}
          <Field label="Name" error={errors.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="SKU" error={errors.sku}>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
            </Field>
            <Field label="Barcode">
              <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">None</option>
                {categories.filter((c) => !c.kind || c.kind === "product").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Brand">
              <Select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}>
                <option value="">None</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Cost">
              <Input value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
            </Field>
            <Field label="Selling">
              <Input value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
            </Field>
            <Field label="Min stock">
              <Input value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
            </Field>
          </div>
          {!editing ? (
            <Toggle
              label="This product has variants (size / color)"
              checked={form.has_variants}
              onChange={(has_variants) => setForm({ ...form, has_variants })}
            />
          ) : null}
          {!editing ? (
            <Field label="Opening stock branch">
              <Select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                <option value="">No opening stock</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          {editing ? null : !form.has_variants ? (
            <Field label="Opening qty">
              <Input value={form.opening} onChange={(e) => setForm({ ...form, opening: e.target.value })} />
            </Field>
          ) : (
            <div className="space-y-3">
              {variantRows.map((row, index) => (
                <div key={index} className="grid gap-2 rounded-xl border border-paper-200 p-3 sm:grid-cols-3">
                  <Input placeholder="Size" value={row.size} onChange={(e) => updateVariant(index, { size: e.target.value })} />
                  <Input placeholder="Color" value={row.color} onChange={(e) => updateVariant(index, { color: e.target.value })} />
                  <Input placeholder="SKU" value={row.sku} onChange={(e) => updateVariant(index, { sku: e.target.value })} />
                  <Input placeholder="Cost" value={row.cost_price} onChange={(e) => updateVariant(index, { cost_price: e.target.value })} />
                  <Input placeholder="Sell" value={row.selling_price} onChange={(e) => updateVariant(index, { selling_price: e.target.value })} />
                  <Input placeholder="Opening qty" value={row.opening} onChange={(e) => updateVariant(index, { opening: e.target.value })} />
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={() => setVariantRows((rows) => [...rows, emptyVariant()])}>
                Add variant row
              </Button>
            </div>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Save product"}
          </Button>
        </form>
      </Modal>
    </div>
  );

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariantRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
}

function NamedList({
  rows,
  onAdd,
  onDelete,
  value,
  setValue,
}: {
  rows: { id: string; name: string; product_count?: number; kind?: string }[];
  onAdd: (name: string) => void;
  onDelete?: (row: { id: string; name: string }) => void;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="New name" />
        <Button type="button" onClick={() => onAdd(value)}>
          Add
        </Button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-paper-100 first:border-0">
                <td className="px-4 py-3">
                  {row.name}
                  {"kind" in row && row.kind === "service" ? (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-sky-800">Service</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right text-ink-700/60">{row.product_count ?? ""}</td>
                {onDelete ? (
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="text-xs text-red-700" onClick={() => onDelete(row)}>
                      Delete
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
