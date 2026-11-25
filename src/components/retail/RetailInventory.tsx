"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { Package, Plus } from "lucide-react";

import { ListState, Pager, SearchField } from "@/components/DataTable";
import { Alert, Badge, Button, Field, Input, Modal, PageHeader, Select } from "@/components/ui";
import { ApiError, api, apiCached, fieldErrors, invalidateApiCache } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { rs } from "@/lib/money";
import { usePagedList } from "@/lib/query";
import type { Category, Product } from "@/lib/types";

const SIZES = ["NB", "S", "M", "L", "XL", "XXL"] as const;
type Size = (typeof SIZES)[number] | "";
type Garment = "" | "economy" | "jumbo";
type StockFilter = "all" | "low" | "out";

type FormState = {
  name: string;
  size: Size;
  garment_type: Garment;
  quantity: string;
  cost_price: string;
  selling_price: string;
  pack_quantity: string;
  pack_price: string;
  carton_quantity: string;
  carton_price: string;
  barcode: string;
  min_stock: string;
  category: string;
};

type Summary = {
  medicines: number;
  on_hand_qty: string;
  stock_value: string;
  low_stock: number;
  out_of_stock: number;
};

const emptyForm = (): FormState => ({
  name: "",
  size: "M",
  garment_type: "economy",
  quantity: "",
  cost_price: "",
  selling_price: "",
  pack_quantity: "",
  pack_price: "",
  carton_quantity: "",
  carton_price: "",
  barcode: "",
  min_stock: "0",
  category: "",
});

function pcs(value?: string | null) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-PK", { maximumFractionDigits: n % 1 === 0 ? 0 : 3 });
}

function blankIfZero(value?: string | null) {
  const n = Number(value || 0);
  if (!n) return "";
  return String(n);
}

function typeLabel(value?: string) {
  if (value === "jumbo") return "Jumbo";
  if (value === "economy") return "Economy";
  return "—";
}

function defaultVariant(product: Product) {
  return product.variants?.find((row) => row.is_default) || product.variants?.[0];
}

