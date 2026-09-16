"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Clock3,
  CreditCard,
  Keyboard,
  LayoutDashboard,
  Minus,
  Package,
  Plus,
  QrCode,
  Receipt,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  UserRound,
  Wifi,
  WifiOff,
  Wrench,
} from "lucide-react";

import { CameraScan } from "@/components/CameraScan";
import { HardwareSetup, HardwareStatus, HardwareToasts } from "@/components/HardwareBar";
import { QrImage } from "@/components/QrImage";
import { Badge, Button, Field, Input, Modal, Select } from "@/components/ui";
import { ApiError, NetworkError, api, asList } from "@/lib/api";
import { homeFor, isCashier, useAuth } from "@/lib/auth";
import { useBranch } from "@/lib/branch";
import { useHardware } from "@/lib/hardware";
import { num, rs } from "@/lib/money";
import { loadSnapshot, markSynced, pendingCount, queueSale, removePending, saveSnapshot, syncPending } from "@/lib/offline";
import { useDebounced } from "@/lib/query";
import { quoteCart, type CartLine } from "@/lib/quote";
import type {
  CashierOverview,
  OwnerOverview,
  PosCatalogItem,
  PosCustomer,
  PosSalePayload,
  PosSnapshot,
  ProductVariant,
} from "@/lib/types";

const PAY_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  bank: "Bank",
};

const TENDER = [500, 1000, 5000];
const QTY_PRESETS = [1, 2, 5, 10];

const HELP_COPY: Record<string, string> = {
  type: "Scanner not needed. Type barcode, SKU or product name, then press Enter.",
  camera: "Point the computer camera at the barcode. You can still type if the camera fails.",
  phone: "Scan the counter QR with your phone. Barcodes from the phone land on this ticket.",
  pay: "If cash will not work, tap Card or Bank, enter what the customer paid, then complete the sale.",
};

