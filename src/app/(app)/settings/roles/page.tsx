"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Badge, Button, Empty, Field, Input, Modal, PageHeader } from "@/components/ui";
import { ApiError, api, fieldErrors } from "@/lib/api";
import type { Permission, Role } from "@/lib/types";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function load() {
    setRoles(await api<Role[]>("/api/roles/"));
    setPermissions(await api<Permission[]>("/api/permissions/"));
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const hidden = new Set(["tax.manage", "currency.manage"]);
    const map = new Map<string, Permission[]>();
    for (const perm of permissions) {
      if (hidden.has(perm.codename)) continue;
      const list = map.get(perm.module_label) || [];
      list.push(perm);
      map.set(perm.module_label, list);
    }
    return Array.from(map.entries());
  }, [permissions]);

  function startCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setSelected([]);
    setErrors({});
    setOpen(true);
  }

  function startEdit(role: Role) {
    setEditing(role);
    setName(role.name);
    setDescription(role.description);
    setSelected(role.permissions.map((p) => p.id));
    setErrors({});
    setOpen(true);
  }

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    const payload = { name, description, permission_ids: selected };
    try {
      if (editing) await api(`/api/roles/${editing.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      else await api("/api/roles/", { method: "POST", body: JSON.stringify(payload) });
      setOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
    } finally {
      setPending(false);
    }
  }

  async function remove(role: Role) {
    if (role.is_system) return;
    if (!confirm(`Delete role ${role.name}?`)) return;
    await api(`/api/roles/${role.id}/`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Module 2"
        title="Roles & permissions"
        description="System roles stay, custom roles can mix permissions from all 20 future modules."
        action={<Button onClick={startCreate}>Create role</Button>}
      />
      {roles.length === 0 ? (
        <Empty title="No roles" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <div key={role.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">{role.name}</h2>
                  <p className="mt-1 text-sm text-ink-700/65">{role.description || "No description"}</p>
                </div>
                {role.is_system ? <Badge tone="copper">System</Badge> : <Badge>Custom</Badge>}
              </div>
              <p className="mt-4 text-sm text-ink-700/70">
                {role.permissions.length} permissions · {role.user_count} users
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="ghost" onClick={() => startEdit(role)}>
                  Edit
                </Button>
                {!role.is_system ? (
                  <Button variant="ghost" onClick={() => remove(role)}>
                    Delete
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} title={editing ? "Edit role" : "New role"} onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
          <Field label="Name" error={errors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Description">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          {grouped.map(([label, items]) => (
            <div key={label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-copper-600">{label}</p>
              <div className="space-y-1">
                {items.map((perm) => (
                  <label key={perm.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-paper-50">
                    <span className="text-sm">{perm.name}</span>
                    <input
                      type="checkbox"
                      checked={selected.includes(perm.id)}
                      onChange={() => toggle(perm.id)}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save role"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
