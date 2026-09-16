"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SaleReturnPanel } from "@/components/SaleReturnPanel";
import { TableSkeleton } from "@/components/DataTable";
import { PageHeader } from "@/components/ui";
import { api, asList } from "@/lib/api";
import { rs } from "@/lib/money";
import type { PosSaleReturn } from "@/lib/types";

export default function ReturnsPage() {
  const [rows, setRows] = useState<PosSaleReturn[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api<PosSaleReturn[] | { results: PosSaleReturn[] }>("/api/pos/returns/?page_size=20")
      .then((data) => setRows(asList(data)))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="POS"
        title="Customer returns"
        description="If a customer comes back and does not want an item, find the ticket, remove it here, and refund them. Stock is put back on the shelf."
        action={
          <Link href="/pos" className="btn-copper text-center">
            Open POS
          </Link>
        }
      />
      <div className="card mb-6 p-5">
        <SaleReturnPanel onDone={() => load()} />
      </div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700/55">Recent returns</p>
      {loading ? <TableSkeleton rows={3} cols={3} /> : null}
      {!loading && rows.length === 0 ? (
        <p className="text-sm text-ink-700/65">No returns yet. Process one from the form above or from the POS register.</p>
      ) : null}
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{row.number}</p>
                <p className="text-xs text-ink-700/55">
                  Ticket {row.sale_number} · {row.customer_name || "Walk-in"} · {row.refund_method}
                </p>
              </div>
              <p className="font-display text-xl">{rs(row.refund_amount)}</p>
            </div>
            {row.lines?.length ? (
              <ul className="mt-3 space-y-1 border-t border-paper-100 pt-3 text-sm">
                {row.lines.map((line) => (
                  <li key={line.id} className="flex justify-between gap-3">
                    <span className="truncate">{line.product_name}</span>
                    <span className="shrink-0">{rs(line.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
