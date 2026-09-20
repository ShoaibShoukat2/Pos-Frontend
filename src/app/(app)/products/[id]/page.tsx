"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Badge, Button, Field, Input, Modal, PageHeader, Select } from "@/components/ui";
import { ApiError, api, apiCached, fieldErrors, invalidateApiCache } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Brand, Category, Product } from "@/lib/types";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    brand: "",
    cost_price: "0",
    selling_price: "0",
    min_stock: "0",
  });

  async function load() {
    const row = await api<Product>(`/api/products/${params.id}/`);
    setProduct(row);
  }

  useEffect(() => {
    load().catch(() => {});
    Promise.all([apiCached<Category[]>("/api/categories/"), apiCached<Brand[]>("/api/brands/")])
      .then(([c, b]) => {
        setCategories(c);
        setBrands(b);
      })
      .catch(() => {});
  }, [params.id]);

  function startEdit() {
    if (!product) return;
    setErrors({});
    setForm({
      name: product.name,
      sku: product.sku || "",
      barcode: product.barcode || "",
      category: product.category || "",
      brand: product.brand || "",
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      min_stock: product.min_stock || "0",
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!product) return;
    setPending(true);
    setErrors({});
    try {
      await api(`/api/products/${product.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          barcode: form.barcode,
          category: form.category || null,
          brand: form.brand || null,
          cost_price: form.cost_price,
          selling_price: form.selling_price,
          min_stock: form.min_stock,
          item_kind: "product",
        }),
      });
      setOpen(false);
      invalidateApiCache("/api/products");
      await load();
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!product) return;
    if (!confirm(`Delete ${product.name}? If it was already sold it will be hidden instead.`)) return;
    await api(`/api/products/${product.id}/`, { method: "DELETE" });
    invalidateApiCache("/api/products");
    router.push("/products");
  }

  if (!product) {
    return <p className="text-sm text-ink-700/70">Loading product…</p>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title={product.name}
        description={product.sku || "Product details"}
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {can("product.manage") ? (
              <>
                <Button type="button" onClick={startEdit}>
                  Edit
                </Button>
                <Button type="button" variant="ghost" onClick={remove}>
                  Delete
                </Button>
              </>
            ) : null}
            <Link href="/products" className="btn-ghost text-center">
              Back
            </Link>
          </div>
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {product.item_kind === "service" ? (
          <>
            <Stat label="Selling" value={`Rs ${product.selling_price}`} />
            <Stat label="Cost" value={`Rs ${product.cost_price}`} />
            <Stat label="Duration" value={product.duration_minutes ? `${product.duration_minutes} min` : "—"} />
            <Stat label="Warranty" value={product.warranty_days ? `${product.warranty_days} days` : "—"} />
          </>
        ) : (
          <>
            <Stat label="Selling" value={`Rs ${product.selling_price}`} />
            <Stat label="Cost" value={`Rs ${product.cost_price}`} />
            <Stat label="On hand" value={String(product.total_stock ?? 0)} />
            <Stat label="Min stock" value={String(product.min_stock)} />
          </>
        )}
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
            <tr>
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Barcode</th>
              <th className="px-4 py-3">Sell</th>
              <th className="px-4 py-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            {(product.variants || []).map((variant) => (
              <tr key={variant.id} className="border-t border-paper-100">
                <td className="px-4 py-3">
                  <p className="font-medium">{variant.display_name}</p>
                  {variant.is_default ? <Badge>Default</Badge> : null}
                </td>
                <td className="px-4 py-3">{variant.sku}</td>
                <td className="px-4 py-3">{variant.barcode || "—"}</td>
                <td className="px-4 py-3">Rs {variant.selling_price}</td>
                <td className="px-4 py-3">
                  {(variant.stock_by_branch || []).length === 0 ? (
                    <span className="text-ink-700/50">0</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {variant.stock_by_branch?.map((row) => (
                        <Badge key={row.branch_id} tone={row.is_low ? "warn" : "good"}>
                          {row.quantity}
                        </Badge>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="Edit product" onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1">
          {errors.detail ? <p className="text-sm text-red-700">{errors.detail}</p> : null}
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
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-700/55">{label}</p>
      <p className="stat-value mt-1">{value}</p>
    </div>
  );
}
