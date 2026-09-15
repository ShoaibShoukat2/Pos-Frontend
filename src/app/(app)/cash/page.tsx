"use client";

import { FormEvent, useEffect, useState } from "react";

import { ListState, Pager } from "@/components/DataTable";
import { Badge, Button, Field, Input, PageHeader, Select } from "@/components/ui";
import { ApiError, api, apiCached } from "@/lib/api";
import { usePagedList } from "@/lib/query";
import type { Branch, CashSession } from "@/lib/types";

export default function CashPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const sessions = usePagedList<CashSession>("/api/cash-sessions/");
  const [current, setCurrent] = useState<CashSession | null>(null);
  const [branch, setBranch] = useState("");
  const [opening, setOpening] = useState("10000");
  const [actual, setActual] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function loadCurrent(selected?: string) {
    const br = await apiCached<Branch[]>("/api/branches/");
    setBranches(br);
    const nextBranch = selected || branch || br[0]?.id || "";
    if (!branch) setBranch(nextBranch);
    try {
      setCurrent(await api<CashSession>(`/api/cash-sessions/current/?branch=${nextBranch}`));
    } catch {
      setCurrent(null);
    }
  }

  useEffect(() => {
    loadCurrent().catch(() => {});
  }, []);

  async function openShift(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await api("/api/cash-sessions/open/", {
        method: "POST",
        body: JSON.stringify({ branch, opening_cash: opening }),
      });
      await loadCurrent(branch);
      await sessions.reload();
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { detail?: string }) : null;
      setError(body?.detail || "Could not open shift.");
    } finally {
      setPending(false);
    }
  }

  async function closeShift(e: FormEvent) {
    e.preventDefault();
    if (!current) return;
    setPending(true);
    setError("");
    try {
      await api<CashSession>(`/api/cash-sessions/${current.id}/close/`, {
        method: "POST",
        body: JSON.stringify({ actual_cash: actual }),
      });
      setCurrent(null);
      setActual("");
      await loadCurrent(branch);
      await sessions.reload();
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { detail?: string }) : null;
      setError(body?.detail || "Could not close shift.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Module 12"
        title="Cash drawer"
        description="Opening + sales cash + customer receipts − expenses − refunds − supplier payments = expected cash."
      />
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display text-xl">Open shift</h2>
          <form onSubmit={openShift} className="mt-4 grid gap-3">
            <Field label="Branch">
              <Select
                value={branch}
                onChange={(e) => {
                  setBranch(e.target.value);
                  loadCurrent(e.target.value).catch(() => {});
                }}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Opening cash">
              <Input value={opening} onChange={(e) => setOpening(e.target.value)} />
            </Field>
            <Button type="submit" disabled={pending || !!current}>
              {current ? "Shift already open" : pending ? "Opening…" : "Open drawer"}
            </Button>
          </form>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-xl">Reconciliation</h2>
          {current ? (
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Opening" value={current.opening_cash} />
              <Row label="Sales cash" value={current.sales_cash} />
              <Row label="Customer receipts" value={current.customer_received} />
              <Row label="Expenses" value={current.expense_total} />
              <Row label="Refunds" value={current.refund_total} />
              <Row label="Supplier paid" value={current.supplier_paid} />
              <Row label="Expected" value={current.expected_cash} strong />
              <form onSubmit={closeShift} className="grid gap-3 pt-3">
                <Field label="Actual cash counted">
                  <Input value={actual} onChange={(e) => setActual(e.target.value)} required />
                </Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "Closing…" : "Close shift"}
                </Button>
              </form>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-700/70">No open shift on this branch.</p>
          )}
        </div>
      </div>
      <div className="mt-6">
        <h2 className="mb-3 font-display text-xl">Shift history</h2>
        <ListState loading={sessions.loading} count={sessions.count} emptyTitle="No shifts yet">
        <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
            <tr>
              <th className="px-4 py-3">Shift</th>
              <th className="px-4 py-3">Expected</th>
              <th className="px-4 py-3">Actual</th>
              <th className="px-4 py-3">Difference</th>
            </tr>
          </thead>
          <tbody>
            {sessions.rows.map((row) => (
              <tr key={row.id} className="border-t border-paper-100">
                <td className="px-4 py-3">
                  {row.number}
                  <p className="text-xs text-ink-700/55">{row.branch_name}</p>
                </td>
                <td className="px-4 py-3">Rs {row.expected_cash}</td>
                <td className="px-4 py-3">{row.actual_cash == null ? "—" : `Rs ${row.actual_cash}`}</td>
                <td className="px-4 py-3">
                  {row.difference == null ? (
                    <Badge tone="copper">{row.status}</Badge>
                  ) : (
                    <Badge tone={Number(row.difference) === 0 ? "good" : "warn"}>{row.difference}</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Pager page={sessions.page} pages={sessions.pages} count={sessions.count} onPage={sessions.setPage} />
        </ListState>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between border-b border-paper-100 pb-2">
      <span className="text-ink-700/65">{label}</span>
      <span className={strong ? "font-display text-xl" : ""}>Rs {value}</span>
    </div>
  );
}
