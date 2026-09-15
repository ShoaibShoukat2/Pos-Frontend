"use client";

import { ListState, Pager, SearchField } from "@/components/DataTable";
import { Badge, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { usePagedList } from "@/lib/query";
import type { PlatformUser } from "@/lib/types";

function fmtDate(value: string | null) {
  if (!value) return "Never";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PlatformUsersPage() {
  const list = usePagedList<PlatformUser>("/api/platform/users/");
  const pages = Math.max(1, Math.ceil(list.count / 25));

  async function toggleActive(row: PlatformUser) {
    await api(`/api/platform/users/${row.id}/`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !row.is_active }),
    });
    list.reload();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="All users"
        description="Every owner and staff account across all businesses."
        action={<SearchField value={list.search} onChange={list.setSearch} placeholder="Search users…" />}
      />

      <ListState
        loading={list.loading}
        count={list.count}
        emptyTitle="No users yet"
        emptyHint="Users appear after a business registers or adds staff."
        cols={6}
      >
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((row) => (
                <tr key={row.id} className="border-t border-paper-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-950">{row.full_name}</p>
                    <p className="text-xs text-ink-700/60">{row.email}</p>
                  </td>
                  <td className="px-4 py-3">{row.business_name || "—"}</td>
                  <td className="px-4 py-3">{row.is_owner ? "Business owner" : row.role_name || "Staff"}</td>
                  <td className="px-4 py-3 text-ink-700/80">{fmtDate(row.date_joined)}</td>
                  <td className="px-4 py-3 text-ink-700/80">{fmtDate(row.last_login)}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleActive(row)} className="text-left">
                      <Badge tone={row.is_active ? "good" : "warn"}>{row.is_active ? "Active" : "Disabled"}</Badge>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={list.page} pages={pages} count={list.count} onPage={list.setPage} />
      </ListState>
    </div>
  );
}
