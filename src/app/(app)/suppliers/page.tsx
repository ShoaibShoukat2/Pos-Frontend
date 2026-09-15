"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { ListState, Pager, SearchField } from "@/components/DataTable";
import { Badge, Button, Field, Input, Modal, PageHeader } from "@/components/ui";
import { ApiError, api, fieldErrors } from "@/lib/api";
import { usePagedList } from "@/lib/query";
import type { Supplier } from "@/lib/types";

const blank = { name: "", phone: "", email: "", city: "", address: "", tax_number: "", notes: "" };

export default function SuppliersPage() {
  const list = usePagedList<Supplier>("/api/suppliers/");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      await api("/api/suppliers/", { method: "POST", body: JSON.stringify(form) });
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
        eyebrow="Module 9"
        title="Suppliers"
        description="Who you buy from. Receiving goods creates a payable against the supplier."
        action={<Button onClick={() => setOpen(true)}>Add supplier</Button>}
      />
      <div className="mb-4">
        <SearchField value={list.search} onChange={list.setSearch} placeholder="Search supplier, phone or city" />
      </div>
      <ListState
        loading={list.loading}
        count={list.count}
        emptyTitle="No suppliers"
        emptyHint="Add a wholesaler before creating a purchase order."
      >
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
              <tr>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Payable</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((row) => (
                <tr key={row.id} className="border-t border-paper-100">
                  <td className="px-4 py-3">
                    <Link href={`/suppliers/${row.id}`} className="font-medium hover:text-copper-600">
                      {row.name}
                    </Link>
                    <p className="text-xs text-ink-700/55">{row.phone || row.email || "—"}</p>
                  </td>
                  <td className="px-4 py-3">{row.city || "—"}</td>
                  <td className="px-4 py-3">{row.order_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <Badge tone={Number(row.payable_balance || 0) > 0 ? "warn" : "good"}>
                      Rs {row.payable_balance || 0}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={list.page} pages={list.pages} count={list.count} onPage={list.setPage} />
      </ListState>
      <Modal open={open} title="New supplier" onClose={() => setOpen(false)}>
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
          <Field label="NTN / tax">
            <Input value={form.tax_number} onChange={(e) => setForm({ ...form, tax_number: e.target.value })} />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save supplier"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