export function RetailInventory() {
  const { can } = useAuth();
  const manage = can("product.manage");
  const adjust = can("stock.adjust");
  const [size, setSize] = useState<Size>("");
  const [garment, setGarment] = useState<Garment>("");
  const [stock, setStock] = useState<StockFilter>("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [variantId, setVariantId] = useState("");
  const [onHand, setOnHand] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [categoryName, setCategoryName] = useState("");

  const list = usePagedList<Product>("/api/products/", {
    extraParams: {
      item_kind: "product",
      is_active: "true",
      size: size || undefined,
      garment_type: garment || undefined,
      low_stock: stock === "low" ? "1" : undefined,
      out: stock === "out" ? "1" : undefined,
    },
  });

  useEffect(() => {
    apiCached<Category[]>("/api/categories/")
      .then((rows) => setCategories(rows.filter((row) => !row.kind || row.kind === "product")))
      .catch(() => setCategories([]));
    api<Summary>("/api/inventory/summary/")
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [list.rows]);

  function loadCategories() {
    invalidateApiCache("/api/categories");
    api<Category[]>("/api/categories/")
      .then((rows) => setCategories(rows.filter((row) => !row.kind || row.kind === "product")))
      .catch(() => setCategories([]));
  }

  function refresh() {
    invalidateApiCache("/api/products");
    list.reload();
    api<Summary>("/api/inventory/summary/").then(setSummary).catch(() => {});
  }

  async function addCategory(event: FormEvent) {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) return;
    setError("");
    try {
      await api("/api/categories/", { method: "POST", body: JSON.stringify({ name, kind: "product" }) });
      setCategoryName("");
      loadCategories();
    } catch (err) {
      const fields = err instanceof ApiError ? fieldErrors(err.body) : {};
      setError(fields.name || fields.detail || "Could not add this category.");
    }
  }

  async function removeCategory(row: Category) {
    if (!confirm(`Delete category ${row.name}?`)) return;
    try {
      await api(`/api/categories/${row.id}/`, { method: "DELETE" });
      loadCategories();
    } catch {
      setError("This category is still used by an item, so it cannot be deleted.");
    }
  }

  function openCreate() {
    setEditing(null);
    setVariantId("");
    setOnHand(0);
    setForm(emptyForm());
    setError("");
    setOpen(true);
  }

  async function openEdit(row: Product) {
    setError("");
    setPending(true);
    try {
      const full = await api<Product>(`/api/products/${row.id}/`);
      const variant = defaultVariant(full);
      setEditing(full);
      setVariantId(variant?.id || "");
      setOnHand(Number(full.total_stock || 0));
      setForm({
        name: full.name,
        size: (variant?.size || full.size || "") as Size,
        garment_type: ((variant?.garment_type || full.garment_type || "") as Garment) || "economy",
        quantity: pcs(full.total_stock),
        cost_price: full.cost_price || "",
        selling_price: full.selling_price || "",
        pack_quantity: blankIfZero(variant?.pack_quantity || full.pack_quantity),
        pack_price: blankIfZero(variant?.pack_price || full.pack_price),
        carton_quantity: blankIfZero(variant?.carton_quantity || full.carton_quantity),
        carton_price: blankIfZero(variant?.carton_price || full.carton_price),
        barcode: full.barcode || "",
        min_stock: full.min_stock || "0",
        category: full.category || "",
      });
      setOpen(true);
    } catch {
      setError("Could not open this inventory item.");
    } finally {
      setPending(false);
    }
  }

  function validate() {
    if (!form.name.trim()) return "Enter a product name.";
    if (!form.size) return "Choose a size.";
    if (!form.garment_type) return "Choose Economy or Jumbo.";
    const piece = Number(form.selling_price || 0);
    if (!(piece >= 0)) return "Enter a piece selling price.";
    const packQty = Number(form.pack_quantity || 0);
    const packPrice = Number(form.pack_price || 0);
    if (packQty > 0 && !(packPrice > 0)) return "Enter the pack price.";
    if (packPrice > 0 && !(packQty > 0)) return "Enter how many pieces are in one pack.";
    const cartonQty = Number(form.carton_quantity || 0);
    const cartonPrice = Number(form.carton_price || 0);
    if (cartonQty > 0 && !(cartonPrice > 0)) return "Enter the carton price.";
    if (cartonPrice > 0 && !(cartonQty > 0)) return "Enter how many pieces are in one carton.";
    if (form.quantity !== "" && Number(form.quantity) < 0) return "Quantity cannot be negative.";
    return "";
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setPending(true);
    setError("");
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      category: form.category || null,
      cost_price: form.cost_price || "0",
      selling_price: form.selling_price || "0",
      min_stock: form.min_stock || "0",
      item_kind: "product",
      size: form.size,
      garment_type: form.garment_type,
      pack_quantity: form.pack_quantity || "0",
      pack_price: form.pack_price || "0",
      carton_quantity: form.carton_quantity || "0",
      carton_price: form.carton_price || "0",
    };
    if (!editing && Number(form.quantity) > 0) {
      payload.opening_stock = [{ quantity: form.quantity }];
    }
    try {
      if (editing) {
        await api(`/api/products/${editing.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
        const nextQty = Number(form.quantity || 0);
        const delta = Math.round((nextQty - onHand) * 1000) / 1000;
        if (variantId && Math.abs(delta) > 0.0001) {
          if (!adjust) {
            setError("Prices saved. You need stock access to change the quantity.");
            refresh();
            return;
          }
          await api("/api/stock-operations/", {
            method: "POST",
            body: JSON.stringify({
              kind: delta > 0 ? "stock_in" : "stock_out",
              reason: "Inventory update",
              lines: [{ variant: variantId, quantity: Math.abs(delta) }],
            }),
          });
        }
      } else {
        await api("/api/products/", { method: "POST", body: JSON.stringify(payload) });
      }
      setOpen(false);
      setEditing(null);
      refresh();
    } catch (err) {
      const fields = err instanceof ApiError ? fieldErrors(err.body) : {};
      setError(fields.detail || fields.quantity || fields.size || fields.garment_type || Object.values(fields)[0] || "Could not save this item.");
    } finally {
      setPending(false);
    }
  }

  async function remove(row: Product) {
    if (!confirm(`Delete ${row.name}? If it was already sold it will be hidden instead.`)) return;
    await api(`/api/products/${row.id}/`, { method: "DELETE" });
    refresh();
  }

  return (
    <div>
      <PageHeader
        eyebrow="General retail"
        title="Inventory"
        description="Stock each size as Economy or Jumbo. Set the piece price, the pack price, and the carton (cotton) price. POS sells all three."
        action={manage ? <Button onClick={openCreate}><Plus size={16} /> Add item</Button> : undefined}
      />

      {error && !open ? <div className="mb-4"><Alert>{error}</Alert></div> : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {categories.map((row) => (
          <span key={row.id} className="inline-flex items-center gap-1 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-sm text-surface-700">
            {row.name}
            {manage ? (
              <button type="button" className="text-surface-400 hover:text-red-700" onClick={() => removeCategory(row)} aria-label={`Delete ${row.name}`}>
                ×
              </button>
            ) : null}
          </span>
        ))}
        {manage ? (
          <form onSubmit={addCategory} className="flex min-w-[16rem] flex-1 gap-2">
            <Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="New category" />
            <Button type="submit">Add category</Button>
          </form>
        ) : null}
      </div>

      {summary ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Snap icon={Package} label="Items" value={String(summary.medicines)} />
          <Snap label="On hand" value={pcs(summary.on_hand_qty)} />
          <Snap label="Stock value" value={rs(summary.stock_value)} />
          <Snap label="Low / out" value={`${summary.low_stock} / ${summary.out_of_stock}`} />
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-2">
        {([
          ["", "All types"],
          ["economy", "Economy"],
          ["jumbo", "Jumbo"],
        ] as const).map(([id, label]) => (
          <Chip key={id || "all-types"} active={garment === id} onClick={() => setGarment(id)}>{label}</Chip>
        ))}
        <span className="mx-1 hidden h-6 w-px bg-surface-200 sm:block" />
        {(["all", "low", "out"] as StockFilter[]).map((id) => (
          <Chip key={id} active={stock === id} onClick={() => setStock(id)}>
            {id === "all" ? "All stock" : id === "low" ? "Low" : "Out"}
          </Chip>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Chip active={size === ""} onClick={() => setSize("")}>All sizes</Chip>
        {SIZES.map((id) => (
          <Chip key={id} active={size === id} onClick={() => setSize(id)}>{id}</Chip>
        ))}
      </div>
      <div className="mb-4">
        <SearchField value={list.search} onChange={list.setSearch} placeholder="Search product, item code or barcode" />
      </div>

      <ListState loading={list.loading} count={list.count} emptyTitle="No inventory yet" emptyHint="Add a product with its size, type, quantity, pack and carton prices." cols={8}>
        <div className="card overflow-x-auto">
          <table className="min-w-[72rem] w-full text-left text-sm">
            <thead className="bg-surface-50 text-xs uppercase tracking-wide text-surface-400">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Piece</th>
                <th className="px-4 py-3">Per pack</th>
                <th className="px-4 py-3">Per carton</th>
                {manage ? <th className="px-4 py-3" /> : null}
              </tr>
            </thead>
            <tbody>
              {list.rows.map((row) => (
                <tr key={row.id} className="border-t border-surface-100 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-surface-900">{row.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-surface-400">{row.sku || "—"}{row.barcode ? ` · ${row.barcode}` : ""}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">{row.size || "—"}</td>
                  <td className="px-4 py-3">
                    {row.garment_type ? (
                      <Badge tone={row.garment_type === "jumbo" ? "copper" : "neutral"}>{typeLabel(row.garment_type)}</Badge>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{pcs(row.total_stock)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{rs(row.selling_price)}</p>
                    <p className="text-xs text-surface-400">Cost {rs(row.cost_price)}</p>
                  </td>
                  <td className="px-4 py-3">
                    {Number(row.pack_quantity) > 0 ? (
                      <>
                        <p className="font-medium">{rs(row.pack_price)}</p>
                        <p className="text-xs text-surface-400">{pcs(row.pack_quantity)} pcs</p>
                      </>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {Number(row.carton_quantity) > 0 ? (
                      <>
                        <p className="font-medium">{rs(row.carton_price)}</p>
                        <p className="text-xs text-surface-400">{pcs(row.carton_quantity)} pcs</p>
                      </>
                    ) : "—"}
                  </td>
                  {manage ? (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button type="button" className="text-xs font-medium text-brand-700" onClick={() => openEdit(row)}>Edit</button>
                        <button type="button" className="text-xs font-medium text-red-700" onClick={() => remove(row)}>Delete</button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={list.page} pages={list.pages} count={list.count} onPage={list.setPage} />
      </ListState>

      <Modal open={open} title={editing ? "Edit inventory" : "New inventory item"} onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="grid max-h-[74vh] gap-3 overflow-y-auto pr-1">
          {error ? <Alert>{error}</Alert> : null}
          <Field label="Product name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Kids vest" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Size">
              <Select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value as Size })}>
                <option value="">Choose size</option>
                {SIZES.map((id) => <option key={id} value={id}>{id}</option>)}
              </Select>
            </Field>
            <Field label="Type">
              <Select value={form.garment_type} onChange={(e) => setForm({ ...form, garment_type: e.target.value as Garment })}>
                <option value="economy">Economy</option>
                <option value="jumbo">Jumbo</option>
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={editing ? "Quantity on hand" : "Quantity"}>
              <Input inputMode="decimal" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
            </Field>
            <Field label="Cost per piece">
              <Input inputMode="decimal" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} placeholder="0" />
            </Field>
            <Field label="Sell per piece">
              <Input inputMode="decimal" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} placeholder="0" />
            </Field>
          </div>

          <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
            <p className="text-sm font-medium text-surface-900">Per pack</p>
            <p className="mb-3 text-xs text-surface-400">How many pieces are in one pack, and the price of that pack.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Pieces in a pack">
                <Input inputMode="decimal" value={form.pack_quantity} onChange={(e) => setForm({ ...form, pack_quantity: e.target.value })} placeholder="6" />
              </Field>
              <Field label="Pack price">
                <Input inputMode="decimal" value={form.pack_price} onChange={(e) => setForm({ ...form, pack_price: e.target.value })} placeholder="450" />
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
            <p className="text-sm font-medium text-surface-900">Per carton</p>
            <p className="mb-3 text-xs text-surface-400">Carton is the cotton. Pieces inside one carton, and the carton price.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Pieces in a carton">
                <Input inputMode="decimal" value={form.carton_quantity} onChange={(e) => setForm({ ...form, carton_quantity: e.target.value })} placeholder="24" />
              </Field>
              <Field label="Carton price">
                <Input inputMode="decimal" value={form.carton_price} onChange={(e) => setForm({ ...form, carton_price: e.target.value })} placeholder="1600" />
              </Field>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Barcode">
              <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            </Field>
            <Field label="Min stock">
              <Input inputMode="decimal" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
            </Field>
          </div>
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">None</option>
              {categories.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </Select>
          </Field>
          {form.pack_quantity && form.pack_price ? (
            <p className="text-xs text-brand-700">
              Piece {rs(form.selling_price || 0)} · Pack of {pcs(form.pack_quantity)} {rs(form.pack_price)}
              {Number(form.carton_quantity) > 0 ? ` · Carton of ${pcs(form.carton_quantity)} ${rs(form.carton_price || 0)}` : ""}
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : editing ? "Save changes" : "Save item"}</Button>
        </form>
      </Modal>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm ${active ? "bg-surface-900 text-white" : "border border-surface-200 bg-white text-surface-600"}`}
    >
      {children}
    </button>
  );
}

function Snap({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Package }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      {Icon ? (
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Icon size={18} />
        </span>
      ) : null}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-surface-400">{label}</p>
        <p className="font-display text-xl text-surface-900">{value}</p>
      </div>
    </div>
  );
}
