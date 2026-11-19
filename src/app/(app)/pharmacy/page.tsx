"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Pill, Plus } from "lucide-react";

import { Pager, SearchField } from "@/components/DataTable";
import { Alert, Badge, Button, Field, Input, Modal, PageHeader, Select } from "@/components/ui";
import { ApiError, api, apiCached, fieldErrors, invalidateApiCache } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { rs } from "@/lib/money";
import { usePagedList } from "@/lib/query";
import type { Brand, Category, Product, ProductVariant } from "@/lib/types";

type Filter = "all" | "low" | "out" | "expiring";
type StockKind = "stock_in" | "stock_out" | "expired" | "damage";

type Summary = {
  medicines: number;
  on_hand_qty: string;
  stock_value: string;
  low_stock: number;
  out_of_stock: number;
  expiring: number;
};

type MedicineForm = {
  name: string;
  generic_name: string;
  strength: string;
  dosage_form: string;
  batch_no: string;
  expiry_date: string;
  barcode: string;
  category: string;
  new_shelf: string;
  company: string;
  cost_price: string;
  selling_price: string;
  min_stock: string;
  opening: string;
  pack_quantity: string;
  pack_price: string;
};

const FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Sachet", "Other"];
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "low", label: "Low" },
  { id: "out", label: "Out" },
  { id: "expiring", label: "Expiring" },
];
const STOCK_KINDS: { id: StockKind; label: string }[] = [
  { id: "stock_in", label: "Stock in" },
  { id: "stock_out", label: "Stock out" },
  { id: "expired", label: "Expired" },
  { id: "damage", label: "Damaged" },
];

const emptyForm = (): MedicineForm => ({
  name: "",
  generic_name: "",
  strength: "",
  dosage_form: "Tablet",
  batch_no: "",
  expiry_date: "",
  barcode: "",
  category: "",
  new_shelf: "",
  company: "",
  cost_price: "",
  selling_price: "",
  min_stock: "5",
  opening: "",
  pack_quantity: "",
  pack_price: "",
});

export function PharmacyDesk() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    api<Summary>("/api/inventory/summary/").then(setData).catch(() => setData(null));
  }, []);

  return (
    <Link href="/pharmacy" className="block rounded-2xl border border-royal-200 bg-white p-4 shadow-sm transition hover:border-royal-800 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-royal-900 text-white">
            <Pill size={18} />
          </span>
          <span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-royal-800">Pharmacy</span>
            <span className="block font-display text-xl text-slate-950">Inventory</span>
            <span className="mt-0.5 block text-sm text-slate-500">Medicines, batches, expiry, and stock on their own page.</span>
          </span>
        </div>
        <span className="inline-flex h-10 items-center justify-center rounded-xl bg-royal-900 px-4 text-sm font-semibold text-white">Open inventory</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <DeskStat label="Medicines" value={data ? String(data.medicines) : "—"} />
        <DeskStat label="On hand" value={data ? qty(data.on_hand_qty) : "—"} />
        <DeskStat label="Low stock" value={data ? String(data.low_stock) : "—"} />
        <DeskStat label="Expiring" value={data ? String(data.expiring) : "—"} />
      </div>
    </Link>
  );
}

