"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, RotateCcw, Search, Trash2 } from "lucide-react";

import { Alert, Button, Field, Input } from "@/components/ui";
import { ApiError, api, asList } from "@/lib/api";
import { money, num, rs } from "@/lib/money";
import type { PosSale, PosSaleReturn } from "@/lib/types";

const PAY_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  bank: "Bank",
  wallet: "Wallet",
};

function apiDetail(err: unknown) {
  if (err instanceof ApiError && err.body && typeof err.body === "object") {
    const body = err.body as Record<string, unknown>;
    const detail = body.detail;
    if (typeof detail === "string") return detail;
    const first = Object.values(body).flat()[0];
    if (typeof first === "string") return first;
  }
  return err instanceof Error ? err.message : "Could not process the return.";
}

function returnable(line: NonNullable<PosSale["lines"]>[number]) {
  if (line.returnable_qty != null) return Math.max(0, num(line.returnable_qty));
  return Math.max(0, num(line.quantity) - num(line.returned_qty));
}

export function SaleReturnPanel({
  initialQuery = "",
  onDone,
}: {
  initialQuery?: string;
  onDone?: (result: PosSaleReturn) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [sale, setSale] = useState<PosSale | null>(null);
  const [recent, setRecent] = useState<PosSale[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [method, setMethod] = useState("cash");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<PosSale[] | { results: PosSale[] }>("/api/pos/sales/?page_size=8")
      .then((data) => setRecent(asList(data)))
      .catch(() => setRecent([]));
  }, []);

  useEffect(() => {
    if (initialQuery.trim()) findTicket(initialQuery.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  function applySale(next: PosSale) {
    setSale(next);
    setError("");
    setMessage("");
    const nextQty: Record<string, number> = {};
    (next.lines || []).forEach((line) => {
      nextQty[line.id] = 0;
    });
    setQty(nextQty);
    setMethod(next.payment_method || "cash");
  }

  async function findTicket(value?: string) {
    const q = (value ?? query).trim();
    if (!q) {
      setError("Type the ticket number from the receipt.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const found = await api<PosSale>(`/api/pos/returns/lookup/?q=${encodeURIComponent(q)}`);
      applySale(found);
      setQuery(found.number);
    } catch (err) {
      setSale(null);
      setError(apiDetail(err));
    } finally {
      setLoading(false);
    }
  }

  const lines = sale?.lines || [];
  const selected = useMemo(
    () =>
      lines
        .map((line) => ({ line, qty: Math.min(qty[line.id] || 0, returnable(line)) }))
        .filter((row) => row.qty > 0),
    [lines, qty],
  );

  const refundPreview = useMemo(() => {
    if (!sale) return 0;
    const subtotal = money(sale.lines?.reduce((sum, line) => sum + num(line.line_total), 0) ?? sale.total);
    const original = money(sale.total);
    if (subtotal <= 0) return 0;
    const remainingNet = money(Math.max(0, original - num(sale.returned_total)));
    const returningAll = lines.every((line) => (qty[line.id] || 0) >= returnable(line)) && selected.length > 0;
    if (returningAll) return remainingNet;
    const share = selected.reduce((sum, row) => {
      const sold = num(row.line.quantity);
      if (sold <= 0) return sum;
      return sum + (num(row.line.line_total) * row.qty * original) / sold / subtotal;
    }, 0);
    return money(Math.min(remainingNet, share));
  }, [sale, lines, qty, selected]);

  const fullyReturned = sale?.status === "returned" || sale?.status === "void";
  const canReturn = selected.length > 0 && !fullyReturned && !pending;

  function setLineQty(id: string, next: number, max: number) {
    const value = Number.isFinite(next) ? Math.max(0, Math.min(max, next)) : 0;
    setQty((prev) => ({ ...prev, [id]: value }));
  }

  function returnAll() {
    const next: Record<string, number> = {};
    lines.forEach((line) => {
      next[line.id] = returnable(line);
    });
    setQty(next);
  }

  async function submit() {
    if (!sale || !canReturn) return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const result = await api<PosSaleReturn>("/api/pos/returns/", {
        method: "POST",
        body: JSON.stringify({
          sale: sale.id,
          refund_method: method,
          reason,
          lines: selected.map((row) => ({ sale_line: row.line.id, quantity: String(row.qty) })),
        }),
      });
      setMessage(
        `Return ${result.number} saved. Refund ${rs(result.refund_amount)}${
          num(result.cash_refunded) > 0 ? ` · give ${rs(result.cash_refunded)} ${PAY_LABEL[result.refund_method] || result.refund_method}` : ""
        }.`,
      );
      if (result.sale_detail) applySale(result.sale_detail);
      else setSale(null);
      onDone?.(result);
    } catch (err) {
      setError(apiDetail(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-700/70">
        Find the original ticket, remove the items the customer does not want, then refund them. Stock comes back.
      </p>
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") findTicket();
          }}
          placeholder="Ticket no. e.g. POS-000012"
          autoFocus
        />
        <Button type="button" variant="copper" className="shrink-0" disabled={loading} onClick={() => findTicket()}>
          <Search size={16} />
          {loading ? "Finding…" : "Find"}
        </Button>
      </div>

      {!sale && recent.length ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700/55">Latest tickets</p>
          <ul className="mt-2 space-y-1.5">
            {recent.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-paper-200 bg-white px-3 py-2 text-left text-sm hover:border-copper-300"
                  onClick={() => applySale(row)}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{row.number}</span>
                    <span className="block truncate text-xs text-ink-700/55">
                      {row.customer_name || "Walk-in"}
                      {row.status && row.status !== "completed" ? ` · ${row.status}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">{rs(row.net_total || row.total)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {sale ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-paper-50 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{sale.number}</p>
                <p className="text-xs text-ink-700/55">
                  {sale.customer_name || "Walk-in"}
                  {sale.payment_method ? ` · ${PAY_LABEL[sale.payment_method] || sale.payment_method}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl">{rs(sale.net_total || sale.total)}</p>
                {num(sale.returned_total) > 0 ? (
                  <p className="text-xs text-copper-700">Returned {rs(sale.returned_total)}</p>
                ) : null}
              </div>
            </div>
          </div>

          {fullyReturned ? (
            <p className="text-sm text-ink-700/70">This ticket is fully returned. Nothing left to take back.</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700/55">Items to return</p>
                <button type="button" className="text-xs text-copper-700 underline" onClick={returnAll}>
                  Return all
                </button>
              </div>
              <ul className="space-y-2">
                {lines.map((line) => {
                  const max = returnable(line);
                  const current = qty[line.id] || 0;
                  const done = max <= 0;
                  return (
                    <li key={line.id} className="rounded-xl border border-paper-200 px-3 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{line.product_name}</p>
                          <p className="text-xs text-ink-700/55">
                            Sold {fmtQty(line.quantity)}
                            {line.sku ? ` · ${line.sku}` : ""}
                            {done ? " · already returned" : ` · ${fmtQty(max)} left`}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm">{rs(line.line_total)}</p>
                      </div>
                      {done ? null : (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            className="grid h-9 w-9 place-items-center rounded-lg border border-paper-200"
                            onClick={() => setLineQty(line.id, current - 1, max)}
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            className="field h-9 w-16 text-center"
                            value={current || ""}
                            inputMode="decimal"
                            onChange={(e) => setLineQty(line.id, Number(e.target.value || 0), max)}
                          />
                          <button
                            type="button"
                            className="grid h-9 w-9 place-items-center rounded-lg border border-paper-200"
                            onClick={() => setLineQty(line.id, current + 1, max)}
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            type="button"
                            className="ml-auto text-xs text-ink-700/60 underline"
                            onClick={() => setLineQty(line.id, max, max)}
                          >
                            All {fmtQty(max)}
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="grid grid-cols-3 gap-2">
                {(["cash", "card", "bank"] as const).map((row) => (
                  <button
                    key={row}
                    type="button"
                    onClick={() => setMethod(row)}
                    className={`rounded-xl border px-2 py-2 text-xs font-medium ${
                      method === row ? "border-ink-950 bg-ink-950 text-paper-50" : "border-paper-200 bg-white text-ink-700"
                    }`}
                  >
                    Refund {PAY_LABEL[row]}
                  </button>
                ))}
              </div>
              <Field label="Reason (optional)">
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Customer did not want it" />
              </Field>
              <Button className="h-12 w-full text-base" disabled={!canReturn} onClick={submit}>
                {pending ? "Returning…" : `Return items · ${rs(refundPreview)}`}
              </Button>
              {method === "cash" && refundPreview > 0 ? (
                <p className="text-xs text-ink-700/60">Cash refunds need an open drawer. Credit on the ticket is reduced first.</p>
              ) : null}
            </>
          )}
          <button type="button" className="inline-flex items-center gap-1 text-xs text-ink-700/60" onClick={() => setSale(null)}>
            <Trash2 size={12} />
            Find another ticket
          </button>
        </div>
      ) : null}

      {error ? <Alert>{error}</Alert> : null}
      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
    </div>
  );
}

export function ReturnButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-transparent px-3 text-sm text-paper-50 hover:bg-white/10 ${className}`}
    >
      <RotateCcw size={16} />
      Return
    </button>
  );
}

function fmtQty(value: string | number) {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("en-PK", { maximumFractionDigits: n % 1 === 0 ? 0 : 3 });
}
