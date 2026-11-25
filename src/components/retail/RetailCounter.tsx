"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Check,
  CreditCard,
  LayoutGrid,
  Pause,
  QrCode,
  Search,
  Tag,
  Trash2,
  UserRound,
} from "lucide-react";

import { apiCached } from "@/lib/api";
import { rs } from "@/lib/money";
import type { CartLine, SaleUnit } from "@/lib/quote";
import type { Category, PosCatalogItem, PosCustomer } from "@/lib/types";

const TILES = ["bg-amber-50 text-amber-700", "bg-sky-50 text-sky-700", "bg-rose-50 text-rose-700", "bg-emerald-50 text-emerald-700", "bg-violet-50 text-violet-700", "bg-orange-50 text-orange-700"];

type PricedLine = CartLine & {
  unit: number;
  list: number;
  lineTotal: number;
  promoName: string;
  free: number;
};

type HeldSale = {
  id: string;
  cart: CartLine[];
  customerId: string;
  manualKind: string;
  manualValue: string;
};

type Props = {
  items: PosCatalogItem[];
  query: string;
  setQuery: (value: string) => void;
  onEnter: () => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  cart: CartLine[];
  priced: PricedLine[];
  subtotal: number;
  discount: number;
  total: number;
  addBundle: (item: PosCatalogItem, unit?: SaleUnit) => void;
  setQty: (id: string, qty: number, unit?: SaleUnit) => void;
  removeLine: (id: string, unit?: SaleUnit) => void;
  clearCart: () => void;
  restoreCart: (lines: CartLine[], customerId: string, manualKind: string, manualValue: string) => void;
  customers: PosCustomer[];
  customerId: string;
  setCustomerId: (id: string) => void;
  manualKind: string;
  setManualKind: (value: string) => void;
  manualValue: string;
  setManualValue: (value: string) => void;
  canDiscount: boolean;
  payMethod: string;
  setPayMethod: (value: string) => void;
  payAmount: string;
  setPayAmount: (value: string) => void;
  onCheckout: () => void;
  pending: boolean;
  error: string;
  message: string;
  shiftOpen: boolean;
  onCamera: () => void;
  onOpenShift: (openingCash: string) => void;
};

