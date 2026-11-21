"use client";

import { FormEvent, useState } from "react";

import { ListState, Pager, SearchField } from "@/components/DataTable";
import { Badge, PageHeader } from "@/components/ui";
import { ApiError, api, fieldErrors } from "@/lib/api";
import { usePagedList } from "@/lib/query";
import type { PlatformBusiness } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  grocery: "Grocery",
  clothing: "Clothing",
  restaurant: "Restaurant",
  pharmacy: "Pharmacy",
  electronics: "Electronics",
  pizza: "Pizza shop",
  car_showroom: "Car Showroom",
  rent_a_car: "Rent a Car",
  hostel: "Hostel",
  general: "General",
};

function fmtDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function problem(err: unknown) {
  if (err instanceof ApiError) {
    const fields = fieldErrors(err.body);
    return fields.detail || fields.days || fields.action || "Could not update that business.";
  }
  return "Could not connect. Check the server and try again.";
}

export default function PlatformBusinessesPage() {
  const list = usePagedList<PlatformBusiness>("/api/platform/businesses/");
  const pages = Math.max(1, Math.ceil(list.count / 25));
  const [days, setDays] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function run(id: string, body: Record<string, string | number>) {
    setBusy(id);
    setError("");
    try {
      await api(`/api/platform/businesses/${id}/subscription/`, { method: "POST", body: JSON.stringify(body) });
      list.reload();
    } catch (err) {
      setError(problem(err));
    } finally {
      setBusy("");
    }
  }

  async function remove(row: PlatformBusiness) {
    const ok = window.confirm(`Delete ${row.name}? This removes the business, its owner login, and its records.`);
    if (!ok) return;
    setBusy(row.id);
    setError("");
    try {
      await api(`/api/platform/businesses/${row.id}/`, { method: "DELETE" });
      list.reload();
    } catch (err) {
      setError(problem(err));
    } finally {
      setBusy("");
    }
  }

  function shift(event: FormEvent, row: PlatformBusiness) {
    event.preventDefault();
    const value = Number(days[row.id] || "");
    if (!Number.isInteger(value) || value === 0) {
      setError("Enter whole days, like 15 or -7.");
      return;
    }
    run(row.id, { action: "shift", days: value });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Registered businesses"
        description="Stop a subscription, move its end date by any number of days, or delete a business. Owners lose access when it expires."
        action={<SearchField value={list.search} onChange={list.setSearch} placeholder="Search businesses…" />}
      />

      <ListState
        loading={list.loading}
        count={list.count}
        emptyTitle="No businesses yet"
        emptyHint="Shops appear here when they create an account from the public register page."
        cols={9}
      >
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
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
                <th className="px-4 py-3">Subscription</th>
                <th className="px-4 py-3">Actions</th>
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
                    <Badge tone={row.subscription_status === "active" ? "good" : "warn"}>{row.subscription_status === "active" ? "Active" : "Expired"}</Badge>
                    <p className="mt-1 text-xs text-ink-700/70">{row.subscription_ends_on ? `Until ${fmtDate(row.subscription_ends_on)}` : "No end date"}</p>
                    {row.days_left != null ? <p className="text-xs text-ink-700/60">{row.days_left < 0 ? `${Math.abs(row.days_left)} days overdue` : `${row.days_left} days left`}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[16rem] flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                        {row.subscription_status === "active" ? (
                          <button type="button" className="btn btn-ghost" disabled={busy === row.id} onClick={() => run(row.id, { action: "stop" })}>Stop</button>
                        ) : (
                          <button type="button" className="btn btn-primary" disabled={busy === row.id} onClick={() => run(row.id, { action: "activate" })}>Activate 1 month</button>
                        )}
                        <button type="button" className="btn btn-ghost text-red-700" disabled={busy === row.id} onClick={() => remove(row)}>Delete</button>
                      </div>
                      <form className="flex gap-2" onSubmit={(event) => shift(event, row)}>
                        <input type="number" className="field w-24" placeholder="+15 or -7" value={days[row.id] || ""} onChange={(event) => setDays({ ...days, [row.id]: event.target.value })} />
                        <button type="submit" className="btn btn-ghost" disabled={busy === row.id}>Move days</button>
                      </form>
                    </div>
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
