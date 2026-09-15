"use client";

import { ListState, Pager, SearchField } from "@/components/DataTable";
import { Badge, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { usePagedList } from "@/lib/query";
import type { PlatformBusiness } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  grocery: "Grocery",
  clothing: "Clothing",
  restaurant: "Restaurant",
  pharmacy: "Pharmacy",
  electronics: "Electronics",
  general: "General",
};

function fmtDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PlatformBusinessesPage() {
  const list = usePagedList<PlatformBusiness>("/api/platform/businesses/");
  const pages = Math.max(1, Math.ceil(list.count / 25));

  async function toggleActive(row: PlatformBusiness) {
    await api(`/api/platform/businesses/${row.id}/`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !row.is_active }),
    });
    list.reload();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Registered businesses"
        description="Every shop that signed up on your software. Disable a business to block its login."
        action={<SearchField value={list.search} onChange={list.setSearch} placeholder="Search businesses…" />}
      />

      <ListState
        loading={list.loading}
        count={list.count}
        emptyTitle="No businesses yet"
        emptyHint="Shops appear here when they create an account from the public register page."
        cols={7}
      >
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[68rem] text-left text-sm">
            <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Branches</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Sales</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((row) => (
                <tr key={row.id} className="border-t border-paper-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-950">{row.name}</p>
                    <p className="text-xs text-ink-700/60">
                      {[row.city, row.phone || row.email].filter(Boolean).join(" · ")}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-800">{row.owner_email || "—"}</td>
                  <td className="px-4 py-3">{TYPE_LABEL[row.business_type] || row.business_type}</td>
                  <td className="px-4 py-3">{row.user_count}</td>
                  <td className="px-4 py-3">{row.branch_count}</td>
                  <td className="px-4 py-3">{row.product_count}</td>
                  <td className="px-4 py-3">{row.sale_count}</td>
                  <td className="px-4 py-3 text-ink-700/80">{fmtDate(row.created_at)}</td>
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
