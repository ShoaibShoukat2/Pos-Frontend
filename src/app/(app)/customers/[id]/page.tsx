"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Badge, Button, Field, Input, PageHeader, Select } from "@/components/ui";
import { ApiError, api, asList } from "@/lib/api";
import type { Branch, Customer, CustomerSale, LedgerEntry } from "@/lib/types";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [sales, setSales] = useState<CustomerSale[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sale, setSale] = useState({ branch: "", total: "10000", paid_amount: "6000", payment_method: "cash", notes: "" });
  const [pay, setPay] = useState({ branch: "", amount: "", method: "cash", notes: "" });

  async function load() {
    const [c, led, sl, br] = await Promise.all([
      api<Customer>(`/api/customers/${params.id}/`),
      api<LedgerEntry[]>(`/api/customers/${params.id}/ledger/`),
      api<CustomerSale[] | { results: CustomerSale[] }>(`/api/customer-sales/?customer=${params.id}`),
      api<Branch[]>("/api/branches/"),
    ]);
    setCustomer(c);
    setLedger(led);
    setSales(asList(sl));
    setBranches(br);
    setSale((prev) => ({ ...prev, branch: prev.branch || br[0]?.id || "" }));
    setPay((prev) => ({ ...prev, branch: prev.branch || br[0]?.id || "" }));
  }

  useEffect(() => {
    load().catch(() => {});
  }, [params.id]);

  async function postSale(e: FormEvent) {
    e.preventDefault();
    if (!customer) return;
    setPending(true);
    setError("");
    try {
      await api("/api/customer-sales/", {
        method: "POST",
        body: JSON.stringify({ ...sale, customer: customer.id }),
      });
      await load();
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { detail?: string }) : null;
      setError(body?.detail || "Could not post sale.");
    } finally {
      setPending(false);
    }
  }

  async function postPay(e: FormEvent) {
    e.preventDefault();
    if (!customer) return;
    setPending(true);
    setError("");
    try {
      await api("/api/customer-payments/", {
        method: "POST",
        body: JSON.stringify({ ...pay, customer: customer.id }),
      });
      await load();
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { detail?: string }) : null;
      setError(body?.detail || "Could not post payment.");
    } finally {
      setPending(false);
    }
  }

  if (!customer) return <p className="text-sm text-ink-700/70">Loading customer…</p>;

  return (
    <div>
      <PageHeader
        eyebrow="Customer ledger"
        title={customer.name}
        description={`${customer.phone || "No phone"} · ${customer.city || "—"}`}
        action={
          <Link href="/customers" className="btn-ghost">
            Back
          </Link>
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Stat label="Total purchases" value={`Rs ${customer.total_purchases}`} />
        <Stat label="Outstanding" value={`Rs ${customer.receivable_balance}`} warn={Number(customer.receivable_balance) > 0} />
        <Stat label="Loyalty points" value={String(customer.loyalty_points)} />
        <Stat label="Credit limit" value={Number(customer.credit_limit) > 0 ? `Rs ${customer.credit_limit}` : "Open"} />
      </div>
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={postSale} className="card grid gap-3 p-5">
          <h2 className="font-display text-xl">Credit / partial sale</h2>
          <p className="text-sm text-ink-700/65">Example: buy 10,000, pay 6,000, due 4,000 stays on the ledger.</p>
          <Field label="Branch">
            <Select value={sale.branch} onChange={(e) => setSale({ ...sale, branch: e.target.value })}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total">
              <Input value={sale.total} onChange={(e) => setSale({ ...sale, total: e.target.value })} />
            </Field>
            <Field label="Paid now">
              <Input value={sale.paid_amount} onChange={(e) => setSale({ ...sale, paid_amount: e.target.value })} />
            </Field>
          </div>
          <Field label="Paid via">
            <Select value={sale.payment_method} onChange={(e) => setSale({ ...sale, payment_method: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank">Bank</option>
            </Select>
          </Field>
          <Button type="submit" disabled={pending}>
            Post sale
          </Button>
        </form>
        <form onSubmit={postPay} className="card grid gap-3 p-5">
          <h2 className="font-display text-xl">Receive payment</h2>
          <p className="text-sm text-ink-700/65">Reduces receivable. Cash payments need an open drawer.</p>
          <Field label="Branch">
            <Select value={pay.branch} onChange={(e) => setPay({ ...pay, branch: e.target.value })}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount">
            <Input value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} required />
          </Field>
          <Field label="Method">
            <Select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank">Bank</option>
            </Select>
          </Field>
          <Button type="submit" disabled={pending}>
            Post payment
          </Button>
        </form>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
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
        <div className="card overflow-hidden">
          <h2 className="px-4 pt-4 font-display text-xl">Purchase history</h2>
          <table className="mt-2 w-full text-left text-sm">
            <tbody>
              {sales.map((row) => (
                <tr key={row.id} className="border-t border-paper-100">
                  <td className="px-4 py-3 font-medium">{row.number}</td>
                  <td className="px-4 py-3">Rs {row.total}</td>
                  <td className="px-4 py-3">Paid {row.paid_amount}</td>
                  <td className="px-4 py-3">Due {row.due_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-700/55">{label}</p>
      <p className={`stat-value mt-1 ${warn ? "text-red-800" : ""}`}>{value}</p>
    </div>
  );
}
