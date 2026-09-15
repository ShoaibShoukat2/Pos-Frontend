"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { ListState, Pager, SearchField } from "@/components/DataTable";
import { VariantPicker } from "@/components/VariantPicker";
import { Badge, Button, Field, Input, Modal, PageHeader, Select } from "@/components/ui";
import { ApiError, api, apiCached, asList, fieldErrors } from "@/lib/api";
import { usePagedList } from "@/lib/query";
import type { Branch, GoodsReceipt, Payable, PurchaseOrder, Supplier } from "@/lib/types";

type Tab = "orders" | "receipts" | "payables";

export default function PurchasesPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const orders = usePagedList<PurchaseOrder>("/api/purchase-orders/", { enabled: tab === "orders" });
  const receipts = usePagedList<GoodsReceipt>("/api/goods-receipts/", { enabled: tab === "receipts" });
  const payables = usePagedList<Payable>("/api/payables/", { enabled: tab === "payables" });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    supplier: "",
    branch: "",
    notes: "",
    variant: "",
    quantity: "10",
    unit_cost: "0",
  });

  async function loadLookups() {
    const [sup, br] = await Promise.all([
      apiCached<Supplier[] | { results: Supplier[] }>("/api/suppliers/?page_size=50"),
      apiCached<Branch[]>("/api/branches/"),
    ]);
    const supplierRows = asList(sup);
    setSuppliers(supplierRows);
    setBranches(br);
    setForm((prev) => ({
      ...prev,
      supplier: prev.supplier || supplierRows[0]?.id || "",
      branch: prev.branch || br[0]?.id || "",
    }));
  }

  useEffect(() => {
    loadLookups().catch(() => {});
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      await api("/api/purchase-orders/", {
        method: "POST",
        body: JSON.stringify({
          supplier: form.supplier,
          branch: form.branch,
          notes: form.notes,
          lines: [{ variant: form.variant, quantity: form.quantity, unit_cost: form.unit_cost }],
        }),
      });
      setOpen(false);
      await orders.reload();
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Module 6"
        title="Purchases"
        description="Supplier → purchase order → goods received → stock + and supplier payable."
        action={<Button onClick={() => setOpen(true)}>New purchase order</Button>}
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {(["orders", "receipts", "payables"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-full px-3 py-1.5 text-sm capitalize ${tab === item ? "bg-ink-950 text-paper-50" : "bg-white border border-paper-200"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "orders" ? (
        <>
          <div className="mb-4">
            <SearchField value={orders.search} onChange={orders.setSearch} placeholder="Search PO or supplier" />
          </div>
          <ListState loading={orders.loading} count={orders.count} emptyTitle="No purchase orders" cols={5}>
            <div className="card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
                  <tr>
                    <th className="px-4 py-3">PO</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.rows.map((row) => (
                    <tr key={row.id} className="border-t border-paper-100">
                      <td className="px-4 py-3">
                        <Link href={`/purchases/${row.id}`} className="font-medium hover:text-copper-600">
                          {row.number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{row.supplier_name}</td>
                      <td className="px-4 py-3">{row.branch_name}</td>
                      <td className="px-4 py-3">Rs {row.total}</td>
                      <td className="px-4 py-3">
                        <Badge tone={row.status === "received" ? "good" : "copper"}>{row.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={orders.page} pages={orders.pages} count={orders.count} onPage={orders.setPage} />
          </ListState>
        </>
      ) : null}

      {tab === "receipts" ? (
        <ListState loading={receipts.loading} count={receipts.count} emptyTitle="No receipts">
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <tbody>
                {receipts.rows.map((row) => (
                  <tr key={row.id} className="border-t border-paper-100 first:border-0">
                    <td className="px-4 py-3 font-medium">{row.number}</td>
                    <td className="px-4 py-3">{row.supplier_name}</td>
                    <td className="px-4 py-3">{row.purchase_order_number || "Direct"}</td>
                    <td className="px-4 py-3">Rs {row.total_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={receipts.page} pages={receipts.pages} count={receipts.count} onPage={receipts.setPage} />
        </ListState>
      ) : null}

      {tab === "payables" ? (
        <ListState loading={payables.loading} count={payables.count} emptyTitle="No payables">
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <tbody>
                {payables.rows.map((row) => (
                  <tr key={row.id} className="border-t border-paper-100 first:border-0">
                    <td className="px-4 py-3">{row.supplier_name}</td>
                    <td className="px-4 py-3">{row.receipt_number}</td>
                    <td className="px-4 py-3">Rs {row.balance}</td>
                    <td className="px-4 py-3">
                      <Badge tone="warn">{row.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={payables.page} pages={payables.pages} count={payables.count} onPage={payables.setPage} />
        </ListState>
      ) : null}

      <Modal open={open} title="New purchase order" onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="grid gap-3">
          {errors.detail ? <p className="text-sm text-red-700">{errors.detail}</p> : null}
          <Field label="Supplier">
            <Select value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} required>
              <option value="">Select</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Receive into branch">
            <Select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} required>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Variant">
            <VariantPicker value={form.variant} onChange={(variant) => setForm({ ...form, variant })} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Qty">
              <Input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </Field>
            <Field label="Unit cost">
              <Input value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create draft PO"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