export default function PharmacyPage() {
  const { user, can } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<MedicineForm>(emptyForm());
  const [stockFor, setStockFor] = useState<Product | null>(null);
  const [stockKind, setStockKind] = useState<StockKind>("stock_in");
  const [stockQty, setStockQty] = useState("");
  const [stockNote, setStockNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const manage = can("product.manage");
  const adjust = can("stock.adjust");

  const list = usePagedList<Product>("/api/products/", {
    extraParams: {
      item_kind: "product",
      is_active: "true",
      low_stock: filter === "low" ? "1" : undefined,
      out: filter === "out" ? "1" : undefined,
      expiring: filter === "expiring" ? "1" : undefined,
    },
  });

  useEffect(() => {
    if (!user) return;
    if ((user.business_type || "").toLowerCase() !== "pharmacy") router.replace("/products");
  }, [user, router]);

  function loadSummary() {
    api<Summary>("/api/inventory/summary/").then(setSummary).catch(() => setSummary(null));
  }

  function loadLookups() {
    Promise.all([
      apiCached<Category[]>("/api/categories/"),
      apiCached<Brand[]>("/api/brands/"),
    ]).then(([nextCategories, nextBrands]) => {
      setCategories(nextCategories.filter((row) => !row.kind || row.kind === "product"));
      setBrands(nextBrands);
    }).catch(() => {});
  }

  useEffect(() => {
    loadSummary();
    loadLookups();
  }, []);

  function refresh() {
    invalidateApiCache("/api/products/");
    invalidateApiCache("/api/categories/");
    invalidateApiCache("/api/brands/");
    list.reload();
    loadSummary();
    loadLookups();
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setError("");
    setFormOpen(true);
  }

  async function openEdit(row: Product) {
    setError("");
    setPending(true);
    try {
      const full = await api<Product>(`/api/products/${row.id}/`);
      const variant = defaultVariant(full);
      setEditing(full);
      setForm({
        name: full.name,
        generic_name: full.generic_name || "",
        strength: full.strength || "",
        dosage_form: full.dosage_form || "Tablet",
        batch_no: full.batch_no || "",
        expiry_date: full.expiry_date || "",
        barcode: full.barcode || "",
        category: full.category || "",
        new_shelf: "",
        company: full.brand_name || "",
        cost_price: full.cost_price || "",
        selling_price: full.selling_price || "",
        min_stock: full.min_stock || "0",
        opening: "",
        pack_quantity: variant?.pack_quantity && Number(variant.pack_quantity) > 0 ? variant.pack_quantity : "",
        pack_price: variant?.pack_price && Number(variant.pack_price) > 0 ? variant.pack_price : "",
      });
      setFormOpen(true);
    } catch {
      setError("Could not open this medicine.");
    } finally {
      setPending(false);
    }
  }

  async function ensureNamed<T extends { id: string; name: string }>(
    name: string,
    rows: T[],
    path: string,
    extra: Record<string, string> = {},
  ) {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const found = rows.find((row) => row.name.toLowerCase() === trimmed.toLowerCase());
    if (found) return found.id;
    const created = await api<T>(path, { method: "POST", body: JSON.stringify({ name: trimmed, ...extra }) });
    return created.id;
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const brand = await ensureNamed(form.company, brands, "/api/brands/");
      const category = form.new_shelf.trim()
        ? await ensureNamed(form.new_shelf, categories, "/api/categories/", { kind: "product" })
        : (form.category || null);
      const payload = {
        name: form.name.trim(),
        generic_name: form.generic_name.trim(),
        strength: form.strength.trim(),
        dosage_form: form.dosage_form,
        batch_no: form.batch_no.trim(),
        expiry_date: form.expiry_date || null,
        barcode: form.barcode.trim(),
        category,
        brand,
        cost_price: form.cost_price || "0",
        selling_price: form.selling_price || "0",
        min_stock: form.min_stock || "0",
        item_kind: "product",
        pack_quantity: form.pack_quantity || "0",
        pack_price: form.pack_price || "0",
        ...(editing ? {} : { opening_stock: Number(form.opening) > 0 ? [{ quantity: form.opening }] : [] }),
      };
      if (editing) {
        await api(`/api/products/${editing.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await api("/api/products/", { method: "POST", body: JSON.stringify(payload) });
      }
      setFormOpen(false);
      refresh();
    } catch (err) {
      const fields = err instanceof ApiError ? fieldErrors(err.body) : {};
      setError(fields.detail || fields.name || fields.sku || Object.values(fields)[0] || "Could not save this medicine.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete(row: Product) {
    if (!window.confirm(`Delete ${row.name}? Sold medicines stay on old bills and leave the shelf.`)) return;
    try {
      await api(`/api/products/${row.id}/`, { method: "DELETE" });
      refresh();
    } catch {
      setError("Could not delete this medicine.");
    }
  }

  function openStock(row: Product) {
    setStockFor(row);
    setStockKind("stock_in");
    setStockQty("");
    setStockNote("");
    setError("");
  }

  async function onStock(event: FormEvent) {
    event.preventDefault();
    if (!stockFor) return;
    const amount = Number(stockQty);
    if (!(amount > 0)) {
      setError("Enter a quantity greater than zero.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const full = await api<Product>(`/api/products/${stockFor.id}/`);
      const variant = defaultVariant(full);
      if (!variant) {
        setError("This medicine has no stock line yet.");
        return;
      }
      await api("/api/stock-operations/", {
        method: "POST",
        body: JSON.stringify({
          kind: stockKind,
          reason: stockNote.trim(),
          lines: [{ variant: variant.id, quantity: amount }],
        }),
      });
      setStockFor(null);
      refresh();
    } catch (err) {
      const fields = err instanceof ApiError ? fieldErrors(err.body) : {};
      setError(fields.detail || fields.quantity || Object.values(fields)[0] || "Could not update stock.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Pharmacy"
        title="Inventory"
        description="Add a medicine, change its price, and move stock in or out. Expiry within 90 days is marked here."
        action={manage ? (
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus size={16} /> Add medicine
          </Button>
        ) : null}
      />

      {error && !formOpen && !stockFor ? <div className="mb-4"><Alert>{error}</Alert></div> : null}

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard label="Medicines" value={summary ? String(summary.medicines) : "—"} />
        <SummaryCard label="On hand" value={summary ? qty(summary.on_hand_qty) : "—"} />
        <SummaryCard label="Stock value" value={summary ? rs(summary.stock_value) : "—"} />
        <SummaryCard label="Low" value={summary ? String(summary.low_stock) : "—"} warn={!!summary && summary.low_stock > 0} />
        <SummaryCard label="Out" value={summary ? String(summary.out_of_stock) : "—"} warn={!!summary && summary.out_of_stock > 0} />
        <SummaryCard label="Expiring" value={summary ? String(summary.expiring) : "—"} warn={!!summary && summary.expiring > 0} />
      </div>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-4 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-lg px-2 py-2 ${filter === item.id ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <SearchField value={list.search} onChange={list.setSearch} placeholder="Search name, generic, batch, barcode" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {list.loading ? <p className="p-6 text-sm text-slate-400">Loading medicines…</p> : list.rows.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium text-slate-800">{list.search ? "No medicine matches that search." : "No medicines on this shelf yet."}</p>
            {manage && !list.search ? (
              <button type="button" onClick={openCreate} className="mt-3 text-sm font-semibold text-royal-800">Add the first medicine</button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="space-y-3 p-3 lg:hidden">
              {list.rows.map((row) => (
                <article key={row.id} className="rounded-2xl border border-slate-200 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">{row.name}</p>
                      <p className="truncate text-xs text-slate-500">{subtitle(row)}</p>
                    </div>
                    <StockBadge row={row} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <Meta label="On hand" value={qty(row.total_stock)} />
                    <Meta label="Sale" value={rs(row.selling_price)} />
                    <Meta label="Batch" value={row.batch_no || "—"} />
                    <Meta label="Expiry" value={row.expiry_date || "—"} />
                  </dl>
                  <RowActions row={row} manage={manage} adjust={adjust} onEdit={() => openEdit(row)} onStock={() => openStock(row)} onDelete={() => onDelete(row)} />
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                  <tr>
                    {["Medicine", "Company", "Batch / expiry", "On hand", "Price", ""].map((head) => (
                      <th key={head || "actions"} className="px-4 py-3 font-semibold">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.rows.map((row) => (
                    <tr key={row.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950">{row.name}</p>
                        <p className="text-xs text-slate-500">{subtitle(row)}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.brand_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>{row.batch_no || "No batch"}</p>
                        <p className="text-xs text-slate-400">{row.expiry_date || "No expiry"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{qty(row.total_stock)}</p>
                        <p className="text-xs text-slate-400">Reorder {qty(row.min_stock)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{rs(row.selling_price)}</p>
                        <p className="text-xs text-slate-400">Cost {rs(row.cost_price)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge row={row} />
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
                          {manage ? <button type="button" onClick={() => openEdit(row)} className="text-royal-800">Edit</button> : null}
                          {adjust ? <button type="button" onClick={() => openStock(row)} className="text-royal-800">Stock</button> : null}
                          {manage ? <button type="button" onClick={() => onDelete(row)} className="text-red-600">Delete</button> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      <Pager page={list.page} pages={list.pages} count={list.count} onPage={list.setPage} />

      <Modal open={formOpen} title={editing ? "Edit medicine" : "Add medicine"} onClose={() => { setFormOpen(false); setError(""); }}>
        <form onSubmit={onSave} className="space-y-3">
          {error ? <Alert>{error}</Alert> : null}
          <Field label="Medicine name">
            <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Generic">
              <Input value={form.generic_name} onChange={(event) => setForm({ ...form, generic_name: event.target.value })} />
            </Field>
            <Field label="Strength">
              <Input value={form.strength} placeholder="500mg" onChange={(event) => setForm({ ...form, strength: event.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Form">
              <Select value={form.dosage_form} onChange={(event) => setForm({ ...form, dosage_form: event.target.value })}>
                {FORMS.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Field>
            <Field label="Shelf">
              <Select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                <option value="">No shelf</option>
                {categories.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </Select>
            </Field>
            <Field label="Or a new shelf">
              <Input value={form.new_shelf} placeholder="Fridge, counter, syrups" onChange={(event) => setForm({ ...form, new_shelf: event.target.value })} />
            </Field>
          </div>
          <Field label="Company">
            <Input value={form.company} list="pharmacy-companies" onChange={(event) => setForm({ ...form, company: event.target.value })} />
            <datalist id="pharmacy-companies">
              {brands.map((row) => <option key={row.id} value={row.name} />)}
            </datalist>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Batch">
              <Input value={form.batch_no} onChange={(event) => setForm({ ...form, batch_no: event.target.value })} />
            </Field>
            <Field label="Expiry">
              <Input type="date" value={form.expiry_date} onChange={(event) => setForm({ ...form, expiry_date: event.target.value })} />
            </Field>
          </div>
          <Field label="Barcode">
            <Input value={form.barcode} onChange={(event) => setForm({ ...form, barcode: event.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Cost">
              <Input inputMode="decimal" value={form.cost_price} onChange={(event) => setForm({ ...form, cost_price: event.target.value })} />
            </Field>
            <Field label="Sale price">
              <Input inputMode="decimal" value={form.selling_price} onChange={(event) => setForm({ ...form, selling_price: event.target.value })} />
            </Field>
            <Field label="Reorder at">
              <Input inputMode="decimal" value={form.min_stock} onChange={(event) => setForm({ ...form, min_stock: event.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Units in a box">
              <Input inputMode="decimal" value={form.pack_quantity} placeholder="10" onChange={(event) => setForm({ ...form, pack_quantity: event.target.value })} />
            </Field>
            <Field label="Box price">
              <Input inputMode="decimal" value={form.pack_price} onChange={(event) => setForm({ ...form, pack_price: event.target.value })} />
            </Field>
          </div>
          {!editing ? (
            <Field label="Opening stock">
              <Input inputMode="decimal" value={form.opening} placeholder="0" onChange={(event) => setForm({ ...form, opening: event.target.value })} />
            </Field>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : editing ? "Update" : "Save medicine"}</Button>
        </form>
      </Modal>

      <Modal open={!!stockFor} title={stockFor ? `Stock · ${stockFor.name}` : "Stock"} onClose={() => { setStockFor(null); setError(""); }}>
        <form onSubmit={onStock} className="space-y-3">
          {error ? <Alert>{error}</Alert> : null}
          <p className="text-sm text-slate-500">On hand now: {qty(stockFor?.total_stock)}</p>
          <Field label="Movement">
            <Select value={stockKind} onChange={(event) => setStockKind(event.target.value as StockKind)}>
              {STOCK_KINDS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </Select>
          </Field>
          <Field label="Quantity">
            <Input required inputMode="decimal" value={stockQty} onChange={(event) => setStockQty(event.target.value)} />
          </Field>
          <Field label="Note">
            <Input value={stockNote} onChange={(event) => setStockNote(event.target.value)} placeholder="Supplier or reason" />
          </Field>
          <Button type="submit" disabled={pending || !adjust} className="w-full">{pending ? "Updating…" : "Update stock"}</Button>
        </form>
      </Modal>
    </div>
  );
}

function DeskStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-xl bg-slate-50 px-3 py-2">
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="block text-sm font-semibold text-slate-900">{value}</span>
    </span>
  );
}

function SummaryCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 truncate text-lg font-semibold ${warn ? "text-red-600" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="truncate font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function RowActions({
  manage,
  adjust,
  onEdit,
  onStock,
  onDelete,
}: {
  row: Product;
  manage: boolean;
  adjust: boolean;
  onEdit: () => void;
  onStock: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <button type="button" disabled={!manage} onClick={onEdit} className="h-9 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 disabled:opacity-40">Edit</button>
      <button type="button" disabled={!adjust} onClick={onStock} className="h-9 rounded-xl border border-royal-200 text-xs font-semibold text-royal-800 disabled:opacity-40">Stock</button>
      <button type="button" disabled={!manage} onClick={onDelete} className="h-9 rounded-xl border border-red-200 text-xs font-semibold text-red-700 disabled:opacity-40">Delete</button>
    </div>
  );
}

function StockBadge({ row }: { row: Product }) {
  const tone = shelfTone(row);
  return <Badge tone={tone.tone}>{tone.label}</Badge>;
}

function shelfTone(row: Product): { label: string; tone: "good" | "warn" | "copper" | "neutral" } {
  const onHand = Number(row.total_stock || 0);
  const min = Number(row.min_stock || 0);
  const expiry = row.expiry_date ? new Date(`${row.expiry_date}T00:00:00`) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (expiry && expiry < today) return { label: "Expired", tone: "copper" };
  if (onHand <= 0) return { label: "Out", tone: "copper" };
  if (expiry) {
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 90);
    if (expiry <= soon) return { label: "Expiring", tone: "warn" };
  }
  if (onHand < min) return { label: "Low", tone: "warn" };
  return { label: "In stock", tone: "good" };
}

function subtitle(row: Product) {
  return [row.generic_name, row.strength, row.dosage_form].filter(Boolean).join(" · ") || row.sku;
}

function qty(value: string | number | null | undefined) {
  const amount = Number(value || 0);
  return amount.toLocaleString("en-PK", { maximumFractionDigits: 0 });
}

function defaultVariant(product: Product): ProductVariant | undefined {
  return product.variants?.find((row) => row.is_default) || product.variants?.[0];
}
