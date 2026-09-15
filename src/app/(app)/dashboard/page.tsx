"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  BarChart3,
  Building2,
  Monitor,
  Package,
  Receipt,
  Shield,
  ShoppingBag,
  Store,
  Tag,
  UserCircle,
  UserPlus,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";

import { TableSkeleton } from "@/components/DataTable";
import { Badge, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useBranch } from "@/lib/branch";
import { num, rs } from "@/lib/money";
import type { LiveProduct, OwnerOverview } from "@/lib/types";

const PERIODS = [
  { id: "today", label: "Today" },
  { id: "week", label: "7 days" },
  { id: "month", label: "This month" },
] as const;

const ACTIONS = [
  { href: "/pos", label: "Open POS", hint: "Sell now", icon: Monitor },
  { href: "/products", label: "Products", hint: "Add or edit catalog", icon: Package },
  { href: "/services", label: "Services", hint: "Repair and jobs", icon: Wrench },
  { href: "/stock", label: "Stock", hint: "On-hand and alerts", icon: Warehouse },
  { href: "/customers", label: "Customers", hint: "Credit and loyalty", icon: UserCircle },
  { href: "/purchases", label: "Purchases", hint: "Orders and payables", icon: ShoppingBag },
  { href: "/expenses", label: "Expenses", hint: "Record a cost", icon: Receipt },
  { href: "/cash", label: "Cash drawer", hint: "Open or close shift", icon: Banknote },
  { href: "/reports", label: "Reports", hint: "Sales and profit", icon: BarChart3 },
  { href: "/settings/cashiers", label: "Add cashier", hint: "Create cashier login", icon: UserPlus },
  { href: "/settings/users", label: "Users", hint: "Staff access", icon: Users },
  { href: "/settings/roles", label: "Roles", hint: "Permissions", icon: Shield },
  { href: "/settings/branches", label: "Branches", hint: "Stores", icon: Store },
  { href: "/settings/business", label: "Business", hint: "Profile and tax", icon: Building2 },
  { href: "/promotions", label: "Loyalty", hint: "Coupons and points", icon: Tag },
];

const FILTERS = [
  { id: "all", label: "All products" },
  { id: "sold", label: "Sold" },
  { id: "purchased", label: "Purchased" },
  { id: "added", label: "Added" },
  { id: "updated", label: "Updated" },
] as const;

const ACTION_TONE: Record<LiveProduct["action"], "copper" | "good" | "warn" | "neutral"> = {
  sold: "copper",
  purchased: "good",
  added: "good",
  updated: "neutral",
  catalog: "neutral",
};

const ACTION_LABEL: Record<LiveProduct["action"], string> = {
  sold: "Sold",
  purchased: "Purchased",
  added: "Added",
  updated: "Updated",
  catalog: "In catalog",
};

