"use client";

import { useEffect, useState } from "react";

import { TableSkeleton } from "@/components/DataTable";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { num, rs } from "@/lib/money";
import type { FinancialReport, SalesReport } from "@/lib/types";

const PERIODS = [
  { id: "today", label: "Today" },
  { id: "week", label: "7 days" },
  { id: "month", label: "This month" },
] as const;

type Tab = "sales" | "financial";

export default function ReportsPage() {
  const { can } = useAuth();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("month");
  const [tab, setTab] = useState<Tab>("sales");
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [financial, setFinancial] = useState<FinancialReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const showSales = can("report.sales") || can("report.cashier");
  const showFinancial = can("report.profit") || can("ledger.view");

  useEffect(() => {
    const first = showSales ? "sales" : showFinancial ? "financial" : "sales";
    setTab((current) => {
      if (current === "sales" && !showSales) return first;
      if (current === "financial" && !showFinancial) return first;
      return current;
    });
  }, [showSales, showFinancial]);

  useEffect(() => {
    setError("");
    setLoading(true);
    const done = () => setLoading(false);
    if (tab === "sales" && showSales) {
      api<SalesReport>(`/api/reports/sales/?period=${period}`)
        .then(setSales)
        .catch(() => setError("Could not load sales report."))
        .finally(done);
    } else if (tab === "financial" && showFinancial) {
      api<FinancialReport>(`/api/reports/financial/?period=${period}`)
        .then(setFinancial)
        .catch(() => setError("Could not load financial report."))
        .finally(done);
    } else {
      done();
    }
  }, [tab, period, showSales, showFinancial]);

  const tabs = [
    showSales && { id: "sales" as const, label: "Sales" },
    showFinancial && { id: "financial" as const, label: "Financial" },
  ].filter(Boolean) as { id: Tab; label: string }[];

  return (
    <div>
      <PageHeader
        eyebrow="Module 12"
        title="Reports"
        description="Daily, weekly and monthly numbers — sales and the profit the owner actually cares about."
        action={
          <div className="flex w-full rounded-xl border border-paper-200 bg-white p-1 sm:w-auto">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium sm:flex-none ${
                  period === p.id ? "bg-ink-950 text-paper-50" : "text-ink-700/70 hover:text-ink-950"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-xl px-4 py-2 text-sm ${
              tab === item.id ? "bg-ink-950 text-paper-50" : "card px-4 py-2 hover:border-copper-400"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      {loading ? <TableSkeleton rows={8} cols={4} /> : null}

      {!loading && tab === "sales" && sales ? <SalesPanel data={sales} /> : null}
      {!loading && tab === "financial" && financial ? <FinancialPanel data={financial} /> : null}
      {!tabs.length ? <Empty title="No report access" hint="Ask the owner to grant report permissions." /> : null}
    </div>
  );
}

function SalesPanel({ data }: { data: SalesReport }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Revenue" value={rs(data.totals.revenue)} />
        <Stat label="Orders" value={String(data.totals.orders)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Daily sales" rows={data.daily.map((r) => ({ label: r.date, value: num(r.total), hint: `${r.orders} orders` }))} />
        <ChartCard title="Weekly sales" rows={data.weekly.map((r) => ({ label: r.date, value: num(r.total), hint: `${r.orders} orders` }))} />
        <ChartCard title="Monthly sales" rows={data.monthly.map((r) => ({ label: r.date.slice(0, 7), value: num(r.total), hint: `${r.orders} orders` }))} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SimpleTable
          title="Product-wise sales"
          empty="No sale movements yet. Product mix appears after POS posts sold units."
          headers={["Product", "Category", "Qty", "Revenue"]}
          rows={data.products.map((r) => [r.product, r.category, r.qty, rs(r.revenue)])}
        />
        <SimpleTable
          title="Category-wise sales"
          empty="No category breakdown until items are sold."
          headers={["Category", "Qty", "Revenue"]}
          rows={data.categories.map((r) => [r.category, r.qty, rs(r.revenue)])}
        />
      </div>
      <SimpleTable
        title="Cashier-wise sales"
        empty="No sales in this period."
        headers={["Cashier", "Orders", "Total"]}
        rows={data.cashiers.map((r) => [r.name, String(r.orders), rs(r.total)])}
      />
    </div>
  );
}

function FinancialPanel({ data }: { data: FinancialReport }) {
  return (
    <div className="space-y-6">
      <div className="card mx-auto max-w-xl p-8">
        <h2 className="font-display text-2xl">Profit & loss</h2>
        <p className="mt-1 text-xs text-ink-700/55">
          {data.from} → {data.to}
        </p>
        <dl className="mt-6 space-y-2 font-mono text-sm">
          <MoneyRow label="Revenue" value={rs(data.revenue)} />
          <MoneyRow label="Cost" value={rs(data.cost)} />
          <div className="border-t border-ink-950/20 pt-2">
            <MoneyRow label="Gross Profit" value={rs(data.gross_profit)} strong />
          </div>
          <MoneyRow label="Expenses" value={rs(data.expenses)} />
          <div className="border-t border-ink-950/20 pt-2">
            <MoneyRow label="Net Profit" value={rs(data.net_profit)} strong />
          </div>
        </dl>
        <p className="mt-6 text-xs leading-relaxed text-ink-700/60">{data.cogs_note}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Receivables" value={rs(data.receivables)} />
        <Stat label="Payables" value={rs(data.payables)} />
      </div>
      <SimpleTable
        title="Expense breakdown"
        empty="No expenses in this period."
        headers={["Category", "Total"]}
        rows={data.expense_breakdown.map((r) => [r.category, rs(r.total)])}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-700/55">{label}</p>
      <p className="stat-value mt-2">{value}</p>
    </div>
  );
}

function MoneyRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="shrink-0">{label}</dt>
      <dd className={`min-w-0 break-words text-right ${strong ? "font-display text-lg font-sans" : ""}`}>{value}</dd>
    </div>
  );
}

function ChartCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number; hint?: string }[];
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="card p-5">
      <h3 className="font-display text-lg">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-ink-700/70">No sales in this period.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{row.label}</span>
                <span>
                  {rs(row.value)}
                  {row.hint ? <span className="ml-2 text-ink-700/45">{row.hint}</span> : null}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-paper-100">
                <div className="h-2 rounded-full bg-copper-500" style={{ width: `${Math.max((row.value / max) * 100, 4)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SimpleTable({
  title,
  empty,
  headers,
  rows,
}: {
  title: string;
  empty: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5">
        <h3 className="font-display text-lg">{title}</h3>
        {rows.length ? <Badge>{rows.length}</Badge> : null}
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-sm text-ink-700/70">{empty}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`${title}-${i}`} className="border-t border-paper-100">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
