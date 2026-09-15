"use client";

import { FormEvent, useEffect, useState } from "react";

import { Badge, Button, Empty, Field, Input, Modal, PageHeader, Select } from "@/components/ui";
import { ApiError, api, asList, fieldErrors } from "@/lib/api";
import type { Branch, Paginated, User } from "@/lib/types";

const blank = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  default_branch: "",
};

export default function CashiersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  async function load() {
    const cashiers = await api<Paginated<User> | User[]>("/api/cashiers/");
    setRows(asList(cashiers));
    setBranches(await api<Branch[]>("/api/branches/"));
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setForm({ ...blank, default_branch: branches[0]?.id || "" });
    setErrors({});
    setCreated(null);
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      await api("/api/cashiers/create/", {
        method: "POST",
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          default_branch: form.default_branch || null,
        }),
      });
      setCreated({ email: form.email, password: form.password });
      setOpen(false);
      setForm(blank);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Staff"
        title="Cashiers"
        description="Create a cashier login, then give them the email and password. They sign in from the cashier page."
        action={<Button onClick={startCreate}>Add cashier</Button>}
      />

      {created ? (
        <div className="card mb-6 border-copper-400 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper-600">Give this to your cashier</p>
          <p className="mt-2 text-sm text-ink-700/75">
            They open Sign in, choose <span className="font-medium">Cashier</span>, then use these details. Save the
            password now — it will not be shown again.
          </p>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-700/65">Email</dt>
              <dd className="font-medium">{created.email}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-700/65">Password</dt>
              <dd className="font-medium">{created.password}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-700/65">Login page</dt>
              <dd className="font-medium">/login · role: Cashier</dd>
            </div>
          </dl>
          <Button variant="ghost" className="mt-3" onClick={() => setCreated(null)}>
            Dismiss
          </Button>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <Empty title="No cashiers yet" hint="Add a cashier and share the login with them." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
              <tr>
                <th className="px-4 py-3">Cashier</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-paper-100">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.full_name}</p>
                    <p className="text-xs text-ink-700/55">{row.email}</p>
                  </td>
                  <td className="px-4 py-3">{row.default_branch_name || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={row.is_active ? "good" : "warn"}>{row.is_active ? "Active" : "Disabled"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} title="Add cashier" onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name" error={errors.first_name}>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            </Field>
            <Field label="Last name">
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </Field>
          </div>
          <Field label="Email" error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Password" error={errors.password}>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </Field>
          <Field label="Branch" error={errors.default_branch}>
            <Select value={form.default_branch} onChange={(e) => setForm({ ...form, default_branch: e.target.value })}>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-xs text-ink-700/60">
            After you save, tell the cashier to open Sign in, choose Cashier, and use this email and password.
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Create cashier login"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
