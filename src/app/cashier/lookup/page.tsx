"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/ui";
import { api, asList } from "@/lib/api";
import { num, rs } from "@/lib/money";
import { useDebounced } from "@/lib/query";
import type { PosCatalogItem } from "@/lib/types";

export default function CashierLookupPage() {
  const [query, setQuery] = useState("");
  const remoteQuery = useDebounced(query, 250);
  const [items, setItems] = useState<PosCatalogItem[]>([]);

  useEffect(() => {
    const search = remoteQuery.trim();
    const path = search
      ? `/api/pos/catalog/?search=${encodeURIComponent(search)}&page_size=40`
      : "/api/pos/snapshot/";
    const ctrl = new AbortController();
    api<PosCatalogItem[] | { results: PosCatalogItem[]; catalog?: PosCatalogItem[] }>(path, { signal: ctrl.signal })
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
        else if (Array.isArray(data.catalog)) setItems(data.catalog);
        else setItems(asList(data));
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setItems([]);
      });
    return () => ctrl.abort();
  }, [remoteQuery]);

  return (
    <div>
      <PageHeader
        eyebrow="Counter"
        title="Find to sell"
        description="Look up selling price, SKU and stock for the ticket. Services show duration instead of stock. You cannot add or edit catalog items."
        action={
          <Link href="/pos" className="btn-copper text-center">
            Open POS
          </Link>
        }
      />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name, SKU or barcode"
        className="field mb-5"
        autoFocus
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.slice(0, 40).map((item) => {
          const qty = num(item.qty);
          const service = (item.item_kind || "product") === "service";
          const stock = service
            ? item.duration_minutes
              ? `${item.duration_minutes} min`
              : "Service"
            : !item.track_stock
              ? "No track"
              : qty <= 0
                ? "Out of stock"
                : qty <= 5
                  ? "Low stock"
                  : "In stock";
          return (
            <div key={item.id} className="card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-copper-600">
                {service ? "Service" : item.category || "Uncategorized"}
                {service && item.category ? ` · ${item.category}` : ""}
              </p>
              <p className="mt-1 font-medium">{item.product}</p>
              <p className="text-xs text-ink-700/55">
                {item.variant && item.variant !== item.product ? `${item.variant} · ` : ""}
                {item.sku || "No SKU"}
              </p>
              <div className="mt-3 flex items-end justify-between gap-2">
                <p className="font-display text-xl">{rs(item.selling_price)}</p>
                <p className="text-xs text-ink-700/55">
                  {service ? stock : `${stock} · ${fmtQty(item.qty)} on hand`}
                </p>
              </div>
              <Link
                href={`/pos?sku=${encodeURIComponent(item.sku || item.barcode || item.product)}`}
                className="btn-primary mt-4 w-full text-center"
              >
                Sell on POS
              </Link>
            </div>
          );
        })}
      </div>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-ink-700/65">
          {query.trim() ? "No matching product or service to sell." : "Items appear once the owner adds products or services."}
        </p>
      ) : null}
    </div>
  );
}

function fmtQty(value: string) {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString("en-PK", { maximumFractionDigits: n % 1 === 0 ? 0 : 3 });
}
