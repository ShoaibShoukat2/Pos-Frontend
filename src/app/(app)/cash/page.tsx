"use client";

import { FormEvent, useEffect, useState } from "react";

import { ListState, Pager } from "@/components/DataTable";
import { Badge, Button, Field, Input, PageHeader } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { usePagedList } from "@/lib/query";
import type { CashSession } from "@/lib/types";

export default function CashPage() {
  const sessions = usePagedList<CashSession>("/api/cash-sessions/");
  const [current, setCurrent] = useState<CashSession | null>(null);
  const [opening, setOpening] = useState("10000");
  const [actual, setActual] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function loadCurrent() {
    try {
      setCurrent(await api<CashSession>("/api/cash-sessions/current/"));
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
        body: JSON.stringify({ opening_cash: opening }),
      });
      await loadCurrent();
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
      await loadCurrent();
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
        eyebrow="Cash"
        title="Cash drawer"
        description="Opening + sales cash + customer receipts − expenses − refunds − supplier payments = expected cash."
      />
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display text-xl">Open shift</h2>
          <form onSubmit={openShift} className="mt-4 grid gap-3">
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
            <p className="mt-4 text-sm text-ink-700/70">No open shift. Open the drawer before taking cash.</p>
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
                <td className="px-4 py-3">{row.number}</td>
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
    <div className={`flex justify-between gap-3 ${strong ? "font-medium" : ""}`}>
      <span className="text-ink-700/70">{label}</span>
      <span>Rs {value}</span>
    </div>
  );
}
