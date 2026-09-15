"use client";

import { FormEvent, useEffect, useState } from "react";

import { Badge, Button, Empty, Field, Input, Modal, PageHeader, Toggle } from "@/components/ui";
import { ApiError, api, fieldErrors } from "@/lib/api";
import type { Branch } from "@/lib/types";

const blank = {
  name: "",
  code: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  is_head_office: false,
  is_active: true,
};

export default function BranchesPage() {
  const [rows, setRows] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function load() {
    setRows(await api<Branch[]>("/api/branches/"));
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing(null);
    setForm(blank);
    setErrors({});
    setOpen(true);
  }

  function startEdit(row: Branch) {
    setEditing(row);
    setForm({
      name: row.name,
      code: row.code,
      phone: row.phone,
      email: row.email,
      address: row.address,
      city: row.city,
      is_head_office: row.is_head_office,
      is_active: row.is_active,
    });
    setErrors({});
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      if (editing) {
        await api(`/api/branches/${editing.id}/`, { method: "PATCH", body: JSON.stringify(form) });
      } else {
        await api("/api/branches/", { method: "POST", body: JSON.stringify(form) });
      }
      setOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
    } finally {
      setPending(false);
    }
  }

  async function remove(row: Branch) {
    if (!confirm(`Deactivate or delete ${row.name}?`)) return;
    await api(`/api/branches/${row.id}/`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Module 1"
        title="Branches"
        description="Head office is created during onboarding. Extra stores are ready for multi-branch later."
        action={<Button onClick={startCreate}>Add branch</Button>}
      />
      {rows.length === 0 ? (
        <Empty title="No branches yet" hint="Create a head office or store location." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
              <tr>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-paper-100">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-ink-700/55">{row.address || row.phone || "—"}</p>
                  </td>
                  <td className="px-4 py-3">{row.code}</td>
                  <td className="px-4 py-3">{row.city || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.is_head_office ? <Badge tone="copper">Head office</Badge> : null}
                      <Badge tone={row.is_active ? "good" : "warn"}>{row.is_active ? "Active" : "Inactive"}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" onClick={() => startEdit(row)}>
                      Edit
                    </Button>
                    {!row.is_head_office ? (
                      <Button variant="ghost" onClick={() => remove(row)}>
                        Remove
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} title={editing ? "Edit branch" : "New branch"} onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="grid gap-3">
          <Field label="Name" error={errors.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Code" error={errors.code}>
            <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Toggle
            label="Head office"
            checked={form.is_head_office}
            onChange={(is_head_office) => setForm({ ...form, is_head_office })}
          />
          <Toggle
            label="Active"
            checked={form.is_active}
            onChange={(is_active) => setForm({ ...form, is_active })}
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save branch"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
