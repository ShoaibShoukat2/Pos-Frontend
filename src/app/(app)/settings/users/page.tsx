"use client";

import { FormEvent, useEffect, useState } from "react";

import { Badge, Button, Empty, Field, Input, Modal, PageHeader, Select, Toggle } from "@/components/ui";
import { ApiError, api, fieldErrors } from "@/lib/api";
import type { Paginated, Role, User } from "@/lib/types";

const blank = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  role: "",
  is_active: true,
};

export default function UsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function load() {
    const users = await api<Paginated<User> | User[]>("/api/users/");
    setRows(Array.isArray(users) ? users : users.results);
    setRoles(await api<Role[]>("/api/roles/"));
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing(null);
    setForm({ ...blank, role: roles[0]?.id || "" });
    setErrors({});
    setOpen(true);
  }

  function startEdit(row: User) {
    setEditing(row);
    setForm({
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
      password: "",
      role: row.role || "",
      is_active: row.is_active,
    });
    setErrors({});
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    const payload: Record<string, unknown> = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone,
      role: form.role || null,
      is_active: form.is_active,
    };
    if (form.password) payload.password = form.password;
    try {
      if (editing) {
        await api(`/api/users/${editing.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        if (!form.password) {
          setErrors({ password: "Password is required." });
          setPending(false);
          return;
        }
        await api("/api/users/", { method: "POST", body: JSON.stringify(payload) });
      }
      setOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
    } finally {
      setPending(false);
    }
  }

  async function remove(row: User) {
    if (row.is_owner) return;
    if (!confirm(`Deactivate ${row.email}?`)) return;
    await api(`/api/users/${row.id}/`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Module 2"
        title="Users"
        description="Invite cashiers, managers and accountants. Owners cannot be deleted."
        action={<Button onClick={startCreate}>Add user</Button>}
      />
      {rows.length === 0 ? (
        <Empty title="No users" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-paper-100">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.full_name}</p>
                    <p className="text-xs text-ink-700/55">{row.email}</p>
                  </td>
                  <td className="px-4 py-3">{row.is_owner ? "Owner" : row.role_name || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={row.is_active ? "good" : "warn"}>{row.is_active ? "Active" : "Disabled"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" onClick={() => startEdit(row)}>
                      Edit
                    </Button>
                    {!row.is_owner ? (
                      <Button variant="ghost" onClick={() => remove(row)}>
                        Disable
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} title={editing ? "Edit user" : "New user"} onClose={() => setOpen(false)}>
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
          <Field label={editing ? "New password (optional)" : "Password"} error={errors.password}>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Role" error={errors.role}>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="">No role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </Field>
          <Toggle label="Active" checked={form.is_active} onChange={(is_active) => setForm({ ...form, is_active })} />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save user"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
