"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CreditCard,
  Keyboard,
  Monitor,
  QrCode,
  RefreshCw,
  Receipt,
  RotateCcw,
  Search,
  Smartphone,
  UserCircle,
  WifiOff,
} from "lucide-react";

import { TableSkeleton } from "@/components/DataTable";
import { Badge, Button, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { rs } from "@/lib/money";
import { pendingCount, syncPending } from "@/lib/offline";
import type { CashierOverview } from "@/lib/types";

const ACTIONS = [
  { href: "/pos", label: "Open POS", hint: "Sell on this counter", icon: Monitor },
  { href: "/cashier/sales", label: "My sales", hint: "Tickets and items you sold", icon: Receipt },
  { href: "/cashier/returns", label: "Returns", hint: "Customer brought an item back", icon: RotateCcw },
  { href: "/cashier/lookup", label: "Find to sell", hint: "Price and SKU for the ticket", icon: Search },
  { href: "/cash", label: "Cash drawer", hint: "Open or close shift", icon: Banknote },
];

const MANUAL = [
  {
    href: "/pos?help=type",
    title: "Type SKU, barcode or name",
    hint: "Scanner dead? Type in the search box and press Enter. No gun needed.",
    icon: Keyboard,
  },
  {
    href: "/pos?help=camera",
    title: "Scan with computer camera",
    hint: "Use the webcam if the barcode reader is unplugged or jammed.",
    icon: QrCode,
  },
  {
    href: "/pos?help=phone",
    title: "Scan with your phone",
    hint: "Show the counter QR, open the phone camera, and barcodes go to the ticket.",
    icon: Smartphone,
  },
  {
    href: "/cashier/lookup",
    title: "Find a product to sell",
    hint: "See selling price, SKU and stock, then send it to the POS ticket. You cannot add catalog items.",
    icon: Search,
  },
  {
    href: "/customers",
    title: "Find or add a customer",
    hint: "If loyalty or credit is needed, search the shopper or create a walk-in later.",
    icon: UserCircle,
  },
  {
    href: "/cash",
    title: "Open / close cash drawer",
    hint: "Drawer closed, wrong float, or shift stuck? Fix it here, then go back to POS.",
    icon: Banknote,
  },
  {
    href: "/pos?help=pay",
    title: "Take card or bank instead of cash",
    hint: "If the drawer will not open, complete the sale with Card or Bank.",
    icon: CreditCard,
  },
  {
    href: "/cashier/returns",
    title: "Customer brought an item back",
    hint: "Find the ticket, remove the item, refund the customer. Stock comes back to the shelf.",
    icon: RotateCcw,
  },
];

export default function CashierDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<CashierOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [queued, setQueued] = useState(0);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState("");

  useEffect(() => {
    let active = true;
    api<CashierOverview>("/api/auth/cashier/overview/")
      .then((row) => {
        if (active) setData(row);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    pendingCount()
      .then((n) => {
        if (active) setQueued(n);
      })
      .catch(() => {});
    function onOnline() {
      setOnline(true);
      pendingCount().then(setQueued).catch(() => {});
    }
    function onOffline() {
      setOnline(false);
    }
    setOnline(navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      active = false;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  async function retrySync() {
    setSyncing(true);
    setSyncNote("");
    try {
      const result = await syncPending();
      const left = await pendingCount();
      setQueued(left);
      setSyncNote(
        result
          ? `${result.synced} sale${result.synced === 1 ? "" : "s"} synced${result.failed ? `, ${result.failed} still waiting` : ""}.`
          : "Nothing waiting to sync.",
      );
    } catch {
      setSyncNote("Could not sync yet. Keep selling — tickets stay on this counter.");
    } finally {
      setSyncing(false);
    }
  }

  const issues = [
    !online
      ? {
          title: "No internet",
          detail: "Keep selling. Each ticket is saved on this computer and will sync when the line is back.",
          href: "/pos",
          action: "Open POS anyway",
        }
      : null,
    queued > 0
      ? {
          title: `${queued} sale${queued === 1 ? "" : "s"} waiting to sync`,
          detail: "These were saved while the counter was offline. Sync them when the network is live.",
          href: "/pos",
          action: "Open POS",
        }
      : null,
    data && !data.open_shift
      ? {
          title: "Cash drawer is closed",
          detail: "Open a shift before taking cash. Until then, take card or bank on the POS.",
          href: "/cash",
          action: "Open drawer",
        }
      : null,
  ].filter(Boolean) as { title: string; detail: string; href: string; action: string }[];

  return (
    <div>
      <PageHeader
        eyebrow="Cashier desk"
        title={`Hello, ${data?.cashier_name || user?.first_name || "cashier"}`}
        description={`${data?.business_name || user?.business_name || "Your shop"}. This desk shows only your counter sales and the products on those tickets.`}
        action={
          <Link href="/pos" className="btn-copper text-center">
            Open POS
          </Link>
        }
      />

      {loading && !data ? <TableSkeleton rows={2} cols={3} /> : null}

      {data ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div className="card p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-ink-700/55">My sales today</p>
            <p className="stat-value mt-1.5">{rs(data.today_sales)}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-ink-700/55">My orders</p>
            <p className="stat-value mt-1.5">{data.orders}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-ink-700/55">Cash drawer</p>
            <p className="mt-2">
              <Badge tone={data.open_shift ? "good" : "warn"}>{data.open_shift ? "Open" : "Closed"}</Badge>
            </p>
            {data.open_shift ? (
              <p className="mt-2 text-xs text-ink-700/60">
                {data.open_shift.number} · expected {rs(data.open_shift.expected_cash)}
              </p>
            ) : (
              <p className="mt-2 text-xs text-ink-700/60">Open a drawer before taking cash.</p>
            )}
          </div>
          <div className="card p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-ink-700/55">Counter</p>
            <p className="mt-2">
              <Badge tone={online ? "good" : "warn"}>{online ? "Live" : "Offline"}</Badge>
            </p>
            <p className="mt-2 text-xs text-ink-700/60">
              {queued > 0 ? `${queued} sale${queued === 1 ? "" : "s"} saved on this PC` : "No pending tickets"}
            </p>
          </div>
        </div>
      ) : null}

      {issues.length ? (
        <section className="mt-6">
          <h2 className="font-display text-xl">Needs attention</h2>
          <p className="mt-1 text-sm text-ink-700/60">Fix these first, then keep selling.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {issues.map((item) => (
              <div key={item.title} className="card flex flex-col gap-3 border-amber-300 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-900">
                    {item.title.includes("internet") ? <WifiOff size={18} /> : <AlertTriangle size={18} />}
                  </span>
                  <span>
                    <span className="block font-medium">{item.title}</span>
                    <span className="mt-0.5 block text-sm text-ink-700/65">{item.detail}</span>
                  </span>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {item.title.includes("waiting") ? (
                    <Button type="button" variant="ghost" disabled={syncing} onClick={() => retrySync()}>
                      <RefreshCw size={16} />
                      {syncing ? "Syncing…" : "Sync now"}
                    </Button>
                  ) : null}
                  <Link href={item.href} className="btn-primary text-center">
                    {item.action}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {syncNote ? <p className="mt-2 text-sm text-emerald-800">{syncNote}</p> : null}
        </section>
      ) : null}

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5">
            <div>
              <h2 className="font-display text-xl">Products you sold today</h2>
              <p className="mt-1 text-xs text-ink-700/55">From your tickets only — not the owner catalog.</p>
            </div>
            <Link href="/cashier/lookup" className="text-xs text-copper-700 underline">
              Find to sell
            </Link>
          </div>
          {data?.sold_products?.length ? (
            <ul className="mt-3 divide-y divide-paper-100">
              {data.sold_products.map((row) => (
                <li key={`${row.sku}-${row.product}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{row.product}</span>
                    <span className="block text-xs text-ink-700/55">
                      {row.sku || "No SKU"} · {fmtQty(row.qty)} sold · {row.tickets} ticket{row.tickets === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">{rs(row.revenue)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-sm text-ink-700/70">No products on your tickets yet. Open POS to sell.</p>
          )}
        </div>
        <div className="card p-5">
          <h2 className="font-display text-xl">Quick links</h2>
          <p className="mt-1 text-sm text-ink-700/60">Counter tools only.</p>
          <div className="mt-4 grid gap-3">
            {ACTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="flex items-start gap-3 rounded-xl border border-paper-200 p-3 hover:border-copper-400">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-paper-50 text-ink-950">
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
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl">If hardware fails</h2>
        <p className="mt-1 text-sm text-ink-700/60">
          Finish the sale by hand. You still cannot add or edit the shop catalog — only sell what is already there.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MANUAL.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="card flex items-start gap-3 p-4 hover:border-copper-400">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-950 text-paper-50">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block font-medium">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-ink-700/60">{item.hint}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="font-display text-xl">My tickets today</h2>
            <p className="mt-1 text-xs text-ink-700/55">Each sale with the products on it.</p>
          </div>
          <Link href="/cashier/sales" className="text-xs text-copper-700 underline">
            All my sales
          </Link>
        </div>
        {loading && !data ? (
          <TableSkeleton rows={3} cols={3} />
        ) : data?.recent_sales.length ? (
          <ul className="mt-3 divide-y divide-paper-100">
            {data.recent_sales.map((row) => (
              <li key={row.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-medium">{row.number}</span>
                    <span className="block text-xs text-ink-700/55">
                      {row.customer_name} · {row.payment_method || "sale"}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">{rs(row.total)}</span>
                </div>
                {row.lines?.length ? (
                  <ul className="mt-2 space-y-1 text-xs text-ink-700/70">
                    {row.lines.map((line, index) => (
                      <li key={`${row.id}-${line.sku}-${index}`} className="flex justify-between gap-3">
                        <span className="truncate">
                          {fmtQty(line.qty)} × {line.product}
                          {line.sku ? ` · ${line.sku}` : ""}
                        </span>
                        <span className="shrink-0">{rs(line.total)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-sm text-ink-700/70">No sales yet today. Open POS to start — or type the SKU if the scanner is down.</p>
        )}
      </div>
    </div>
  );
}

function fmtQty(value: string) {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString("en-PK", { maximumFractionDigits: n % 1 === 0 ? 0 : 3 });
}
