"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { ListState, Pager, SearchField } from "@/components/DataTable";
import { Badge, Button, Field, Input, Modal, PageHeader } from "@/components/ui";
import { ApiError, api, fieldErrors } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usePagedList } from "@/lib/query";
import type { Customer } from "@/lib/types";

const blank = { name: "", phone: "", email: "", city: "", address: "", credit_limit: "0" };

export default function CustomersPage() {
  const { can } = useAuth();
  const list = usePagedList<Customer>("/api/customers/");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      await api("/api/customers/", { method: "POST", body: JSON.stringify(form) });
      setOpen(false);
      setForm(blank);
      await list.reload();
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Module 8"
        title="Customers"
        description="Profiles, credit sales, receivables and loyalty points. POS will post into this ledger later."
        action={can("customer.manage") ? <Button onClick={() => setOpen(true)}>Add customer</Button> : undefined}
      />
      <div className="mb-4">
        <SearchField value={list.search} onChange={list.setSearch} placeholder="Search name, phone or city" />
      </div>
      <ListState
        loading={list.loading}
        count={list.count}
        emptyTitle="No customers"
        emptyHint="Add a regular buyer to record credit sales."
      >
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Purchases</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((row) => (
                <tr key={row.id} className="border-t border-paper-100">
                  <td className="px-4 py-3">
                    <Link href={`/customers/${row.id}`} className="font-medium hover:text-copper-600">
                      {row.name}
                    </Link>
                    <p className="text-xs text-ink-700/55">{row.phone || row.city || "—"}</p>
                  </td>
                  <td className="px-4 py-3">Rs {row.total_purchases}</td>
                  <td className="px-4 py-3">
                    <Badge tone={Number(row.receivable_balance) > 0 ? "warn" : "good"}>
                      Rs {row.receivable_balance}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{row.loyalty_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={list.page} pages={list.pages} count={list.count} onPage={list.setPage} />
      </ListState>
      <Modal open={open} title="New customer" onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="grid gap-3">
          <Field label="Name" error={errors.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Credit limit (0 = unlimited)">
            <Input value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save customer"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
