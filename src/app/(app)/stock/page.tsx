"use client";

import { FormEvent, useEffect, useState } from "react";

import { ListState, Pager, SearchField } from "@/components/DataTable";
import { VariantPicker } from "@/components/VariantPicker";
import { Badge, Button, Field, Input, Modal, PageHeader, Select } from "@/components/ui";
import { ApiError, api, apiCached, fieldErrors } from "@/lib/api";
import { usePagedList } from "@/lib/query";
import type { Branch, StockLevel, StockMovement, StockOperation, StockTransfer } from "@/lib/types";

type Tab = "onhand" | "movements" | "operations" | "transfers";

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
  const transfers = usePagedList<StockTransfer>("/api/stock-transfers/", { enabled: tab === "transfers" });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [opOpen, setOpOpen] = useState(false);
  const [trOpen, setTrOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [op, setOp] = useState({
    kind: "stock_in",
    branch: "",
    variant: "",
    quantity: "1",
    counted_quantity: "",
    reason: "",
  });
  const [tr, setTr] = useState({
    from_branch: "",
    to_branch: "",
    variant: "",
    quantity: "1",
    reason: "",
  });

  async function loadLookups() {
    const br = await apiCached<Branch[]>("/api/branches/");
    setBranches(br);
    setOp((prev) => ({ ...prev, branch: prev.branch || br[0]?.id || "" }));
    setTr((prev) => ({
      ...prev,
      from_branch: prev.from_branch || br[0]?.id || "",
      to_branch: prev.to_branch || br[1]?.id || br[0]?.id || "",
    }));
  }

  useEffect(() => {
    loadLookups().catch(() => {});
  }, []);

  async function refreshActive() {
    await Promise.all([levels.reload(), movements.reload(), operations.reload(), transfers.reload()]);
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
          branch: op.branch,
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

  async function submitTr(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      await api("/api/stock-transfers/", {
        method: "POST",
        body: JSON.stringify({
          from_branch: tr.from_branch,
          to_branch: tr.to_branch,
          reason: tr.reason,
          lines: [{ variant: tr.variant, quantity: tr.quantity }],
        }),
      });
      setTrOpen(false);
      await refreshActive();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { detail?: string };
        setErrors({ detail: body.detail || "Could not post transfer." });
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
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setTrOpen(true)}>
              Transfer
            </Button>
            <Button onClick={() => setOpOpen(true)}>Stock operation</Button>
          </div>
        }
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {(["onhand", "movements", "operations", "transfers"] as Tab[]).map((item) => (
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
                    <th className="px-4 py-3">Branch</th>
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
                      <td className="px-4 py-3">{row.branch_name}</td>
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
                        <p className="text-xs text-ink-700/55">{row.branch_name}</p>
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
                    <td className="px-4 py-3">{row.branch_name}</td>
                    <td className="px-4 py-3">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={operations.page} pages={operations.pages} count={operations.count} onPage={operations.setPage} />
        </ListState>
      ) : null}

      {tab === "transfers" ? (
        <ListState
          loading={transfers.loading}
          count={transfers.count}
          emptyTitle="No transfers"
          emptyHint="Need a second branch to move stock."
        >
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <tbody>
                {transfers.rows.map((row) => (
                  <tr key={row.id} className="border-t border-paper-100 first:border-0">
                    <td className="px-4 py-3 font-medium">{row.number}</td>
                    <td className="px-4 py-3">
                      {row.from_branch_name} → {row.to_branch_name}
                    </td>
                    <td className="px-4 py-3">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={transfers.page} pages={transfers.pages} count={transfers.count} onPage={transfers.setPage} />
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
          <Field label="Branch">
            <Select value={op.branch} onChange={(e) => setOp({ ...op, branch: e.target.value })}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
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

      <Modal open={trOpen} title="Branch transfer" onClose={() => setTrOpen(false)}>
        <form onSubmit={submitTr} className="grid gap-3">
          {errors.detail ? <p className="text-sm text-red-700">{errors.detail}</p> : null}
          <Field label="From">
            <Select value={tr.from_branch} onChange={(e) => setTr({ ...tr, from_branch: e.target.value })}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="To">
            <Select value={tr.to_branch} onChange={(e) => setTr({ ...tr, to_branch: e.target.value })}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Variant">
            <VariantPicker value={tr.variant} onChange={(variant) => setTr({ ...tr, variant })} required />
          </Field>
          <Field label="Quantity">
            <Input value={tr.quantity} onChange={(e) => setTr({ ...tr, quantity: e.target.value })} required />
          </Field>
          <Field label="Reason">
            <Input value={tr.reason} onChange={(e) => setTr({ ...tr, reason: e.target.value })} />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Moving…" : "Post transfer"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
