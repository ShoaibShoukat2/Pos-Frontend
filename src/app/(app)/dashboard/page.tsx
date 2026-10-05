"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";

import { TableSkeleton } from "@/components/DataTable";
import { Badge, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { num, rs } from "@/lib/money";
import type { LiveProduct, OwnerOverview, ReportSeries } from "@/lib/types";

const PERIODS = [
  { id: "today", label: "Today" },
  { id: "week", label: "7 days" },
  { id: "month", label: "This month" },
] as const;

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
  }, [period]);

  const products = data?.live_products || [];
  const visible = useMemo(
    () => (filter === "all" ? products : products.filter((row) => row.action === filter)),
    [products, filter],
  );
  const selected = visible.find((row) => row.id === selectedId) || visible[0] || products[0] || null;
  const counts = data?.live_counts;

  const kpis = data
    ? [
        { label: period === "today" ? "Sales today" : "Sales", value: rs(data.today_sales), href: "/reports" },
        { label: "Net profit", value: rs(data.today_profit), href: "/reports" },
        { label: "Orders", value: String(data.orders), href: "/reports" },
        { label: "Customers", value: String(data.customers), href: "/customers" },
        { label: "Receivables", value: rs(data.outstanding), href: "/customers" },
        { label: "Payables", value: rs(data.payables), href: "/purchases" },
        { label: "Expenses", value: rs(data.expenses), href: "/expenses" },
        { label: "Products", value: String(data.products), href: "/products" },
        { label: "Services", value: String(data.services ?? 0), href: "/services" },
        { label: "Staff", value: `${data.users_active}/${data.users_total}`, href: "/settings/cashiers" },
      ]
    : [];

  return (
    <div>
      <PageHeader
        eyebrow={
          user?.business_type === "pizza"
            ? "Pizza shop"
            : user?.is_owner
              ? "Owner overview"
              : "Business overview"
        }
        title={`${user?.business_name || "Dashboard"}${user?.first_name ? ` · ${user.first_name}` : ""}`}
        description={
          user?.business_type === "pizza"
            ? "Menu, counter, today’s pizzas, cash and staff."
            : `${data ? `${data.from} → ${data.to}` : "Live sales, cash, people and catalog activity."}`
        }
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

      {user?.business_type === "pizza" ? <PizzaBoard data={data} period={period} /> : null}

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
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl">{period === "today" ? "Today's sale" : "Sales"}</h2>
                <p className="mt-1 text-xs text-ink-700/55">
                  {data.from} → {data.to}
                </p>
              </div>
              <p className="font-display text-2xl text-ink-950">{rs(data.today_sales)}</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <Stat label="Orders" value={String(data.orders)} />
              <Stat label="Products sold" value={String(data.products_sold ?? 0)} />
              <Stat label="Catalog sold" value={`${num(data.product_sale_percent).toFixed(0)}%`} />
            </div>
            <SalesChart rows={data.daily} />
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
                      <td className="px-4 py-3 font-medium">{rs(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl">Products sold</h2>
                <p className="mt-1 text-xs text-ink-700/55">
                  {data.products_sold ?? 0} of {data.products} catalog products sold
                  {period === "today" ? " today" : " in this period"}
                </p>
              </div>
              <SoldRing percent={num(data.product_sale_percent)} />
            </div>
            {data.top_products.length === 0 ? (
              <p className="mt-4 text-sm text-ink-700/70">Product amounts appear after POS sales.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wide text-ink-700/55">
                    <tr>
                      <th className="pb-2 font-medium">Product</th>
                      <th className="pb-2 text-right font-medium">Qty</th>
                      <th className="pb-2 text-right font-medium">Amount</th>
                      <th className="pb-2 text-right font-medium">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_products.map((row) => (
                      <tr key={row.product} className="border-t border-paper-100">
                        <td className="py-2 pr-3">
                          <p className="font-medium text-ink-950">{row.product}</p>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-100">
                            <div
                              className="h-1.5 rounded-full bg-copper-500"
                              style={{ width: `${Math.max(num(row.share), 2)}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-2 text-right tabular-nums">{fmtQty(row.qty)}</td>
                        <td className="py-2 text-right font-medium tabular-nums">{rs(row.revenue)}</td>
                        <td className="py-2 text-right tabular-nums">{num(row.share).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl">Live catalog</h2>
            <p className="mt-1 text-sm text-ink-700/60">
              Products moving right now. {counts?.total || 0} with a recent change. Services stay on the Services page.
            </p>
          </div>
          <div className="flex flex-wrap rounded-xl border border-paper-200 bg-white p-1">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  filter === item.id ? "bg-ink-950 text-paper-50" : "text-ink-700/70 hover:text-ink-950"
                }`}
              >
                {item.label}
                {item.id !== "all" && counts ? ` ${counts[item.id]}` : ""}
              </button>
            ))}
          </div>
        </div>
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="overflow-hidden rounded-2xl border border-paper-200 bg-white shadow-card">
            <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_6.5rem_5.5rem] gap-3 border-b border-paper-200 bg-paper-50 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-700/55 md:grid">
              <span>Product</span>
              <span>What happened</span>
              <span className="text-right">Price</span>
              <span className="text-right">Stock</span>
            </div>
            <div className="max-h-[32rem] overflow-y-auto">
              {visible.map((item) => {
                const active = selected?.id === item.id && selected?.action === item.action;
                return (
                  <button
                    key={`${item.id}-${item.action}-${item.at}`}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`grid w-full gap-1 border-b border-paper-100 px-4 py-3 text-left last:border-b-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_6.5rem_5.5rem] md:items-center md:gap-3 ${
                      active ? "bg-copper-400/10" : "hover:bg-paper-50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <Badge tone={ACTION_TONE[item.action]}>{ACTION_LABEL[item.action]}</Badge>
                        <span className="truncate font-medium text-ink-950">{item.name}</span>
                      </span>
                      <span className="mt-1 block truncate text-xs text-ink-700/55">
                        {[item.category, item.sku].filter(Boolean).join(" · ") || "No SKU"}
                        <span className="md:hidden"> · {timeAgo(item.at)}</span>
                      </span>
                    </span>
                    <span className="truncate text-xs text-ink-700/70">{item.detail}</span>
                    <span className="text-sm font-medium tabular-nums text-ink-950 md:text-right">{rs(item.selling_price)}</span>
                    <span className="text-xs tabular-nums text-ink-700/60 md:text-right">{fmtQty(item.qty)} in stock</span>
                  </button>
                );
              })}
              {!loading && visible.length === 0 ? (
                <p className="px-4 py-10 text-sm text-ink-700/65">
                  Nothing in this filter yet. Sell, receive a purchase, or add a product.
                </p>
              ) : null}
            </div>
          </div>
          <aside className="rounded-2xl border border-paper-200 bg-white p-5 shadow-card xl:sticky xl:top-4">
            {selected ? (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={ACTION_TONE[selected.action]}>{ACTION_LABEL[selected.action]}</Badge>
                  <span className="text-[11px] text-ink-700/50">{timeAgo(selected.at)}</span>
                </div>
                <h3 className="mt-3 font-display text-2xl leading-tight text-ink-950">{selected.name}</h3>
                <p className="mt-1 text-sm text-ink-700/70">{selected.detail}</p>
                <dl className="mt-4 space-y-2 border-t border-paper-100 pt-3 text-sm">
                  <Row label="SKU" value={selected.sku || "—"} />
                  <Row label="Barcode" value={selected.barcode || "—"} />
                  <Row label="Category" value={selected.category || "—"} />
                  <Row label="Sell" value={rs(selected.selling_price)} />
                  <Row label="Cost" value={rs(selected.cost_price)} />
                  <Row label="Stock" value={`${fmtQty(selected.qty)} in stock`} />
                </dl>
                <Link href={`/products/${selected.id}`} className="mt-4 inline-block text-sm font-medium text-copper-600 underline">
                  Open product
                </Link>
              </div>
            ) : (
              <p className="text-sm text-ink-700/65">Select a product to see its fields.</p>
            )}
            <div className="mt-5 border-t border-paper-100 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700/55">Latest movement</p>
              <ul className="mt-3 space-y-2">
                {(data?.activity || []).slice(0, 6).map((row, index) => (
                  <li key={`${row.kind}-${row.at}-${index}`}>
                    <Link href={row.href} className="block rounded-xl px-2 py-2 hover:bg-paper-50">
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-medium text-ink-950">{row.title}</span>
                        <span className="shrink-0 text-[11px] text-ink-700/45">{timeAgo(row.at)}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-700/55">{row.detail}</span>
                    </Link>
                  </li>
                ))}
                {!data?.activity.length ? <li className="text-sm text-ink-700/60">No recent movement.</li> : null}
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
              <Link href="/settings/cashiers" className="text-xs text-copper-700 hover:underline">
                Cashiers
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
                          {row.opened_by}
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
              Catalog: {data.products} products · {data.variants} SKUs · {data.suppliers} suppliers
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const PIZZA_CATEGORIES = [
  "Classic pizzas",
  "Specialty pizzas",
  "Sides",
  "Drinks",
  "Desserts",
  "Deals",
];

const PIZZA_LINKS = [
  { href: "/pos", label: "Open counter" },
  { href: "/products", label: "Menu" },
  { href: "/customers", label: "Customers" },
  { href: "/cash", label: "Cash drawer" },
  { href: "/purchases", label: "Ingredients" },
  { href: "/expenses", label: "Expenses" },
  { href: "/reports", label: "Reports" },
  { href: "/settings/invoice", label: "Invoice slip" },
  { href: "/settings/cashiers", label: "Cashiers" },
];

function PizzaBoard({ data, period }: { data: OwnerOverview | null; period: string }) {
  const sales = data?.category_sales || [];
  const byName = new Map(sales.map((row) => [row.category, row]));
  return (
    <section className="card mb-6 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-copper-600">Pizza shop</p>
          <h2 className="font-display text-2xl text-ink-950">Handle the shop from here</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-700/70">
            Categories are Classic, Specialty, Sides, Drinks, Desserts and Deals. Starter pizzas include small, medium and large. Change prices on the menu.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-ink-700/50">{period === "today" ? "Today’s sale" : "Sales"}</p>
          <p className="font-display text-3xl text-ink-950">{data ? rs(data.today_sales) : "—"}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {PIZZA_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-full border border-paper-200 bg-paper-50 px-3 py-1.5 text-xs font-medium text-ink-800 hover:border-copper-400">
            {item.label}
          </Link>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PIZZA_CATEGORIES.map((name) => {
          const row = byName.get(name);
          return (
            <div key={name} className="rounded-xl bg-paper-50 px-4 py-3">
              <p className="text-sm font-medium text-ink-950">{name}</p>
              <p className="mt-1 font-display text-2xl">{row ? rs(row.revenue) : rs(0)}</p>
              <p className="text-xs text-ink-700/55">
                {row
                  ? `${fmtQty(row.qty)} sold · ${num(row.share).toFixed(0)}% of sales`
                  : period === "today"
                    ? "No sales today"
                    : "No sales in this period"}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function fmtQty(value: string | number) {
  const n = num(value);
  return n.toLocaleString("en-PK", { maximumFractionDigits: n % 1 === 0 ? 0 : 2 });
}

function shortDate(iso: string) {
  const at = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(at.getTime())) return iso.slice(5);
  return at.toLocaleDateString("en-PK", { day: "2-digit", month: "short" });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-paper-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-ink-700/55">{label}</p>
      <p className="mt-0.5 font-medium text-ink-950">{value}</p>
    </div>
  );
}

function SalesChart({ rows }: { rows: ReportSeries[] }) {
  const points = rows.slice(-10);
  if (points.length === 0) {
    return <p className="mt-4 text-sm text-ink-700/70">No sales in this period yet.</p>;
  }
  const max = Math.max(...points.map((row) => num(row.total)), 1);
  const width = 560;
  const height = 150;
  const gap = 14;
  const barW = Math.min(42, (width - gap * (points.length + 1)) / points.length);
  const group = points.length * barW + (points.length + 1) * gap;
  const offset = Math.max(0, (width - group) / 2);
  return (
    <svg viewBox={`0 0 ${width} ${height + 28}`} className="mt-4 h-44 w-full" role="img" aria-label="Sales by day">
      {points.map((row, index) => {
        const barH = Math.max((num(row.total) / max) * (height - 8), 3);
        const x = offset + gap + index * (barW + gap);
        const y = height - barH;
        return (
          <g key={row.date}>
            <rect x={x} y={y} width={barW} height={barH} rx="4" fill="#d4892a" />
            <text x={x + barW / 2} y={height + 16} textAnchor="middle" fill="#3d342c" fontSize="10">
              {shortDate(row.date)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SoldRing({ percent }: { percent: number }) {
  const safe = Math.min(100, Math.max(0, percent));
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const dash = (safe / 100) * circ;
  return (
    <svg viewBox="0 0 72 72" className="h-16 w-16 shrink-0" role="img" aria-label={`${safe.toFixed(0)} percent of products sold`}>
      <circle cx="36" cy="36" r={radius} fill="none" stroke="#e8dfd0" strokeWidth="7" />
      <circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        stroke="#d4892a"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        transform="rotate(-90 36 36)"
      />
      <text x="36" y="40" textAnchor="middle" fill="#14110e" fontSize="13" fontWeight="600">
        {safe.toFixed(0)}%
      </text>
    </svg>
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
