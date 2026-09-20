"use client";

import { FormEvent, useEffect, useState } from "react";

import { ListState, Pager } from "@/components/DataTable";
import { Button, Field, Input, Modal, PageHeader, Select } from "@/components/ui";
import { ApiError, api, apiCached } from "@/lib/api";
import { usePagedList } from "@/lib/query";
import type { Expense, ExpenseCategory } from "@/lib/types";

export default function ExpensesPage() {
  const list = usePagedList<Expense>("/api/expenses/");
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    category: "",
    amount: "",
    method: "cash",
    notes: "",
  });

  async function loadLookups() {
    const [cats] = await Promise.all([
      apiCached<ExpenseCategory[]>("/api/expense-categories/"),
    ]);
    setCategories(cats);
    setForm((prev) => ({
      ...prev,
      category: prev.category || cats[0]?.id || "",
    }));
  }

  useEffect(() => {
    loadLookups().catch(() => {});
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await api("/api/expenses/", { method: "POST", body: JSON.stringify(form) });
      setOpen(false);
      await list.reload();
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { detail?: string }) : null;
      setError(body?.detail || "Could not post expense. Open a cash shift for cash expenses.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Module 11"
        title="Expenses"
        description="Rent, electricity, salaries and the rest. Cash expenses leave the open drawer."
        action={<Button onClick={() => setOpen(true)}>Add expense</Button>}
      />
      <ListState loading={list.loading} count={list.count} emptyTitle="No expenses yet" cols={5}>
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((row) => (
                <tr key={row.id} className="border-t border-paper-100">
                  <td className="px-4 py-3 font-medium">{row.number}</td>
                  <td className="px-4 py-3">{row.category_name}</td>
                  <td className="px-4 py-3">Rs {row.amount}</td>
                  <td className="px-4 py-3">{row.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={list.page} pages={list.pages} count={list.count} onPage={list.setPage} />
      </ListState>
      <Modal open={open} title="New expense" onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="grid gap-3">
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount">
            <Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </Field>
          <Field label="Method">
            <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="card">Card</option>
            </Select>
          </Field>
          <Field label="Notes">
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Posting…" : "Post expense"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