function timeAgo(value: string) {
  const at = new Date(value).getTime();
  if (Number.isNaN(at)) return "";
  const mins = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { branch, branchId } = useBranch();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("today");
  const [data, setData] = useState<OwnerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    function load(silent = false) {
      if (!silent) setLoading(true);
      api<OwnerOverview>(`/api/reports/owner/?period=${period}`)
        .then((row) => {
          if (active) setData(row);
        })
        .catch(() => {
          if (active && !silent) setData(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    load();
    const tick = window.setInterval(() => load(true), 10000);
    return () => {
      active = false;
      window.clearInterval(tick);
    };
  }, [period, branchId]);

  const products = data?.live_products || [];
  const visible = useMemo(
    () => (filter === "all" ? products : products.filter((row) => row.action === filter)),
    [products, filter],
  );
  const selected = visible.find((row) => row.id === selectedId) || visible[0] || products[0] || null;
  const counts = data?.live_counts;
  const maxDaily = Math.max(...(data?.daily.map((row) => num(row.total)) || [0]), 1);

  const kpis = data
    ? [
        { label: period === "today" ? "Sales today" : "Sales", value: rs(data.today_sales), href: "/reports" },
        { label: "Net profit", value: rs(data.today_profit), href: "/reports" },
        { label: "Orders", value: String(data.orders), href: "/reports" },
        { label: "Customers", value: String(data.customers), href: "/customers" },
        { label: "Stock value", value: rs(data.stock_value), href: "/stock" },
        { label: "Low stock", value: String(data.low_stock), href: "/stock" },
        { label: "Receivables", value: rs(data.outstanding), href: "/customers" },
        { label: "Payables", value: rs(data.payables), href: "/purchases" },
        { label: "Expenses", value: rs(data.expenses), href: "/expenses" },
        { label: "Products", value: String(data.products), href: "/products" },
        { label: "Staff", value: `${data.users_active}/${data.users_total}`, href: "/settings/users" },
        { label: "Branches", value: String(data.branches), href: "/settings/branches" },
      ]
    : [];

  return (
    <div>
      <PageHeader
        eyebrow={user?.is_owner ? "Owner overview" : "Business overview"}
        title={`${user?.business_name || "Dashboard"}${user?.first_name ? ` · ${user.first_name}` : ""}`}
        description={`${branch ? branch.name : "All branches"} · ${data ? `${data.from} → ${data.to}` : "Live sales, stock, cash, people and catalog activity."}`}
        action={
          <div className="flex w-full flex-col items-stretch gap-2 sm:items-end">
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
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Link href="/settings/cashiers" className="btn-primary text-center">
                Add cashier
              </Link>
              <Link href="/pos" className="btn-copper text-center">
                Open POS
              </Link>
            </div>
          </div>
        }
      />

      <Link
        href="/settings/cashiers"
        className="card mb-6 flex items-start gap-4 border-copper-300 p-5 hover:border-copper-500"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-copper-500 text-ink-950">
          <UserPlus size={22} />
        </span>
        <span>
          <span className="block font-display text-xl text-ink-950">Add a cashier</span>
          <span className="mt-1 block text-sm text-ink-700/70">
            Create their email and password, then tell them to sign in as Cashier.
          </span>
        </span>
      </Link>

      {loading && !data ? <TableSkeleton rows={3} cols={4} /> : null}

      {data?.alerts.length ? (
        <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.alerts.map((alert) => (
            <Link key={alert.title} href={alert.href} className="card p-4 hover:border-copper-400">
              <Badge tone={alert.tone === "good" ? "good" : alert.tone === "warn" ? "warn" : "copper"}>
                {alert.tone === "warn" ? "Action needed" : "Watch"}
              </Badge>
              <p className="mt-2 font-medium">{alert.title}</p>
              <p className="mt-0.5 text-xs text-ink-700/60">{alert.detail}</p>
            </Link>
          ))}
        </div>
      ) : null}

      {kpis.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((card) => (
            <Link key={card.label} href={card.href} className="card p-4 hover:border-copper-400">
              <p className="text-[11px] uppercase tracking-[0.16em] text-ink-700/55">{card.label}</p>
              <p className="stat-value mt-1.5">{card.value}</p>
            </Link>
          ))}
        </div>
      ) : !loading ? (
        <p className="text-sm text-ink-700/70">Numbers appear once you have report access.</p>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display text-xl">Owner controls</h2>
        <p className="mt-1 text-sm text-ink-700/60">Jump into any part of the system.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="card flex items-start gap-3 p-4 hover:border-copper-400">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-950 text-paper-50">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block font-medium">{item.label}</span>
                  <span className="block text-xs text-ink-700/55">{item.hint}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {data ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="font-display text-xl">Profit and loss</h2>
            <p className="mt-1 text-xs text-ink-700/55">
              {data.from} → {data.to}
            </p>
            <dl className="mt-5 space-y-2 text-sm">
              <Row label="Revenue" value={rs(data.revenue)} />
              <Row label="Cost of goods" value={rs(data.cost)} />
              <div className="border-t border-paper-200 pt-2">
                <Row label="Gross profit" value={rs(data.gross_profit)} strong />
              </div>
              <Row label="Expenses" value={rs(data.expenses)} />
              <div className="border-t border-paper-200 pt-2">
                <Row label="Net profit" value={rs(data.today_profit)} strong />
              </div>
            </dl>
          </div>
          <div className="card p-6">
            <h2 className="font-display text-xl">Sales trend</h2>
            {data.daily.length === 0 ? (
              <p className="mt-4 text-sm text-ink-700/70">No sales in this period yet.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {data.daily.slice(-10).map((row) => (
                  <li key={row.date}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{row.date}</span>
                      <span>
                        {rs(row.total)}
                        <span className="ml-2 text-ink-700/45">{row.orders} orders</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-paper-100">
                      <div
                        className="h-2 rounded-full bg-copper-500"
                        style={{ width: `${Math.max((num(row.total) / maxDaily) * 100, 4)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {data ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5">
              <h2 className="font-display text-xl">Latest sales</h2>
              <Link href="/reports" className="text-xs text-copper-700 hover:underline">
                Full reports
              </Link>
            </div>
            {data.recent_sales.length === 0 ? (
              <p className="px-5 py-8 text-sm text-ink-700/70">No sales yet. Open POS to start.</p>
            ) : (
              <table className="mt-3 w-full text-left text-sm">
                <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
                  <tr>
                    <th className="px-4 py-2">Sale</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Branch</th>
                    <th className="px-4 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_sales.map((row) => (
                    <tr key={row.id} className="border-t border-paper-100">
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.number}</p>
                        <p className="text-xs text-ink-700/55">{row.cashier_name}</p>
                      </td>
                      <td className="px-4 py-3">{row.customer_name}</td>
                      <td className="px-4 py-3 text-ink-700/80">{row.branch_name}</td>
                      <td className="px-4 py-3 font-medium">{rs(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">Top products</h2>
              <Link href="/products" className="text-xs text-copper-700 hover:underline">
                Manage catalog
              </Link>
            </div>
            {data.top_products.length === 0 ? (
              <p className="mt-4 text-sm text-ink-700/70">Product mix appears after POS sales.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {data.top_products.map((row) => (
                  <li key={row.product} className="flex justify-between gap-3 border-b border-paper-100 pb-2">
                    <span>
                      {row.product}
                      <span className="block text-xs text-ink-700/55">{row.qty} sold</span>
                    </span>
                    <span className="font-medium">{rs(row.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Live catalog</h2>
            <p className="mt-1 text-sm text-ink-700/60">
              Products being sold, purchased, added or updated. {counts?.total || 0} moving now.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  filter === item.id ? "bg-ink-950 text-paper-50" : "bg-white text-ink-700"
                }`}
              >
                {item.label}
                {item.id !== "all" && counts ? ` · ${counts[item.id]}` : ""}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.slice(0, 12).map((item) => (
              <button
                key={`${item.id}-${item.action}-${item.at}`}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`card p-4 text-left hover:border-copper-400 ${
                  selected?.id === item.id ? "border-copper-500 ring-2 ring-copper-500/25" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={ACTION_TONE[item.action]}>{ACTION_LABEL[item.action]}</Badge>
                  <span className="text-[11px] text-ink-700/50">{timeAgo(item.at)}</span>
                </div>
                <p className="mt-2 font-medium text-ink-950">{item.name}</p>
                <p className="text-xs text-ink-700/55">{[item.category, item.sku].filter(Boolean).join(" · ") || "No SKU"}</p>
                <p className="mt-2 text-xs text-ink-700/70">{item.detail}</p>
                <div className="mt-3 flex items-end justify-between">
                  <p className="font-display text-lg">{rs(item.selling_price)}</p>
                  <p className="text-xs text-ink-700/55">{item.qty} on hand</p>
                </div>
              </button>
            ))}
            {!loading && visible.length === 0 ? (
              <p className="card px-4 py-8 text-sm text-ink-700/65 sm:col-span-2">
                Nothing in this filter yet. Sell, receive a purchase, or add a product.
              </p>
            ) : null}
          </div>
          <aside className="card space-y-4 p-5">
            {selected ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-copper-600">
                  {ACTION_LABEL[selected.action]} · {timeAgo(selected.at)}
                </p>
                <h3 className="mt-1 font-display text-2xl text-ink-950">{selected.name}</h3>
                <p className="mt-1 text-sm text-ink-700/70">{selected.detail}</p>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <Row label="SKU" value={selected.sku || "—"} />
                  <Row label="Barcode" value={selected.barcode || "—"} />
                  <Row label="Category" value={selected.category || "—"} />
                  <Row label="Sell" value={rs(selected.selling_price)} />
                  <Row label="Cost" value={rs(selected.cost_price)} />
                  <Row label="Stock" value={`${selected.qty} on hand`} />
                </dl>
                <Link href={`/products/${selected.id}`} className="mt-3 inline-block text-sm text-copper-700 underline">
                  Open product
                </Link>
              </div>
            ) : (
              <p className="text-sm text-ink-700/65">Select a product to see details.</p>
            )}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700/55">What just happened</p>
              <ul className="mt-2 space-y-2">
                {(data?.activity || []).slice(0, 8).map((row, index) => (
                  <li key={`${row.kind}-${row.at}-${index}`}>
                    <Link href={row.href} className="flex items-start justify-between gap-2 border-b border-paper-100 pb-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{row.title}</span>
                        <span className="block truncate text-xs text-ink-700/55">{row.detail}</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-ink-700/45">{timeAgo(row.at)}</span>
                    </Link>
                  </li>
                ))}
                {!data?.activity.length ? <li className="text-sm text-ink-700/60">No recent activity.</li> : null}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {data ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">Team</h2>
              <Link href="/settings/users" className="text-xs text-copper-700 hover:underline">
                Manage users
              </Link>
            </div>
            <p className="mt-1 text-xs text-ink-700/55">
              {data.users_active} active of {data.users_total}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {data.team.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 border-b border-paper-100 pb-2">
                  <span>
                    {row.name}
                    <span className="block text-xs text-ink-700/55">{row.email}</span>
                  </span>
                  <Badge tone={row.is_owner ? "copper" : row.is_active ? "good" : "warn"}>
                    {row.is_owner ? "Owner" : row.is_active ? row.role : "Inactive"}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">Cash drawers</h2>
              <Link href="/cash" className="text-xs text-copper-700 hover:underline">
                Open or close
              </Link>
            </div>
            {data.open_shifts.length === 0 ? (
              <p className="mt-4 text-sm text-ink-700/70">No drawer is open. Open one before taking cash.</p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm">
                {data.open_shifts.map((row) => (
                  <li key={row.id} className="rounded-xl border border-paper-200 px-3 py-3">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium">
                        {row.number}
                        <span className="block text-xs font-normal text-ink-700/55">
                          {row.branch_name} · {row.opened_by}
                        </span>
                      </span>
                      <Badge tone="good">Open</Badge>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-ink-700/70">
                      <span>Sales cash {rs(row.sales_cash)}</span>
                      <span>Expected {rs(row.expected_cash)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-ink-700/55">
              Catalog: {data.products} products · {data.variants} SKUs · {data.suppliers} suppliers · {data.sku_locations}{" "}
              stock locations
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-ink-700/70">{label}</dt>
      <dd className={`min-w-0 break-words text-right ${strong ? "font-display text-lg" : ""}`}>{value}</dd>
    </div>
  );
}