export function PosRegister({ mode = "standalone" }: { mode?: "standalone" | "owner" }) {
  const { user, can, logout, loading } = useAuth();
  const { branches, branchId, branch, setBranch } = useBranch();
  const [snapshot, setSnapshot] = useState<PosSnapshot | null>(null);
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState(0);
  const [query, setQuery] = useState("");
  const remoteQuery = useDebounced(query, 250);
  const [remoteItems, setRemoteItems] = useState<PosCatalogItem[] | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftQty, setDraftQty] = useState(1);
  const [category, setCategory] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "product" | "service">("all");
  const [customerId, setCustomerId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [manualKind, setManualKind] = useState("");
  const [manualValue, setManualValue] = useState("");
  const [redeem, setRedeem] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payAmount, setPayAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [scanToken, setScanToken] = useState("");
  const [phoneLinked, setPhoneLinked] = useState(false);
  const [overview, setOverview] = useState<OwnerOverview | null>(null);
  const [cashierStats, setCashierStats] = useState<CashierOverview | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [deskHelp, setDeskHelp] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);
  const helpOnce = useRef(false);
  const skuOnce = useRef(false);
  const hardware = useHardware();
  const searchRef = useRef<HTMLInputElement>(null);
  const activeBranch = branchId || user?.default_branch || branches[0]?.id || "";

  useEffect(() => {
    if (!branchId && branches[0]?.id) setBranch(branches[0].id);
  }, [branchId, branches, setBranch]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  function matchItem(code: string, rows: PosCatalogItem[] | null | undefined) {
    const key = code.trim().toLowerCase();
    return rows?.find((row) => row.barcode.toLowerCase() === key || row.sku.toLowerCase() === key) || null;
  }

  const refreshQueue = useCallback(() => {
    pendingCount().then(setQueued).catch(() => {});
  }, []);

  const refreshDash = useCallback(() => {
    if (!user) return;
    if (user.is_owner || user.permissions.includes("report.sales")) {
      api<OwnerOverview>("/api/reports/owner/?period=today")
        .then(setOverview)
        .catch(() => setOverview(null));
      return;
    }
    api<CashierOverview>("/api/auth/cashier/overview/")
      .then(setCashierStats)
      .catch(() => setCashierStats(null));
  }, [user]);

  const load = useCallback(async () => {
    if (!activeBranch) return;
    try {
      const data = await api<PosSnapshot>(`/api/pos/snapshot/?branch=${activeBranch}`);
      setSnapshot(data);
      await saveSnapshot(activeBranch, data);
      setOnline(true);
    } catch (err) {
      const cached = await loadSnapshot(activeBranch);
      if (cached) setSnapshot(cached);
      if (err instanceof NetworkError) setOnline(false);
    }
    refreshQueue();
  }, [activeBranch, refreshQueue]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    refreshDash();
  }, [refreshDash, activeBranch]);

  useEffect(() => {
    function onOnline() {
      setOnline(true);
      syncPending().finally(() => {
        load();
        refreshQueue();
        refreshDash();
      });
    }
    function onOffline() {
      setOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [load, refreshQueue, refreshDash]);

  const customer = snapshot?.customers.find((c) => c.id === customerId) || null;
  const quote = snapshot
    ? quoteCart(cart, snapshot, {
        couponCode,
        customer,
        manualKind,
        manualValue: Number(manualValue || 0),
        redeemPoints: Number(redeem || 0),
      })
    : null;

  useEffect(() => {
    if (quote) setPayAmount(quote.total.toFixed(2));
  }, [quote?.total, couponCode, manualKind, manualValue, redeem, customerId, cart.length]);

  useEffect(() => {
    if (!online || !activeBranch || !remoteQuery.trim()) {
      setRemoteItems(null);
      return;
    }
    const ctrl = new AbortController();
    api<PosCatalogItem[] | { results: PosCatalogItem[] }>(
      `/api/pos/catalog/?search=${encodeURIComponent(remoteQuery.trim())}&page_size=40`,
      { signal: ctrl.signal },
    )
      .then((data) => setRemoteItems(asList(data)))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setRemoteItems(null);
      });
    return () => ctrl.abort();
  }, [remoteQuery, online, activeBranch]);

  const categories = useMemo(() => {
    const source = (snapshot?.catalog || []).filter(
      (row) => kindFilter === "all" || (row.item_kind || "product") === kindFilter,
    );
    const names = new Set(source.map((row) => row.category).filter(Boolean));
    return Array.from(names).sort();
  }, [snapshot, kindFilter]);

  const items = useMemo(() => {
    const rows = remoteItems || snapshot?.catalog || [];
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (kindFilter !== "all" && (row.item_kind || "product") !== kindFilter) return false;
      if (category && row.category !== category) return false;
      if (!q || remoteItems) return true;
      return (
        row.product.toLowerCase().includes(q) ||
        row.sku.toLowerCase().includes(q) ||
        row.barcode.toLowerCase().includes(q) ||
        row.variant.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q)
      );
    });
  }, [snapshot, query, remoteItems, category, kindFilter]);

  const selected =
    items.find((row) => row.id === selectedId) ||
    cart.find((row) => row.item.id === selectedId)?.item ||
    snapshot?.catalog.find((row) => row.id === selectedId) ||
    null;
  const selectedLine = selected ? cart.find((row) => row.item.id === selected.id) : null;

  useEffect(() => {
    setDraftQty(cart.find((row) => row.item.id === selectedId)?.qty || 1);
  }, [selectedId]);

  const todaySales = overview?.today_sales || cashierStats?.today_sales || "0";
  const todayOrders = overview?.orders ?? cashierStats?.orders ?? 0;
  const avgTicket = todayOrders ? num(todaySales) / todayOrders : 0;
  const cartQty = cart.reduce((sum, row) => sum + row.qty, 0);
  const catalogTotal = snapshot?.catalog_total || snapshot?.catalog.length || 0;
  const lowStock = (snapshot?.catalog || []).filter((row) => row.track_stock && num(row.qty) > 0 && num(row.qty) <= 5).length;
  const outStock = (snapshot?.catalog || []).filter((row) => row.track_stock && num(row.qty) <= 0).length;
  const shift = snapshot?.open_shift;
  const paid = num(payAmount);
  const change = quote ? paid - quote.total : 0;
  const officeHref = user ? homeFor(user) : "/dashboard";

  function addItem(item: PosCatalogItem) {
    setSelectedId(item.id);
    const max = maxSellable(item);
    const current = cart.find((row) => row.item.id === item.id)?.qty || 0;
    if (max === 0) {
      setError(`${item.product} is out of stock`);
      return;
    }
    if (max !== null && current >= max) {
      setError(`Only ${fmtQty(max)} in stock for ${item.product}`);
      setDraftQty(Math.max(1, current));
      return;
    }
    const qty = clampQty(item, current + 1);
    setDraftQty(Math.max(1, qty));
    setCart((prev) => {
      const found = prev.find((row) => row.item.id === item.id);
      if (found) return prev.map((row) => (row.item.id === item.id ? { ...row, qty } : row));
      return [...prev, { item, qty }];
    });
    setMessage("");
    setError("");
  }

  function setItemQty(item: PosCatalogItem, qty: number) {
    setSelectedId(item.id);
    const max = maxSellable(item);
    if (max === 0 && qty > 0) {
      setError(`${item.product} is out of stock`);
      return;
    }
    const next = clampQty(item, qty);
    setDraftQty(Math.max(1, next));
    setCart((prev) => {
      if (next <= 0) return prev.filter((row) => row.item.id !== item.id);
      const found = prev.find((row) => row.item.id === item.id);
      if (found) return prev.map((row) => (row.item.id === item.id ? { ...row, qty: next } : row));
      return [...prev, { item, qty: next }];
    });
    setMessage("");
    setError("");
  }

  async function applyCode(code: string) {
    const raw = code.trim();
    if (!raw) return;
    const local = matchItem(raw, snapshot?.catalog) || matchItem(raw, remoteItems);
    if (local) {
      addItem(local);
      setQuery("");
      setMessage(`${local.product} added`);
      searchRef.current?.focus();
      return;
    }
    const coupon = snapshot?.coupons.find((row) => row.code.toLowerCase() === raw.toLowerCase());
    if (coupon) {
      setCouponCode(coupon.code);
      setMessage(`Coupon ${coupon.code} applied`);
      setQuery("");
      searchRef.current?.focus();
      return;
    }
    try {
      const found = asList(
        await api<PosCatalogItem[] | { results: PosCatalogItem[] }>(
          `/api/pos/catalog/?search=${encodeURIComponent(raw)}&page_size=5`,
        ),
      );
      const item = matchItem(raw, found);
      if (item) {
        addItem(item);
        setQuery("");
        setMessage(`${item.product} added`);
        searchRef.current?.focus();
        return;
      }
      const variant = await api<ProductVariant>(`/api/variants/lookup/?barcode=${encodeURIComponent(raw)}`);
      const bySku = asList(
        await api<PosCatalogItem[] | { results: PosCatalogItem[] }>(
          `/api/pos/catalog/?search=${encodeURIComponent(variant.sku)}&page_size=5`,
        ),
      );
      const fromLookup = bySku.find((row) => row.id === variant.id) || matchItem(variant.sku, bySku);
      if (fromLookup) {
        addItem(fromLookup);
        setQuery("");
        setMessage(`${fromLookup.product} added`);
        searchRef.current?.focus();
        return;
      }
    } catch {
      /* fall through */
    }
    setError(`No product for ${raw}`);
    searchRef.current?.focus();
  }

  function setQty(id: string, qty: number) {
    const line = cart.find((row) => row.item.id === id);
    if (!line) return;
    const next = clampQty(line.item, qty);
    if (id === selectedId) setDraftQty(Math.max(1, next));
    if (next <= 0) {
      setCart((prev) => prev.filter((row) => row.item.id !== id));
      return;
    }
    setCart((prev) => prev.map((row) => (row.item.id === id ? { ...row, qty: next } : row)));
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((row) => row.item.id !== id));
  }

  async function openConnect() {
    setError("");
    const session = await api<{ token: string }>("/api/scanner/sessions/", { method: "POST" });
    setScanToken(session.token);
    setPhoneLinked(false);
    setConnectOpen(true);
  }

  useEffect(() => {
    if (!user || helpOnce.current) return;
    const q = new URLSearchParams(window.location.search).get("help") || "";
    if (!q) return;
    helpOnce.current = true;
    setDeskHelp(q);
    window.setTimeout(() => searchRef.current?.focus(), 50);
    if (q === "camera") setCameraOpen(true);
    if (q === "phone") {
      openConnect().catch(() => setError("Could not start scanner link."));
    }
  }, [user]);

  useEffect(() => {
    if (!snapshot || skuOnce.current) return;
    const sku = new URLSearchParams(window.location.search).get("sku");
    if (!sku?.trim()) return;
    skuOnce.current = true;
    applyCode(sku.trim());
  }, [snapshot]);

  useEffect(() => {
    if (!connectOpen || !scanToken) return;
    const tick = window.setInterval(async () => {
      try {
        const data = await api<{ connected: boolean; codes: string[] }>(`/api/scanner/sessions/${scanToken}/pull/`);
        if (data.connected) setPhoneLinked(true);
        data.codes.forEach(applyCode);
      } catch {
        /* keep polling */
      }
    }, 900);
    return () => window.clearInterval(tick);
  }, [connectOpen, scanToken, snapshot]);

  async function checkout() {
    if (!snapshot || !quote || !activeBranch || cart.length === 0) return;
    setPending(true);
    setError("");
    setMessage("");
    const paidNow = Number(payAmount || 0);
    const payload: PosSalePayload = {
      client_uuid: crypto.randomUUID(),
      branch: activeBranch,
      customer: customerId || null,
      coupon_code: couponCode || "",
      manual_discount_kind: manualKind,
      manual_discount_value: manualValue || "0",
      redeem_points: redeem || "0",
      sold_at: new Date().toISOString(),
      lines: cart.map((row) => ({ variant: row.item.id, quantity: String(row.qty) })),
      payments: paidNow > 0 ? [{ method: payMethod, amount: paidNow.toFixed(2) }] : [],
    };
    await queueSale(payload);
    try {
      const sale = await api<{ number: string }>("/api/pos/checkout/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await markSynced(payload.client_uuid);
      const nextCatalog = snapshot.catalog.map((item) => {
        const line = cart.find((row) => row.item.id === item.id);
        if (!line) return item;
        return { ...item, qty: String(Math.max(0, Number(item.qty) - line.qty)) };
      });
      const nextSnap = { ...snapshot, catalog: nextCatalog };
      setSnapshot(nextSnap);
      await saveSnapshot(activeBranch, nextSnap);
      setMessage(`Sale ${sale.number} saved.`);
      setOnline(true);
      setCart([]);
      setTicketOpen(false);
      setCouponCode("");
      setManualKind("");
      setManualValue("");
      setRedeem("");
      refreshDash();
    } catch (err) {
      if (err instanceof NetworkError) {
        const nextCatalog = snapshot.catalog.map((item) => {
          const line = cart.find((row) => row.item.id === item.id);
          if (!line) return item;
          return { ...item, qty: String(Math.max(0, Number(item.qty) - line.qty)) };
        });
        const nextSnap = { ...snapshot, catalog: nextCatalog };
        setSnapshot(nextSnap);
        await saveSnapshot(activeBranch, nextSnap);
        setOnline(false);
        setMessage("Sale saved on this counter. It will sync when the line is back.");
        setCart([]);
        setTicketOpen(false);
        setCouponCode("");
        setManualKind("");
        setManualValue("");
        setRedeem("");
      } else {
        await removePending(payload.client_uuid);
        const body = err instanceof ApiError ? (err.body as { detail?: string; branch?: string[] }) : null;
        const detail =
          body && typeof body === "object" ? body.detail || Object.values(body).flat().join(" ") : null;
        setError(detail || (err instanceof Error ? err.message : "Could not complete sale."));
      }
    } finally {
      setPending(false);
      refreshQueue();
    }
  }

  if (loading || !user) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <p className="text-sm text-ink-700/70">Loading register…</p>
      </div>
    );
  }

  if (!can("pos.access") && !can("sale.create")) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <p className="text-sm text-ink-700/70">You do not have POS access.</p>
      </div>
    );
  }

  const recentSales = overview?.recent_sales || cashierStats?.recent_sales || [];
  const priced = quote?.priced || [];

  const register = (
    <div className={`relative grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] ${mode === "owner" ? "h-full" : ""}`}>
      <section className="flex min-h-0 flex-col overflow-hidden">
        {mode === "standalone" ? <HardwareSetup hardware={hardware} compact /> : null}

        {deskHelp && HELP_COPY[deskHelp] ? (
          <div className="mb-3 rounded-2xl border border-copper-300 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-copper-600">Manual sale</p>
            <p className="mt-1 text-sm text-ink-800">{HELP_COPY[deskHelp]}</p>
          </div>
        ) : null}

        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:grid-cols-6 [&>:nth-child(n+5)]:max-lg:hidden">
          <Kpi
            icon={ShoppingCart}
            label="This ticket"
            value={String(cartQty)}
            hint={quote ? rs(quote.total) : "Empty"}
          />
          <Kpi
            icon={Banknote}
            label="Sales today"
            value={rs(todaySales)}
            hint={`${todayOrders} order${todayOrders === 1 ? "" : "s"}`}
          />
          <Kpi
            icon={Banknote}
            label="Cash drawer"
            value={shift ? "Open" : "Closed"}
            hint={shift ? `${shift.number} · ${rs(shift.expected_cash)}` : "Open before cash"}
            warn={!shift}
          />
          <Kpi icon={Receipt} label="Orders" value={String(todayOrders)} hint={`Avg ${rs(avgTicket)}`} />
          <Kpi
            icon={Package}
            label="Catalog"
            value={catalogTotal.toLocaleString()}
            hint={category ? category : "All items"}
          />
          <Kpi
            icon={AlertTriangle}
            label="Stock alerts"
            value={String(lowStock + outStock)}
            hint={`${lowStock} low · ${outStock} out`}
            warn={lowStock + outStock > 0}
          />
        </div>

        <div className="mb-3 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-700/40" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                hardware.noteScanKey();
                if (e.key !== "Enter") return;
                e.preventDefault();
                applyCode(query);
              }}
              placeholder="Scan or type SKU, name, coupon"
              className="field h-12 !pl-12 text-base"
              autoFocus
            />
          </div>
          <Button type="button" className="h-12 shrink-0 px-3 sm:px-4" variant="ghost" onClick={() => setCameraOpen(true)}>
            <QrCode size={16} />
            <span className="hidden sm:inline">Camera</span>
          </Button>
          <Button
            type="button"
            className="h-12 shrink-0 px-3 sm:px-4"
            variant="copper"
            onClick={() => openConnect().catch(() => setError("Could not start scanner link."))}
          >
            <Smartphone size={16} />
            <span className="hidden sm:inline">Phone scan</span>
          </Button>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="self-center text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-700/45">Can&apos;t scan?</span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-paper-200 bg-white px-3 py-1.5 text-xs text-ink-700 hover:border-copper-400"
            onClick={() => {
              setDeskHelp("type");
              searchRef.current?.focus();
            }}
          >
            <Keyboard size={12} />
            Type SKU
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-paper-200 bg-white px-3 py-1.5 text-xs text-ink-700 hover:border-copper-400"
            onClick={() => {
              setDeskHelp("camera");
              setCameraOpen(true);
            }}
          >
            <QrCode size={12} />
            Camera
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-paper-200 bg-white px-3 py-1.5 text-xs text-ink-700 hover:border-copper-400"
            onClick={() => {
              setDeskHelp("phone");
              openConnect().catch(() => setError("Could not start scanner link."));
            }}
          >
            <Smartphone size={12} />
            Phone
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-paper-200 bg-white px-3 py-1.5 text-xs text-ink-700 hover:border-copper-400"
            onClick={() => setDeskHelp("pay")}
          >
            <CreditCard size={12} />
            Card / bank
          </button>
          {isCashier(user) ? (
            <Link href="/cashier" className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs text-copper-700">
              More fallbacks
            </Link>
          ) : null}
        </div>

        <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
          {([
            { id: "all" as const, label: "All" },
            { id: "product" as const, label: "Products" },
            { id: "service" as const, label: "Services" },
          ]).map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => {
                setKindFilter(row.id);
                setCategory("");
              }}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                kindFilter === row.id ? "bg-copper-500 text-ink-950" : "bg-white text-ink-700"
              }`}
            >
              {row.id === "service" ? <Wrench size={12} /> : row.id === "product" ? <Package size={12} /> : null}
              {row.label}
            </button>
          ))}
        </div>

        <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              category === "" ? "bg-ink-950 text-paper-50" : "bg-white text-ink-700"
            }`}
          >
            All · {catalogTotal}
          </button>
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name === category ? "" : name)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                category === name ? "bg-ink-950 text-paper-50" : "bg-white text-ink-700"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {snapshot?.catalog_truncated && !query.trim() ? (
          <p className="mb-3 text-xs text-ink-700/60">
            Showing first {snapshot.catalog.length} of {snapshot.catalog_total?.toLocaleString()} items. Search to find the rest.
            Use Add 1, then + / − to change quantity.
          </p>
        ) : (
          <p className="mb-3 text-xs text-ink-700/55">
            {items.length} item{items.length === 1 ? "" : "s"}
            {query.trim() ? ` matching “${query.trim()}”` : ""}
            {category ? ` in ${category}` : ""}. Add 1, or use + / − to update quantity.
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto pb-20 pr-1 lg:pb-1">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.slice(0, 80).map((item) => {
              const active = selectedId === item.id;
              const inCart = cart.find((row) => row.item.id === item.id);
              const stock = stockTone(item);
              const max = maxSellable(item);
              const out = max === 0;
              return (
                <article
                  key={item.id}
                  className={`card flex flex-col overflow-hidden p-0 transition hover:border-copper-400 ${
                    inCart ? "border-copper-400 bg-copper-500/[0.04]" : ""
                  } ${active ? "border-copper-500 ring-2 ring-copper-500/30" : ""} ${
                    out ? "opacity-80" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className="flex flex-1 flex-col p-3 text-left sm:p-4"
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-lg ${
                          inCart ? "bg-copper-500 text-ink-950" : "bg-paper-100 text-ink-800"
                        }`}
                      >
                        {inCart ? inCart.qty : (item.product || "?").slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-copper-600">
                            {isService(item) ? "Service" : item.category || "Uncategorized"}
                            {isService(item) && item.category ? ` · ${item.category}` : ""}
                          </p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${stock.className}`}>
                            {stock.label}
                          </span>
                        </div>
                        <p className="mt-0.5 break-words font-medium leading-snug text-ink-950">{item.product}</p>
                        <p className="mt-0.5 text-xs text-ink-700/55">
                          {item.variant && item.variant !== item.product ? `${item.variant} · ` : ""}
                          {item.sku || "No SKU"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto flex items-end justify-between gap-2">
                      <div>
                        <p className="font-display text-xl leading-none">{rs(item.selling_price)}</p>
                        {can("report.sales") ? <p className="mt-0.5 text-[11px] text-ink-700/45">Cost {rs(item.cost_price)}</p> : null}
                      </div>
                      <p className="text-right text-xs text-ink-700/55">
                        {isService(item) ? serviceMeta(item) : `${fmtQty(item.qty)} on hand`}
                      </p>
                    </div>
                  </button>
                  <div className="border-t border-paper-100 bg-paper-50/90 px-3 py-2.5">
                    {out ? (
                      <p className="py-1.5 text-center text-xs font-medium text-red-700">Out of stock</p>
                    ) : inCart ? (
                      <div className="flex items-center justify-between gap-2">
                        <QtyControl
                          value={inCart.qty}
                          min={0}
                          max={max ?? undefined}
                          onChange={(qty) => setQty(item.id, qty)}
                        />
                        <button
                          type="button"
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-red-700 hover:bg-red-50"
                          onClick={() => removeLine(item.id)}
                          aria-label="Remove from ticket"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-ink-950 text-sm font-medium text-paper-50 hover:bg-ink-800"
                        onClick={() => addItem(item)}
                      >
                        <Plus size={15} />
                        Add 1
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {snapshot && items.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-700/60">No products or services match this search.</p>
          ) : null}
        </div>
      </section>

      <aside
        className={`flex min-h-0 min-w-0 flex-col overflow-hidden bg-white shadow-card max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:max-h-[90dvh] max-lg:rounded-t-2xl max-lg:border max-lg:border-paper-200 max-lg:transition-transform max-lg:duration-200 lg:relative lg:rounded-2xl lg:border lg:border-paper-200 ${
          ticketOpen ? "max-lg:translate-y-0" : "max-lg:translate-y-full"
        }`}
      >
        <div className="border-b border-paper-200 bg-ink-950 px-4 py-3 text-paper-50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-copper-400">Current ticket</p>
              <p className="font-display text-xl">{branch?.name || "Branch"}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-right text-xs text-paper-50/70">
                <p>{cartQty} item{cartQty === 1 ? "" : "s"}</p>
                <p>{cart.length} line{cart.length === 1 ? "" : "s"}</p>
              </div>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-sm lg:hidden"
                onClick={() => setTicketOpen(false)}
                aria-label="Close ticket"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto p-4">
          <Field label="Customer">
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Walk-in customer</option>
              {(snapshot?.customers || []).map((c: PosCustomer) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.loyalty_points} pts
                  {c.membership_name ? ` · ${c.membership_name}` : ""}
                </option>
              ))}
            </Select>
          </Field>

          {customer ? (
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-paper-50 p-3 text-xs">
              <DetailRow label="Phone" value={customer.phone || "—"} />
              <DetailRow label="Points" value={String(customer.loyalty_points)} />
              <DetailRow label="Member" value={customer.membership_name || "None"} />
              <DetailRow label="Credit" value={rs(customer.receivable_balance)} />
            </div>
          ) : null}

          {selected ? (
            <div className="rounded-xl border border-paper-200 bg-paper-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-copper-600">Selected item</p>
              <p className="mt-1 font-medium text-ink-950">{selected.product}</p>
              <dl className="mt-2 space-y-1 text-xs text-ink-700/75">
                {selected.variant && selected.variant !== selected.product ? (
                  <DetailRow label="Variant" value={selected.variant} />
                ) : null}
                <DetailRow label="SKU" value={selected.sku || "—"} />
                <DetailRow label="Barcode" value={selected.barcode || "—"} />
                <DetailRow label="Category" value={selected.category || "—"} />
                <DetailRow label="Type" value={isService(selected) ? "Service" : "Product"} />
                <DetailRow label="Sell" value={rs(selected.selling_price)} />
                {can("report.sales") ? <DetailRow label="Cost" value={rs(selected.cost_price)} /> : null}
                {isService(selected) ? (
                  <>
                    <DetailRow label="Duration" value={selected.duration_minutes ? `${selected.duration_minutes} min` : "—"} />
                    <DetailRow label="Warranty" value={selected.warranty_days ? `${selected.warranty_days} days` : "—"} />
                  </>
                ) : (
                  <DetailRow label="Stock" value={`${fmtQty(selected.qty)} on hand`} />
                )}
              </dl>
              <div className="mt-3 border-t border-paper-200 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700/55">Quantity</p>
                <div className="mt-2 flex items-center gap-2">
                  <QtyControl
                    value={draftQty}
                    min={1}
                    max={maxSellable(selected) ?? undefined}
                    onChange={(qty) => setDraftQty(Math.max(1, qty))}
                  />
                  <button
                    type="button"
                    className="btn-copper h-10 flex-1 px-3 text-sm"
                    disabled={maxSellable(selected) === 0}
                    onClick={() => setItemQty(selected, draftQty)}
                  >
                    {selectedLine ? `Update · ${draftQty}` : `Add ${draftQty}`}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {QTY_PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={maxSellable(selected) !== null && n > (maxSellable(selected) || 0)}
                      className={`rounded-lg border px-2.5 py-1 text-xs disabled:opacity-40 ${
                        draftQty === n ? "border-ink-950 bg-ink-950 text-paper-50" : "border-paper-200 bg-white text-ink-700"
                      }`}
                      onClick={() => setItemQty(selected, n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-700/55">
                  {selectedLine
                    ? `${selectedLine.qty} on this ticket. Change the number and tap Update.`
                    : "Add 1, or pick a quantity then tap Add."}
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-paper-50 px-3 py-3 text-sm text-ink-700/60">
              Tap a product to see details. Use Add 1, or + / − to change quantity.
            </p>
          )}

          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700/55">Lines</p>
              {cart.length ? (
                <button type="button" className="text-xs text-red-700" onClick={() => setCart([])}>
                  Clear ticket
                </button>
              ) : null}
            </div>
            <ul className="mt-2 space-y-2">
              {cart.length === 0 ? (
                <li className="rounded-xl border border-dashed border-paper-200 px-3 py-6 text-center text-sm text-ink-700/60">
                  No items yet. Tap Add 1, then use + / − if the customer wants more.
                </li>
              ) : null}
              {priced.map((row) => (
                <li key={row.item.id} className="rounded-xl border border-paper-200 bg-paper-50/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <button type="button" className="min-w-0 text-left" onClick={() => setSelectedId(row.item.id)}>
                      <p className="truncate font-medium">
                        {row.item.product}
                        {isService(row.item) ? (
                          <span className="ml-1 text-[10px] font-normal uppercase tracking-wide text-sky-800">Service</span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-ink-700/50">
                        {row.item.sku}
                        {row.item.variant && row.item.variant !== row.item.product ? ` · ${row.item.variant}` : ""}
                      </p>
                      {row.promoName ? <p className="mt-0.5 text-[11px] text-copper-700">{row.promoName}</p> : null}
                      {row.free ? <p className="text-[11px] text-emerald-700">{row.free} free</p> : null}
                    </button>
                    <p className="shrink-0 tabular-nums font-medium">{rs(row.lineTotal)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-ink-700/55">
                      {rs(row.unit)}
                      {row.unit < row.list ? <span className="ml-1 line-through">{rs(row.list)}</span> : null}
                      {" "}each
                    </p>
                    <div className="flex items-center gap-1">
                      <QtyControl
                        size="sm"
                        value={row.qty}
                        min={0}
                        max={maxSellable(row.item) ?? undefined}
                        onChange={(qty) => setQty(row.item.id, qty)}
                      />
                      <button
                        type="button"
                        className="grid h-8 w-8 place-items-center rounded-lg text-red-700 hover:bg-red-50"
                        onClick={() => removeLine(row.item.id)}
                        aria-label="Remove line"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-2">
            <Field label="Coupon">
              <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="SAVE10" />
            </Field>
            {can("sale.discount") ? (
              <Field label="Manual discount">
                <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2">
                  <Select value={manualKind} onChange={(e) => setManualKind(e.target.value)}>
                    <option value="">None</option>
                    <option value="percent">%</option>
                    <option value="fixed">Rs</option>
                  </Select>
                  <Input value={manualValue} onChange={(e) => setManualValue(e.target.value)} disabled={!manualKind} />
                </div>
              </Field>
            ) : (
              <Field label="Redeem points">
                <Input value={redeem} onChange={(e) => setRedeem(e.target.value)} disabled={!customer} />
              </Field>
            )}
          </div>
          {can("sale.discount") ? (
            <Field label="Redeem points">
              <Input value={redeem} onChange={(e) => setRedeem(e.target.value)} disabled={!customer} />
            </Field>
          ) : null}

          {recentSales.length ? (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700/55">Latest sales</p>
                {overview ? (
                  <Link href="/reports" className="text-xs text-copper-700 underline">
                    Reports
                  </Link>
                ) : null}
              </div>
              <ul className="mt-2 space-y-2 text-sm">
                {recentSales.slice(0, 4).map((row) => (
                  <li key={row.id} className="flex justify-between gap-2 border-b border-paper-100 pb-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{row.number}</span>
                      <span className="block truncate text-xs text-ink-700/55">{row.customer_name}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-medium">{rs(row.total)}</span>
                      {"cashier_name" in row && row.cashier_name ? (
                        <span className="block text-[11px] text-ink-700/45">{row.cashier_name}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {overview?.alerts.length ? (
            <div className="space-y-2">
              {overview.alerts.slice(0, 2).map((alert) => (
                <Link key={alert.title} href={alert.href} className="block rounded-xl bg-paper-50 px-3 py-2">
                  <Badge tone={alert.tone === "good" ? "good" : alert.tone === "warn" ? "warn" : "copper"}>
                    {alert.tone === "warn" ? "Action" : "Watch"}
                  </Badge>
                  <p className="mt-1 text-sm font-medium">{alert.title}</p>
                  <p className="text-xs text-ink-700/60">{alert.detail}</p>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="safe-bottom shrink-0 border-t border-paper-200 bg-white p-4">
          {quote ? (
            <dl className="space-y-1.5 text-sm">
              <div className="flex items-baseline justify-between gap-3 text-ink-700/70">
                <dt className="shrink-0">Subtotal</dt>
                <dd className="tabular-nums">{rs(quote.subtotal)}</dd>
              </div>
              {quote.couponDisc > 0 ? (
                <div className="flex items-baseline justify-between gap-3 text-copper-700">
                  <dt className="shrink-0">Coupon{quote.coupon ? ` · ${quote.coupon.code}` : ""}</dt>
                  <dd className="tabular-nums">- {rs(quote.couponDisc)}</dd>
                </div>
              ) : null}
              {quote.memberDisc > 0 ? (
                <div className="flex items-baseline justify-between gap-3 text-copper-700">
                  <dt className="shrink-0">Membership</dt>
                  <dd className="tabular-nums">- {rs(quote.memberDisc)}</dd>
                </div>
              ) : null}
              {quote.manualDisc > 0 ? (
                <div className="flex items-baseline justify-between gap-3 text-copper-700">
                  <dt className="shrink-0">Manual discount</dt>
                  <dd className="tabular-nums">- {rs(quote.manualDisc)}</dd>
                </div>
              ) : null}
              {quote.pointsDisc > 0 ? (
                <div className="flex items-baseline justify-between gap-3 text-copper-700">
                  <dt className="shrink-0">Points ({Math.round(quote.usedPoints)})</dt>
                  <dd className="tabular-nums">- {rs(quote.pointsDisc)}</dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between gap-3 border-t border-paper-200 pt-2">
                <dt className="shrink-0 text-sm text-ink-700/70">Total due</dt>
                <dd className="text-right font-display text-xl leading-none tabular-nums">{rs(quote.total)}</dd>
              </div>
              {customer ? <p className="text-xs text-ink-700/55">This sale earns {quote.earn} points.</p> : null}
            </dl>
          ) : null}

          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["cash", "card", "bank"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPayMethod(method)}
                className={`rounded-xl border px-2 py-2 text-xs font-medium ${
                  payMethod === method ? "border-ink-950 bg-ink-950 text-paper-50" : "border-paper-200 bg-white text-ink-700"
                }`}
              >
                {PAY_LABEL[method]}
              </button>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <Field label="Amount tendered">
              <Input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </Field>
            <div className="rounded-xl bg-paper-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-ink-700/55">{change >= 0 ? "Change" : "Balance due"}</p>
              <p className={`font-display text-lg ${change >= 0 ? "text-emerald-800" : "text-red-700"}`}>
                {rs(Math.abs(change))}
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              className="rounded-lg border border-paper-200 bg-white px-2.5 py-1 text-xs"
              onClick={() => quote && setPayAmount(quote.total.toFixed(2))}
            >
              Exact
            </button>
            {TENDER.map((amount) => (
              <button
                key={amount}
                type="button"
                className="rounded-lg border border-paper-200 bg-white px-2.5 py-1 text-xs"
                onClick={() => setPayAmount(String(amount))}
              >
                {rs(amount)}
              </button>
            ))}
          </div>

          {payMethod === "cash" && !shift ? (
            <p className="mt-2 text-xs text-amber-800">Open a cash shift before taking cash — or pay by card/bank.</p>
          ) : null}
          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
          {message ? <p className="mt-2 text-sm text-emerald-800">{message}</p> : null}
          <Button className="mt-3 h-12 w-full text-base" disabled={pending || cart.length === 0} onClick={checkout}>
            {pending ? "Saving…" : `Complete sale · ${quote ? rs(quote.total) : rs(0)}`}
          </Button>
        </div>
      </aside>

      {ticketOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink-950/40 lg:hidden"
          aria-label="Close ticket"
          onClick={() => setTicketOpen(false)}
        />
      ) : (
        <button
          type="button"
          className="fixed z-30 inline-flex min-h-12 items-center gap-2 rounded-full bg-ink-950 px-4 py-3 text-sm font-medium text-paper-50 shadow-lg lg:hidden"
          style={{ bottom: "max(1rem, env(safe-area-inset-bottom))", right: "1rem" }}
          onClick={() => setTicketOpen(true)}
        >
          <ShoppingCart size={16} />
          {cartQty} · {quote ? rs(quote.total) : rs(0)}
        </button>
      )}

      <Modal open={cameraOpen} title="Scan product" onClose={() => setCameraOpen(false)}>
        <CameraScan
          onCode={(code) => {
            applyCode(code);
            setCameraOpen(false);
          }}
          onClose={() => setCameraOpen(false)}
        />
      </Modal>
      <Modal open={connectOpen} title="Connect phone scanner" onClose={() => setConnectOpen(false)}>
        <div className="space-y-3 text-center">
          {scanToken ? <QrImage value={`${typeof window !== "undefined" ? window.location.origin : ""}/scan/${scanToken}`} /> : null}
          <p className="text-sm text-ink-700/70">
            Scan this QR with your phone. The camera will open and barcodes will go to the ticket.
          </p>
          <p className={`text-sm ${phoneLinked ? "text-emerald-700" : "text-ink-700/60"}`}>
            {phoneLinked ? "Phone connected — start scanning." : "Waiting for phone…"}
          </p>
        </div>
      </Modal>
    </div>
  );

  if (mode === "owner") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <HardwareToasts hardware={hardware} />
        {register}
      </div>
    );
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-paper-50">
      <HardwareToasts hardware={hardware} />
      <header className="safe-top shrink-0 border-b border-paper-200 bg-ink-950 px-3 py-2.5 text-paper-50 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper-400">Register</p>
            <p className="truncate font-display text-xl leading-tight sm:text-2xl">{user?.business_name || "POS"}</p>
            <p className="mt-0.5 hidden flex-wrap items-center gap-x-3 gap-y-1 text-xs text-paper-50/65 sm:flex">
              <span className="inline-flex items-center gap-1">
                <UserRound size={12} />
                {user?.full_name || user?.first_name || "Cashier"}
                {user?.role_name ? ` · ${user.role_name}` : user?.is_owner ? " · Owner" : ""}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 size={12} />
                {now.toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" })}{" "}
                {now.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <select
              className="max-w-[8.5rem] min-w-0 rounded-xl border border-white/15 bg-ink-900 px-2 py-2 text-sm sm:max-w-xs sm:px-3"
              value={activeBranch}
              onChange={(e) => setBranch(e.target.value)}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                shift ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-100"
              }`}
            >
              {shift ? `Shift ${shift.number}` : "No shift"}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                online ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-100"
              }`}
            >
              {online ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span className="hidden sm:inline">{online ? "Live" : "Offline · saved locally"}</span>
              <span className="sm:hidden">{online ? "Live" : "Off"}</span>
            </span>
            <div className="hidden md:block">
              <HardwareStatus hardware={hardware} />
            </div>
            {queued > 0 ? <span className="text-xs text-copper-300">{queued} sync</span> : null}
            <Link href={officeHref} className="btn-ghost min-h-11 border-white/15 bg-transparent px-3 text-paper-50">
              <LayoutDashboard size={16} />
              <span className="hidden sm:inline">Back office</span>
            </Link>
            <button type="button" onClick={logout} className="min-h-11 px-1 text-sm text-paper-50/60 hover:text-white">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col p-2 sm:p-4">{register}</div>
    </div>
  );
}

function isService(item: PosCatalogItem) {
  return (item.item_kind || "product") === "service";
}

function maxSellable(item: PosCatalogItem) {
  if (isService(item) || !item.track_stock) return null;
  return Math.max(0, num(item.qty));
}

function clampQty(item: PosCatalogItem, qty: number) {
  if (!Number.isFinite(qty)) return 0;
  const max = maxSellable(item);
  const next = Math.max(0, qty);
  return max === null ? next : Math.min(next, max);
}

function QtyControl({
  value,
  onChange,
  min = 0,
  max,
  size = "md",
}: {
  value: number;
  onChange: (qty: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}) {
  const btn = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <div
      className={`inline-flex items-center overflow-hidden rounded-xl border border-paper-200 bg-white ${
        size === "sm" ? "w-[7.25rem] shrink-0" : "min-w-0 flex-1"
      }`}
    >
      <button
        type="button"
        className={`grid ${btn} shrink-0 place-items-center text-ink-800 hover:bg-paper-100 disabled:opacity-35`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isFinite(n)) return;
          onChange(n);
        }}
        className="min-w-0 flex-1 border-x border-paper-200 bg-transparent py-1 text-center text-sm tabular-nums outline-none"
      />
      <button
        type="button"
        className={`grid ${btn} shrink-0 place-items-center text-ink-800 hover:bg-paper-100 disabled:opacity-35`}
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function serviceMeta(item: PosCatalogItem) {
  const bits: string[] = [];
  if (item.duration_minutes) bits.push(`${item.duration_minutes} min`);
  if (item.warranty_days) bits.push(`${item.warranty_days}d warranty`);
  return bits.join(" · ") || "No stock";
}

function fmtQty(value: string | number) {
  const n = num(value);
  return n.toLocaleString("en-PK", { maximumFractionDigits: n % 1 === 0 ? 0 : 3 });
}

function stockTone(item: PosCatalogItem) {
  if (isService(item)) return { kind: "ok" as const, label: "Service", className: "bg-sky-50 text-sky-800" };
  if (!item.track_stock) return { kind: "ok" as const, label: "No track", className: "bg-paper-100 text-ink-700" };
  const qty = num(item.qty);
  if (qty <= 0) return { kind: "out" as const, label: "Out of stock", className: "bg-red-50 text-red-800" };
  if (qty <= 5) return { kind: "low" as const, label: "Low stock", className: "bg-amber-50 text-amber-800" };
  return { kind: "ok" as const, label: "In stock", className: "bg-emerald-50 text-emerald-800" };
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  warn,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  hint: string;
  warn?: boolean;
}) {
  return (
    <div className={`card p-3 ${warn ? "border-amber-300" : ""}`}>
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${warn ? "bg-amber-100 text-amber-900" : "bg-ink-950 text-paper-50"}`}>
          <Icon size={15} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-700/55">{label}</p>
          <p className="truncate font-display text-lg leading-tight text-ink-950">{value}</p>
          <p className="truncate text-[11px] text-ink-700/55">{hint}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
      <dt className="shrink-0 text-ink-700/60">{label}</dt>
      <dd className="min-w-0 truncate text-right text-ink-950">{value}</dd>
    </div>
  );
}
