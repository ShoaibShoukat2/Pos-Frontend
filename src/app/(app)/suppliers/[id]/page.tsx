"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Badge, Button, Field, Input, PageHeader, Select } from "@/components/ui";
import { ApiError, api, asList } from "@/lib/api";
import type { LedgerEntry, Payable, Supplier } from "@/lib/types";

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ amount: "", method: "cash", notes: "" });

  async function load() {
    const [s, led, pay] = await Promise.all([
      api<Supplier>(`/api/suppliers/${params.id}/`),
      api<LedgerEntry[]>(`/api/suppliers/${params.id}/ledger/`),
      api<Payable[] | { results: Payable[] }>(`/api/payables/?supplier=${params.id}`),
    ]);
    setSupplier(s);
    setLedger(led);
    setPayables(asList(pay));
  }

  useEffect(() => {
    load().catch(() => {});
  }, [params.id]);

  async function onPay(e: FormEvent) {
    e.preventDefault();
    if (!supplier) return;
    setPending(true);
    setError("");
    try {
      await api("/api/supplier-payments/", {
        method: "POST",
        body: JSON.stringify({ ...form, supplier: supplier.id }),
      });
      await load();
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { detail?: string }) : null;
      setError(body?.detail || "Could not pay supplier. Cash payments need an open shift.");
    } finally {
      setPending(false);
    }
  }

  if (!supplier) return <p className="text-sm text-ink-700/70">Loading supplier…</p>;

  return (
    <div>
      <PageHeader
        eyebrow="Supplier ledger"
        title={supplier.name}
        description={`${supplier.city || "—"} · payable Rs ${supplier.payable_balance || 0}`}
        action={
          <Link href="/suppliers" className="btn-ghost">
            Back
          </Link>
        }
      />
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={onPay} className="card grid gap-3 p-5">
          <h2 className="font-display text-xl">Record payment</h2>
          <Field label="Amount">
            <Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </Field>
          <Field label="Method">
            <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
            </Select>
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Posting…" : "Pay supplier"}
          </Button>
        </form>
        <div className="card overflow-hidden">
          <h2 className="px-4 pt-4 font-display text-xl">Open bills</h2>
          <table className="mt-2 w-full text-left text-sm">
            <tbody>
              {payables.map((row) => (
                <tr key={row.id} className="border-t border-paper-100">
                  <td className="px-4 py-3">{row.receipt_number}</td>
                  <td className="px-4 py-3">Rs {row.amount}</td>
                  <td className="px-4 py-3">Paid {row.paid_amount}</td>
                  <td className="px-4 py-3">
                    <Badge tone={row.status === "paid" ? "good" : "warn"}>{row.balance}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card mt-6 overflow-hidden">
        <h2 className="px-4 pt-4 font-display text-xl">Ledger</h2>
        <table className="mt-2 w-full text-left text-sm">
          <tbody>
            {ledger.map((row) => (
              <tr key={row.id} className="border-t border-paper-100">
                <td className="px-4 py-3">
                  <Badge>{row.entry_type}</Badge>
                  <p className="mt-1 text-xs text-ink-700/55">{row.reason}</p>
                </td>
                <td className="px-4 py-3">{row.amount}</td>
                <td className="px-4 py-3">Rs {row.balance_after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
