"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { TableSkeleton } from "@/components/DataTable";
import { PageHeader } from "@/components/ui";
import { api, asList } from "@/lib/api";
import { rs } from "@/lib/money";
import type { PosSale } from "@/lib/types";

export default function CashierSalesPage() {
  const [rows, setRows] = useState<PosSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<PosSale[] | { results: PosSale[] }>("/api/pos/sales/?page_size=40")
      .then((data) => setRows(asList(data)))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Counter"
        title="My sales"
        description="Tickets you took on this counter, with the products on each ticket. You cannot add catalog items here."
        action={
          <Link href="/pos" className="btn-copper text-center">
            Open POS
          </Link>
        }
      />
      {loading ? <TableSkeleton rows={4} cols={3} /> : null}
      {!loading && rows.length === 0 ? (
        <p className="card px-5 py-10 text-sm text-ink-700/70">No tickets yet. Sell from POS — scan or type the SKU.</p>
      ) : null}
      <ul className="space-y-3">
        {rows.map((sale) => (
          <li key={sale.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{sale.number}</p>
                <p className="text-xs text-ink-700/55">
                  {sale.customer_name || "Walk-in"} · {sale.payment_method} · {sale.branch_name}
                </p>
              </div>
              <p className="font-display text-xl">{rs(sale.total)}</p>
            </div>
            {sale.lines?.length ? (
              <ul className="mt-3 space-y-1.5 border-t border-paper-100 pt-3 text-sm">
                {sale.lines.map((line) => (
                  <li key={line.id} className="flex justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{line.product_name}</span>
                      <span className="block text-xs text-ink-700/55">
                        {fmtQty(line.quantity)}
                        {line.sku ? ` · ${line.sku}` : ""}
                        {line.promo_name ? ` · ${line.promo_name}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0">{rs(line.line_total)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-700/60">No line details on this ticket.</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function fmtQty(value: string) {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString("en-PK", { maximumFractionDigits: n % 1 === 0 ? 0 : 3 });
}
