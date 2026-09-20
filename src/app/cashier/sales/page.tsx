"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

import { ReceiptReview } from "@/components/ReceiptSlip";
import { SaleReturnPanel } from "@/components/SaleReturnPanel";
import { TableSkeleton } from "@/components/DataTable";
import { Badge, Button, Modal, PageHeader } from "@/components/ui";
import { api, asList } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { rs } from "@/lib/money";
import type { InvoiceSettings, PosSale, PosSnapshot, ReceiptShop } from "@/lib/types";

export default function CashierSalesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PosSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnTicket, setReturnTicket] = useState<string | null>(null);
  const [slip, setSlip] = useState<PosSale | null>(null);
  const [shop, setShop] = useState<ReceiptShop | null>(null);
  const [invoice, setInvoice] = useState<InvoiceSettings | null>(null);

  function load() {
    setLoading(true);
    api<PosSale[] | { results: PosSale[] }>("/api/pos/sales/?page_size=40")
      .then((data) => setRows(asList(data)))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    api<PosSnapshot>("/api/pos/snapshot/")
      .then((data) => {
        setShop(data.shop || null);
        setInvoice(data.invoice || null);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Counter"
        title="My sales"
        description="Tickets you took on this counter. If a customer brings an item back, open the ticket and return it — stock and cash update automatically."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setReturnTicket("")}>
              <RotateCcw size={16} />
              Return item
            </Button>
            <Link href="/pos" className="btn-copper text-center">
              Open POS
            </Link>
          </div>
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
                  {sale.customer_name || "Walk-in"} · {sale.payment_method}
                </p>
                {sale.status && sale.status !== "completed" ? (
                  <p className="mt-1">
                    <Badge tone={sale.status === "returned" ? "warn" : "copper"}>
                      {sale.status === "returned" ? "Returned" : "Partial return"}
                    </Badge>
                  </p>
                ) : null}
              </div>
              <div className="text-right">
                <p className="font-display text-xl">{rs(sale.net_total || sale.total)}</p>
                {sale.status !== "returned" ? (
                  <button
                    type="button"
                    className="mt-1 text-xs text-copper-700 underline"
                    onClick={() => setReturnTicket(sale.number)}
                  >
                    Return items
                  </button>
                ) : null}
                <button
                  type="button"
                  className="mt-1 block text-xs text-ink-700/70 underline"
                  onClick={() => setSlip(sale)}
                >
                  View slip
                </button>
              </div>
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
                        {numReturned(line) > 0 ? ` · returned ${fmtQty(numReturned(line))}` : ""}
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
      <Modal open={returnTicket !== null} title="Customer return" onClose={() => setReturnTicket(null)}>
        {returnTicket !== null ? (
          <SaleReturnPanel
            initialQuery={returnTicket}
            onDone={() => {
              load();
            }}
          />
        ) : null}
      </Modal>
      <ReceiptReview
        open={!!slip}
        sale={slip}
        shop={shop || { name: user?.business_name || "Shop" }}
        invoice={invoice}
        onClose={() => setSlip(null)}
      />
    </div>
  );
}

function numReturned(line: { returned_qty?: string }) {
  const n = Number(line.returned_qty || 0);
  return Number.isNaN(n) ? 0 : n;
}

function fmtQty(value: string | number) {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("en-PK", { maximumFractionDigits: n % 1 === 0 ? 0 : 3 });
}
