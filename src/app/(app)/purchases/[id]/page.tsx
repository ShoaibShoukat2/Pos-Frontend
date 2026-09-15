"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge, Button, PageHeader } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import type { PurchaseOrder } from "@/lib/types";

export default function PurchaseOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function load() {
    setOrder(await api<PurchaseOrder>(`/api/purchase-orders/${params.id}/`));
  }

  useEffect(() => {
    load().catch(() => {});
  }, [params.id]);

  async function submit() {
    setPending(true);
    setError("");
    try {
      setOrder(await api<PurchaseOrder>(`/api/purchase-orders/${params.id}/submit/`, { method: "POST" }));
    } catch (err) {
      setError(err instanceof ApiError ? "Could not submit this order." : "Request failed.");
    } finally {
      setPending(false);
    }
  }

  async function receiveAll() {
    if (!order) return;
    setPending(true);
    setError("");
    try {
      await api(`/api/purchase-orders/${order.id}/receive/`, {
        method: "POST",
        body: JSON.stringify({
          lines: order.lines
            .filter((line) => Number(line.outstanding_qty) > 0)
            .map((line) => ({
              variant: line.variant,
              purchase_order_line: line.id,
              quantity: line.outstanding_qty,
              unit_cost: line.unit_cost,
            })),
        }),
      });
      await load();
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { detail?: string }) : null;
      setError(body?.detail || "Could not receive goods.");
    } finally {
      setPending(false);
    }
  }

  if (!order) return <p className="text-sm text-ink-700/70">Loading purchase order…</p>;

  return (
    <div>
      <PageHeader
        eyebrow="Purchase order"
        title={order.number}
        description={`${order.supplier_name} → ${order.branch_name}`}
        action={
          <Link href="/purchases" className="btn-ghost">
            Back
          </Link>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge tone={order.status === "received" ? "good" : "copper"}>{order.status}</Badge>
        {order.status === "draft" ? (
          <Button onClick={submit} disabled={pending}>
            Submit order
          </Button>
        ) : null}
        {["ordered", "partial"].includes(order.status) ? (
          <Button onClick={receiveAll} disabled={pending}>
            Receive outstanding
          </Button>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Ordered</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Outstanding</th>
              <th className="px-4 py-3">Cost</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.id} className="border-t border-paper-100">
                <td className="px-4 py-3">
                  {line.product_name} · {line.variant_name}
                  <p className="text-xs text-ink-700/55">{line.sku}</p>
                </td>
                <td className="px-4 py-3">{line.quantity}</td>
                <td className="px-4 py-3">{line.received_qty}</td>
                <td className="px-4 py-3">{line.outstanding_qty}</td>
                <td className="px-4 py-3">Rs {line.unit_cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