export function RetailCounter({
  items,
  query,
  setQuery,
  onEnter,
  searchRef,
  cart,
  priced,
  subtotal,
  discount,
  total,
  addBundle,
  setQty,
  removeLine,
  clearCart,
  restoreCart,
  customers,
  customerId,
  setCustomerId,
  manualKind,
  setManualKind,
  manualValue,
  setManualValue,
  canDiscount,
  payMethod,
  setPayMethod,
  payAmount,
  setPayAmount,
  onCheckout,
  pending,
  error,
  message,
  shiftOpen,
  onCamera,
  onOpenShift,
}: Props) {
  const [chip, setChip] = useState("");
  const [held, setHeld] = useState<HeldSale[]>([]);
  const [holdsOpen, setHoldsOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState("0");
  const [shelves, setShelves] = useState<Category[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiCached<Category[]>("/api/categories/")
      .then((rows) => {
        if (cancelled) return;
        setShelves(productShelves(Array.isArray(rows) ? rows : []));
      })
      .catch(() => {
        if (!cancelled) setShelves(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => shelves ?? shelvesFromCatalog(items), [shelves, items]);

  useEffect(() => {
    if (chip && !categories.some((row) => row.id === chip)) setChip("");
  }, [chip, categories]);

  const visible = items.filter((item) => matchesCategory(item, chip, categories));

  function pickPay(method: string) {
    setPayMethod(method);
    if (method === "credit") setPayAmount("0");
    else if (total > 0) setPayAmount(total.toFixed(2));
  }

  function holdSale() {
    if (cart.length === 0) {
      setHoldsOpen((open) => !open);
      return;
    }
    setHeld((rows) => [
      { id: crypto.randomUUID(), cart, customerId, manualKind, manualValue },
      ...rows,
    ]);
    clearCart();
    setCustomerId("");
    setManualKind("");
    setManualValue("");
    setHoldsOpen(false);
  }

  function resume(row: HeldSale) {
    restoreCart(row.cart, row.customerId, row.manualKind, row.manualValue);
    setHeld((rows) => rows.filter((item) => item.id !== row.id));
    setHoldsOpen(false);
  }

  const pays = [
    { id: "cash", label: "Cash", icon: Banknote },
    { id: "card", label: "Card", icon: CreditCard },
    { id: "bank", label: "UPI / QR", icon: QrCode },
    { id: "credit", label: "Credit", icon: UserRound },
  ];

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(15rem,46%)] gap-3 lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:grid-rows-1">
      <section className="flex min-h-0 flex-col overflow-hidden">
        <div className="mb-3 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                onEnter();
              }}
              placeholder="Search or scan a barcode"
              className="h-11 w-full rounded-2xl border border-white bg-white pl-10 pr-3 text-sm shadow-sm outline-none focus:border-brand-400"
            />
          </div>
          <button
            type="button"
            onClick={onCamera}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm hover:text-brand-700"
            aria-label="Scan with camera"
          >
            <QrCode size={18} />
          </button>
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setChip("")}
            className={`flex min-w-[5.4rem] shrink-0 flex-col items-center gap-1 rounded-2xl px-3 py-2.5 text-xs font-medium shadow-sm ${
              chip === "" ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:text-brand-700"
            }`}
          >
            <LayoutGrid size={18} />
            All items
          </button>
          {categories.map((row) => {
            const active = chip === row.id;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setChip(row.id)}
                className={`flex min-w-[5.4rem] shrink-0 flex-col items-center gap-1 rounded-2xl px-3 py-2.5 text-xs font-medium shadow-sm ${
                  active ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:text-brand-700"
                }`}
              >
                <Tag size={18} />
                {row.name}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {visible.slice(0, 80).map((item) => {
              const out = item.track_stock && Number(item.qty) <= 0;
              const meta = [item.size, typeName(item.garment_type)].filter(Boolean).join(" · ");
              return (
                <article key={item.id} className={`flex flex-col rounded-2xl bg-white p-3 shadow-sm ${out ? "opacity-60" : ""}`}>
                  <div className={`mb-3 grid h-24 place-items-center rounded-xl text-3xl font-semibold ${tileTone(item.product)}`}>
                    {(item.product || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.product}</p>
                  {meta ? <p className="mt-0.5 text-[11px] text-slate-400">{meta}</p> : null}
                  <p className="mt-1 text-xs font-medium text-brand-600">
                    {item.track_stock ? `Stock: ${fmtQty(item.qty)}` : "Not tracked"}
                  </p>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                    <div>
                      <p className="text-base font-bold text-brand-700">{rs(item.selling_price)}</p>
                      {Number(item.pack_price) > 0 && Number(item.pack_quantity) > 0 ? (
                        <button type="button" className="text-[11px] font-medium text-slate-500 hover:text-brand-700" onClick={() => addBundle(item, "pack")}>
                          Pack {rs(item.pack_price)}
                        </button>
                      ) : null}
                      {Number(item.carton_price) > 0 && Number(item.carton_quantity) > 0 ? (
                        <button type="button" className="block text-[11px] font-medium text-slate-500 hover:text-brand-700" onClick={() => addBundle(item, "carton")}>
                          Carton {rs(item.carton_price)}
                        </button>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      disabled={out}
                      onClick={() => addBundle(item, "piece")}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-lg font-semibold text-white hover:bg-brand-700 disabled:bg-slate-200"
                      aria-label={`Add ${item.product}`}
                    >
                      +
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          {visible.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">No items in this category.</p>
          ) : null}
        </div>
      </section>

      <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <p className="text-base font-semibold text-slate-900">Current sale</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={holdSale}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-300"
            >
              <Pause size={13} />
              Hold{held.length ? ` ${held.length}` : ""}
            </button>
            <button
              type="button"
              onClick={() => {
                clearCart();
                setCustomerId("");
                setManualValue("");
              }}
              className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 size={13} />
              Clear
            </button>
          </div>
        </div>

        {holdsOpen && held.length > 0 ? (
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-2">
            {held.map((row, index) => (
              <button
                key={row.id}
                type="button"
                onClick={() => resume(row)}
                className="flex w-full items-center justify-between py-1.5 text-left text-sm hover:text-brand-700"
              >
                <span>Held sale {held.length - index}</span>
                <span className="text-xs text-slate-400">{row.cart.length} lines</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="border-b border-slate-100 px-4 py-2">
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <UserRound size={14} />
            <select
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none"
            >
              <option value="">Walk-in customer</option>
              {customers.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Item</th>
                <th className="px-2 py-2 font-medium">Qty</th>
                <th className="px-2 py-2 text-right font-medium">Price</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {priced.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                    Tap + on an item to start the sale.
                  </td>
                </tr>
              ) : priced.map((row) => {
                const unit = row.saleUnit || "piece";
                const step = bundleSize(row.item, unit);
                const shown = step > 1 ? row.qty / step : row.qty;
                const rate = step > 1 ? (unit === "pack" ? Number(row.item.pack_price) : Number(row.item.carton_price)) : row.unit;
                const maxPieces = row.item.track_stock ? Math.max(0, Number(row.item.qty)) : 99;
                const maxShown = Math.max(1, Math.floor(maxPieces / step));
                const choices = Math.min(99, Math.max(shown, maxShown));
                const title = [row.item.product, row.item.size, typeName(row.item.garment_type), unit === "piece" ? "" : unit === "pack" ? "Pack" : "Carton"].filter(Boolean).join(" · ");
                return (
                  <tr key={`${row.item.id}:${unit}`} className="border-t border-slate-50 align-middle">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-semibold ${tileTone(row.item.product)}`}>
                          {(row.item.product || "?").slice(0, 1).toUpperCase()}
                        </span>
                        <span className="line-clamp-2 text-xs font-medium text-slate-800">{title}</span>
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <select
                        value={shown}
                        onChange={(event) => setQty(row.item.id, Number(event.target.value) * step, unit)}
                        className="h-8 rounded-lg border border-slate-200 bg-white px-1.5 text-xs"
                      >
                        {Array.from({ length: choices }, (_, index) => index + 1).map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2 text-right text-xs tabular-nums text-slate-600">{rs(rate)}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs font-semibold tabular-nums">{rs(row.lineTotal)}</span>
                        <button type="button" onClick={() => removeLine(row.item.id, unit)} className="text-slate-300 hover:text-red-500" aria-label="Remove">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 border-t border-slate-100 px-4 py-3">
          <Row label="Subtotal" value={rs(subtotal)} />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-500">Discount</span>
            <div className="flex items-center gap-2">
              <select
                value={manualKind || "percent"}
                disabled={!canDiscount}
                onChange={(event) => setManualKind(event.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
              >
                <option value="percent">%</option>
                <option value="fixed">Rs</option>
              </select>
              <input
                value={manualValue}
                disabled={!canDiscount}
                onChange={(event) => {
                  if (!manualKind) setManualKind("percent");
                  setManualValue(event.target.value);
                }}
                placeholder="0.00"
                className="h-8 w-20 rounded-lg border border-slate-200 px-2 text-right text-xs outline-none focus:border-brand-400"
              />
            </div>
          </div>
          {discount > 0 ? <Row label="Discount applied" value={`− ${rs(discount)}`} /> : null}
          <Row label="Tax (0%)" value={rs(0)} />
          <div className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2">
            <span className="text-sm font-semibold text-slate-700">Total</span>
            <span className="text-lg font-bold text-brand-700">{rs(total)}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {pays.map((row) => {
              const Icon = row.icon;
              const active = payMethod === row.id;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => pickPay(row.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border px-1 py-2 text-[11px] font-semibold ${
                    active ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <Icon size={16} />
                  {row.label}
                </button>
              );
            })}
          </div>

          {payMethod === "cash" && !shiftOpen ? (
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <p>Cash is saved on the open drawer. Card, UPI and credit do not need it.</p>
              <div className="mt-2 flex gap-2">
                <input
                  value={openingCash}
                  onChange={(event) => setOpeningCash(event.target.value)}
                  inputMode="decimal"
                  className="h-8 w-24 rounded-lg border border-amber-200 bg-white px-2 text-slate-800"
                  aria-label="Opening cash"
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onOpenShift(openingCash)}
                  className="rounded-lg bg-amber-700 px-2.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  Open drawer
                </button>
              </div>
            </div>
          ) : null}
          {payMethod === "credit" && !customerId ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Pick a customer before selling on credit.</p>
          ) : null}
          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
          {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{message}</p> : null}

          <button
            type="button"
            disabled={pending || cart.length === 0}
            onClick={onCheckout}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            <Check size={16} />
            {pending ? "Saving sale…" : `Complete sale (${rs(total)})`}
          </button>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium tabular-nums text-slate-800">{value}</span>
    </div>
  );
}

function productShelves(rows: Category[]) {
  return rows
    .filter((row) => row.is_active !== false && (row.kind || "product") === "product" && row.name.trim())
    .sort((a, b) => a.name.localeCompare(b.name));
}

function shelvesFromCatalog(items: PosCatalogItem[]): Category[] {
  const seen = new Map<string, Category>();
  for (const item of items) {
    const name = item.category?.trim();
    if (!name) continue;
    const id = item.category_id || name;
    if (!seen.has(id)) seen.set(id, { id, name, is_active: true, kind: "product" });
  }
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function matchesCategory(item: PosCatalogItem, chip: string, categories: Category[]) {
  if (!chip) return true;
  const shelf = categories.find((row) => row.id === chip);
  if (!shelf) return true;
  if (item.category_id) return item.category_id === shelf.id;
  return (item.category || "").trim().toLowerCase() === shelf.name.trim().toLowerCase();
}

function typeName(value?: string) {
  if (value === "jumbo") return "Jumbo";
  if (value === "economy") return "Economy";
  return "";
}

function tileTone(name: string) {
  let n = 0;
  for (const ch of name) n += ch.charCodeAt(0);
  return TILES[n % TILES.length];
}

function fmtQty(value: string | number) {
  const n = Number(value || 0);
  return n.toLocaleString("en-PK", { maximumFractionDigits: n % 1 === 0 ? 0 : 3 });
}

function bundleSize(item: PosCatalogItem, unit: SaleUnit) {
  if (unit === "pack") return Math.max(1, Number(item.pack_quantity) || 1);
  if (unit === "carton") return Math.max(1, Number(item.carton_quantity) || 1);
  return 1;
}
