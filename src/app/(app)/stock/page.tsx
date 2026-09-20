"use client";

import { FormEvent, useState } from "react";

import { ListState, Pager, SearchField } from "@/components/DataTable";
import { VariantPicker } from "@/components/VariantPicker";
import { Badge, Button, Field, Input, Modal, PageHeader, Select } from "@/components/ui";
import { ApiError, api, fieldErrors } from "@/lib/api";
import { usePagedList } from "@/lib/query";
import type { StockLevel, StockMovement, StockOperation } from "@/lib/types";

type Tab = "onhand" | "movements" | "operations";

const OPS = [
  { value: "stock_in", label: "Stock in" },
  { value: "stock_out", label: "Stock out" },
  { value: "adjustment", label: "Adjustment (+/−)" },
  { value: "damage", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "count", label: "Stock count" },
];

export default function StockPage() {
  const [tab, setTab] = useState<Tab>("onhand");
  const [lowOnly, setLowOnly] = useState(false);
  const levels = usePagedList<StockLevel>("/api/stock/", {
    enabled: tab === "onhand",
    extraParams: lowOnly ? { low_stock: "1" } : {},
  });
  const movements = usePagedList<StockMovement>("/api/stock-movements/", { enabled: tab === "movements" });
  const operations = usePagedList<StockOperation>("/api/stock-operations/", { enabled: tab === "operations" });
  const [opOpen, setOpOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [op, setOp] = useState({
    kind: "stock_in",
    variant: "",
    quantity: "1",
    counted_quantity: "",
    reason: "",
  });

  async function refreshActive() {
    await Promise.all([levels.reload(), movements.reload(), operations.reload()]);
  }

  async function submitOp(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    const line: Record<string, unknown> = { variant: op.variant, quantity: op.quantity };
    if (op.kind === "count") line.counted_quantity = op.counted_quantity;
    try {
      await api("/api/stock-operations/", {
        method: "POST",
        body: JSON.stringify({
          kind: op.kind,
          reason: op.reason,
          lines: [line],
        }),
      });
      setOpOpen(false);
      await refreshActive();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { detail?: string };
        setErrors({ detail: body.detail || fieldErrors(err.body).non_field_errors || "Could not post operation." });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Module 7"
        title="Stock"
        description="On-hand is a cache. The ledger (movements) is the source of truth."
        action={<Button onClick={() => setOpOpen(true)}>Stock operation</Button>}
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {(["onhand", "movements", "operations"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-full px-3 py-1.5 text-sm capitalize ${tab === item ? "bg-ink-950 text-paper-50" : "bg-white border border-paper-200"}`}
          >
            {item === "onhand" ? "On hand" : item}
          </button>
        ))}
      </div>

      {tab === "onhand" ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <SearchField value={levels.search} onChange={levels.setSearch} placeholder="Search SKU or product" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
              Low stock only
            </label>
          </div>
          <ListState
            loading={levels.loading}
            count={levels.count}
            emptyTitle="No stock yet"
            emptyHint="Receive a purchase or post opening stock on a product."
            cols={5}
          >
            <div className="card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.rows.map((row) => (
                    <tr key={row.id} className="border-t border-paper-100">
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {row.product_name}
                          {row.variant_name !== row.product_name ? ` · ${row.variant_name}` : ""}
                        </p>
                        <p className="text-xs text-ink-700/55">{row.sku}</p>
                      </td>
                      <td className="px-4 py-3">{row.quantity}</td>
                      <td className="px-4 py-3">Rs {row.stock_value}</td>
                      <td className="px-4 py-3">
                        <Badge tone={row.is_low ? "warn" : "good"}>{row.is_low ? "Low" : "OK"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={levels.page} pages={levels.pages} count={levels.count} onPage={levels.setPage} />
          </ListState>
        </>
      ) : null}

      {tab === "movements" ? (
        <>
          <div className="mb-4">
            <SearchField value={movements.search} onChange={movements.setSearch} placeholder="Search movements" />
          </div>
          <ListState loading={movements.loading} count={movements.count} emptyTitle="No movements" cols={5}>
            <div className="card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
                  <tr>
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Delta</th>
                    <th className="px-4 py-3">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.rows.map((row) => (
                    <tr key={row.id} className="border-t border-paper-100">
                      <td className="px-4 py-3 text-xs">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Badge>{row.movement_type.replace("_", " ")}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {row.product_name} · {row.variant_name}
                      </td>
                      <td className="px-4 py-3">{row.quantity}</td>
                      <td className="px-4 py-3">{row.balance_after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={movements.page} pages={movements.pages} count={movements.count} onPage={movements.setPage} />
          </ListState>
        </>
      ) : null}

      {tab === "operations" ? (
        <ListState loading={operations.loading} count={operations.count} emptyTitle="No operations posted">
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <tbody>
                {operations.rows.map((row) => (
                  <tr key={row.id} className="border-t border-paper-100 first:border-0">
                    <td className="px-4 py-3 font-medium">{row.number}</td>
                    <td className="px-4 py-3">{row.kind}</td>
                    <td className="px-4 py-3">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={operations.page} pages={operations.pages} count={operations.count} onPage={operations.setPage} />
        </ListState>
      ) : null}

      <Modal open={opOpen} title="Stock operation" onClose={() => setOpOpen(false)}>
        <form onSubmit={submitOp} className="grid gap-3">
          {errors.detail ? <p className="text-sm text-red-700">{errors.detail}</p> : null}
          <Field label="Type">
            <Select value={op.kind} onChange={(e) => setOp({ ...op, kind: e.target.value })}>
              {OPS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Variant">
            <VariantPicker value={op.variant} onChange={(variant) => setOp({ ...op, variant })} required />
          </Field>
          {op.kind === "count" ? (
            <Field label="Counted quantity">
              <Input value={op.counted_quantity} onChange={(e) => setOp({ ...op, counted_quantity: e.target.value })} required />
            </Field>
          ) : (
            <Field label={op.kind === "adjustment" ? "Signed quantity (+ add / − remove)" : "Quantity"}>
              <Input value={op.quantity} onChange={(e) => setOp({ ...op, quantity: e.target.value })} required />
            </Field>
          )}
          <Field label="Reason">
            <Input value={op.reason} onChange={(e) => setOp({ ...op, reason: e.target.value })} />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Posting…" : "Post to ledger"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
