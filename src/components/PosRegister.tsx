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
  Printer,
  QrCode,
  RotateCcw,
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
import { INVOICE_DESIGNS, ReceiptSlip, type InvoiceDesign } from "@/components/ReceiptSlip";
import { SaleReturnPanel } from "@/components/SaleReturnPanel";
import { Badge, Button, Field, Input, Modal, Select } from "@/components/ui";
import { ApiError, NetworkError, api, asList } from "@/lib/api";
import { homeFor, isCashier, useAuth } from "@/lib/auth";
import { useHardware } from "@/lib/hardware";
import { money, num, rs } from "@/lib/money";
import { loadSnapshot, markSynced, pendingCount, queueSale, removePending, saveSnapshot, syncPending } from "@/lib/offline";
import { useDebounced } from "@/lib/query";
import { quoteCart, type CartLine } from "@/lib/quote";
import type {
  CashierOverview,
  OwnerOverview,
  PosCatalogItem,
  PosCustomer,
  PosSale,
  PosSalePayload,
  PosSaleReturn,
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
  const [kindFilter, setKindFilter] = useState<"all" | "product" | "service">("product");
  const [customerId, setCustomerId] = useState("");
  const [manualKind, setManualKind] = useState("");
  const [manualValue, setManualValue] = useState("");
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
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnQuery, setReturnQuery] = useState("");
  const [slip, setSlip] = useState<PosSale | null>(null);
  const [slipTendered, setSlipTendered] = useState<number | null>(null);
  const [printEverySale, setPrintEverySale] = useState(false);
  const [slipDesign, setSlipDesign] = useState<InvoiceDesign | null>(null);
  const [pendingPrintId, setPendingPrintId] = useState<string | null>(null);
  const helpOnce = useRef(false);
  const skuOnce = useRef(false);
  const hardware = useHardware();
  const searchRef = useRef<HTMLInputElement>(null);
  const shopKey = "shop";

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    setPrintEverySale(window.localStorage.getItem("upos_print_every_sale") === "1");
  }, []);

  useEffect(() => {
    if (!pendingPrintId || !slip) return;
    if ((slip.id || slip.number) !== pendingPrintId) return;
    const tick = window.setTimeout(() => {
      window.print();
      setPendingPrintId(null);
    }, 300);
    return () => window.clearTimeout(tick);
  }, [pendingPrintId, slip]);

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
    try {
      const data = await api<PosSnapshot>("/api/pos/snapshot/");
      setSnapshot(data);
      await saveSnapshot(shopKey, data);
      setOnline(true);
    } catch (err) {
      const cached = await loadSnapshot(shopKey);
      if (cached) setSnapshot(cached);
      if (err instanceof NetworkError) setOnline(false);
    }
    refreshQueue();
  }, [refreshQueue]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    refreshDash();
  }, [refreshDash]);

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
        customer,
        manualKind,
        manualValue: Number(manualValue || 0),
      })
    : null;

  useEffect(() => {
    if (quote) setPayAmount(money(quote.total).toFixed(2));
  }, [quote?.total, manualKind, manualValue, customerId, cart.length]);

  useEffect(() => {
    if (!online || !remoteQuery.trim()) {
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
  }, [remoteQuery, online]);

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
  const cartQty = cart.reduce((sum, row) => sum + row.qty, 0);
  const productCount = snapshot?.catalog_products ?? (snapshot?.catalog || []).filter((row) => !isService(row)).length;
  const serviceCount = snapshot?.catalog_services ?? (snapshot?.catalog || []).filter((row) => isService(row)).length;
  const catalogTotal =
    kindFilter === "service" ? serviceCount : kindFilter === "product" ? productCount : snapshot?.catalog_total || productCount + serviceCount;
  const lowStock = (snapshot?.catalog || []).filter((row) => row.track_stock && num(row.qty) > 0 && num(row.qty) <= 5).length;
  const outStock = (snapshot?.catalog || []).filter((row) => row.track_stock && num(row.qty) <= 0).length;
  const shift = snapshot?.open_shift;
  const paid = money(payAmount);
  const change = quote ? money(paid - quote.total) : 0;
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
    if (!snapshot || !quote || cart.length === 0) return;
    setPending(true);
    setError("");
    setMessage("");
    const tendered = money(payAmount);
    const dueTotal = money(quote.total);
    const applied = money(Math.min(Math.max(0, tendered), dueTotal));
    const payload: PosSalePayload = {
      client_uuid: crypto.randomUUID(),
      branch: snapshot.branch?.id,
      customer: customerId || null,
      manual_discount_kind: manualKind,
      manual_discount_value: manualValue || "0",
      sold_at: new Date().toISOString(),
      lines: cart.map((row) => ({ variant: row.item.id, quantity: String(row.qty) })),
      payments: applied > 0 ? [{ method: payMethod, amount: applied.toFixed(2) }] : [],
    };
    await queueSale(payload);
    try {
      const sale = await api<PosSale>("/api/pos/checkout/", {
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
      await saveSnapshot(shopKey, nextSnap);
      const preview =
        sale.lines && sale.lines.length
          ? sale
          : slipFromCart(sale.number, applied, money(dueTotal - applied));
      parkSlip(preview, tendered, true);
      setMessage(saleSavedNote(sale.number));
      setOnline(true);
      setCart([]);
      setTicketOpen(false);
      setManualKind("");
      setManualValue("");
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
        await saveSnapshot(shopKey, nextSnap);
        parkSlip(slipFromCart(`LOCAL-${Date.now().toString().slice(-6)}`, applied, money(dueTotal - applied)), tendered, true);
        setOnline(false);
        setMessage(
          printEverySale && hardware.printer.connected
            ? "Sale saved on this counter and the slip was sent to the printer. It will sync when the line is back."
            : "Sale saved on this counter. It will sync when the line is back.",
        );
        setCart([]);
        setTicketOpen(false);
        setManualKind("");
        setManualValue("");
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

  function allowPrintEverySale(on: boolean) {
    setPrintEverySale(on);
    window.localStorage.setItem("upos_print_every_sale", on ? "1" : "0");
  }

  function saleSavedNote(number: string) {
    if (!printEverySale) return `Sale ${number} saved.`;
    if (!hardware.printer.connected) return `Sale ${number} saved. Printer is off, so no slip was printed.`;
    return `Sale ${number} saved. Slip sent to the printer.`;
  }

  function parkSlip(sale: PosSale, tendered: number | null, fromCheckout: boolean) {
    setSlip(sale);
    setSlipTendered(tendered);
    if (fromCheckout && printEverySale && hardware.printer.connected) {
      setPendingPrintId(sale.id || sale.number);
    }
  }

  async function reviewSlip(id: string, number: string) {
    setError("");
    try {
      const sale = await api<PosSale>(`/api/pos/sales/${id}/`);
      parkSlip(sale, null, false);
    } catch {
      try {
        const sale = await api<PosSale>(`/api/pos/returns/lookup/?q=${encodeURIComponent(number)}`);
        parkSlip(sale, null, false);
      } catch {
        setError("Could not open this slip.");
      }
    }
  }

  function slipFromCart(number: string, paid: number, due: number): PosSale {
    const quoted = snapshot
      ? quoteCart(cart, snapshot, {
          customer,
          manualKind,
          manualValue: Number(manualValue || 0),
        })
      : null;
    return {
      id: crypto.randomUUID(),
      number,
      client_uuid: "",
      subtotal: String(quoted?.subtotal ?? 0),
      total: String(quoted?.total ?? 0),
      paid_amount: String(paid),
      due_amount: String(due),
      discount_total: String(quoted?.discountTotal ?? 0),
      net_total: String(quoted?.total ?? 0),
      loyalty_earned: "0",
      payment_method: payMethod,
      customer_name: customer?.name || "Walk-in",
      cashier_name: user?.full_name || "",
      sold_at: new Date().toISOString(),
      lines: cart.map((row, i) => {
        const priced = quoted?.priced[i];
        return {
          id: row.item.id,
          product_name: row.item.product,
          variant_name: row.item.variant,
          sku: row.item.sku,
          quantity: String(row.qty),
          unit_price: String(priced?.list ?? row.item.selling_price),
          promo_price: String(priced?.unit ?? row.item.selling_price),
          line_total: String(priced?.lineTotal ?? money(num(row.item.selling_price) * row.qty)),
        };
      }),
    };
  }

  function openReturn(ticket = "") {
    setReturnQuery(ticket);
    setReturnOpen(true);
    setTicketOpen(false);
    setError("");
  }

  async function onReturned(result: PosSaleReturn) {
    setMessage(`Return ${result.number} saved. Refund ${rs(result.refund_amount)}.`);
    if (snapshot) {
      const nextCatalog = snapshot.catalog.map((item) => {
        const add = result.lines
          .filter((line) => line.variant === item.id)
          .reduce((sum, line) => sum + num(line.quantity), 0);
        if (!add) return item;
        return { ...item, qty: String(num(item.qty) + add) };
      });
      const nextSnap = { ...snapshot, catalog: nextCatalog };
      setSnapshot(nextSnap);
      await saveSnapshot(shopKey, nextSnap);
    }
    refreshDash();
    load();
  }

  if (loading || !user) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <p className="text-sm text-surface-400">Loading register…</p>
      </div>
    );
  }

  if (!can("pos.access") && !can("sale.create")) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <p className="text-sm text-surface-400">You do not have POS access.</p>
      </div>
    );
  }

  const recentSales = overview?.recent_sales || cashierStats?.recent_sales || [];
  const priced = quote?.priced || [];

  // ── Mobile tab state ───────────────────────────────────────────────────────
  // "products" | "ticket" | "pay"  — only used on mobile
  const [mobileTab, setMobileTab] = useState<"products" | "ticket" | "pay">("products");

  const register = (
    <div className={`relative flex min-h-0 flex-1 flex-col ${mode === "owner" ? "h-full" : ""}`}>
      {/* ── Mobile tab bar ────────────────────────────────────────────────── */}
      <div className="flex shrink-0 gap-0 border-b border-surface-200 bg-white lg:hidden">
        {([
          { id: "products" as const, label: "Products", badge: null },
          { id: "ticket"   as const, label: "Ticket",   badge: cartQty > 0 ? cartQty : null },
          { id: "pay"      as const, label: "Pay",       badge: null },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
              mobileTab === tab.id
                ? "border-b-2 border-brand-600 text-brand-600"
                : "text-surface-400 hover:text-surface-700"
            }`}
          >
            {tab.label}
            {tab.badge ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Desktop 2-column / mobile single-tab ─────────────────────────── */}
      <div className="flex min-h-0 flex-1 gap-3 overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)]">

        {/* ════════════════════════════════════════════════════════════════
            LEFT — Product catalog
        ════════════════════════════════════════════════════════════════ */}
        <section
          className={`flex min-h-0 flex-col overflow-hidden ${
            mobileTab !== "products" ? "hidden lg:flex" : "flex"
          }`}
        >
          {mode === "standalone" ? <HardwareSetup hardware={hardware} compact /> : null}

          {/* Stats row */}
          <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
            <StatPill
              label="Today"
              value={rs(todaySales)}
              sub={`${todayOrders} orders`}
            />
            <StatPill
              label="Cash shift"
              value={shift ? `Open` : "Closed"}
              sub={shift ? rs(shift.expected_cash) : "Open drawer first"}
              warn={!shift}
            />
            <StatPill
              label="Items"
              value={`${productCount + serviceCount}`}
              sub={`${lowStock + outStock > 0 ? `${lowStock + outStock} alerts` : "All good"}`}
              warn={lowStock + outStock > 0}
            />
            <div className="hidden sm:block lg:hidden xl:block">
              <StatPill
                label="Online"
                value={online ? "Live" : "Offline"}
                sub={queued > 0 ? `${queued} pending sync` : "All synced"}
                warn={!online}
              />
            </div>
          </div>

          {/* Search + scanner */}
          <div className="mb-2 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
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
                placeholder="Scan barcode, SKU or product name…"
                className="field h-11 !pl-10 text-sm"
                autoFocus
              />
            </div>
            <button
              type="button"
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-500 hover:border-brand-400 hover:text-brand-600"
              onClick={() => setCameraOpen(true)}
            >
              <QrCode size={15} />
              <span className="hidden sm:inline">Camera</span>
            </button>
            <button
              type="button"
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700"
              onClick={() => openConnect().catch(() => setError("Could not start scanner link."))}
            >
              <Smartphone size={15} />
              <span className="hidden sm:inline">Phone</span>
            </button>
          </div>

          {/* Kind + category filters */}
          <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-0.5">
            {([
              { id: "product" as const, label: "Products" },
              { id: "service" as const, label: "Services" },
              { id: "all"     as const, label: "All" },
            ]).map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => { setKindFilter(row.id); setCategory(""); }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  kindFilter === row.id
                    ? "bg-brand-600 text-white"
                    : "bg-surface-100 text-surface-500 hover:bg-surface-200"
                }`}
              >
                {row.label}
              </button>
            ))}
            <div className="mx-1 h-4 w-px shrink-0 bg-surface-200" />
            <button
              type="button"
              onClick={() => setCategory("")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                category === "" ? "bg-surface-900 text-white" : "bg-surface-100 text-surface-500 hover:bg-surface-200"
              }`}
            >
              All categories
            </button>
            {categories.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setCategory(name === category ? "" : name)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  category === name ? "bg-surface-900 text-white" : "bg-surface-100 text-surface-500 hover:bg-surface-200"
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Result count */}
          <p className="mb-2 text-xs text-surface-400">
            {items.length} {kindFilter === "service" ? "service" : "product"}{items.length !== 1 ? "s" : ""}
            {query.trim() ? ` for "${query.trim()}"` : ""}
            {category ? ` in ${category}` : ""}
            {snapshot?.catalog_truncated && !query.trim() ? ` · search to see more` : ""}
          </p>

          {/* Product grid */}
          <div className="min-h-0 flex-1 overflow-y-auto pb-2 pr-1">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {items.slice(0, 80).map((item) => {
                const inCart = cart.find((row) => row.item.id === item.id);
                const max    = maxSellable(item);
                const out    = max === 0;
                const stock  = stockTone(item);
                return (
                  <article
                    key={item.id}
                    className={`flex flex-col overflow-hidden rounded-xl border transition ${
                      inCart
                        ? "border-brand-500 bg-brand-50/60 shadow-sm"
                        : "border-surface-200 bg-white hover:border-brand-300 hover:shadow-sm"
                    } ${out ? "opacity-60" : ""}`}
                  >
                    {/* Card body */}
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="flex flex-1 items-start gap-3 p-3 text-left"
                    >
                      {/* Avatar */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-display ${
                          inCart
                            ? "bg-brand-600 text-white"
                            : "bg-surface-100 text-surface-600"
                        }`}
                      >
                        {inCart ? inCart.qty : (item.product || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-surface-900 leading-snug">
                          {item.product}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-surface-400">
                          {item.sku}
                          {item.variant && item.variant !== item.product ? ` · ${item.variant}` : ""}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between gap-1">
                          <span className="font-display text-base text-surface-900">
                            {rs(item.selling_price)}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${stock.className}`}>
                            {stock.label}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Card footer action */}
                    <div className={`border-t px-2.5 py-2 ${inCart ? "border-brand-200 bg-brand-50/80" : "border-surface-100 bg-surface-50"}`}>
                      {out ? (
                        <p className="text-center text-xs font-medium text-red-600">Out of stock</p>
                      ) : inCart ? (
                        <div className="flex items-center gap-2">
                          <QtyControl
                            value={inCart.qty}
                            min={0}
                            max={max ?? undefined}
                            onChange={(qty) => setQty(item.id, qty)}
                          />
                          <button
                            type="button"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                            onClick={() => removeLine(item.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-surface-900 text-xs font-medium text-white hover:bg-surface-700 transition-colors"
                          onClick={() => addItem(item)}
                        >
                          <Plus size={13} />
                          Add to ticket
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            {snapshot && items.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-surface-400">No {kindFilter === "service" ? "services" : "products"} found.</p>
              </div>
            ) : null}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT — Ticket + Payment
        ════════════════════════════════════════════════════════════════ */}
        <aside
          className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card ${
            mobileTab === "products" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Ticket header */}
          <div className="shrink-0 border-b border-surface-200 bg-surface-900 px-4 py-3 text-white">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-400">Current ticket</p>
                <p className="font-display text-lg leading-tight">
                  {cartQty > 0 ? `${cartQty} item${cartQty !== 1 ? "s" : ""} · ${quote ? rs(quote.total) : rs(0)}` : "Empty ticket"}
                </p>
              </div>
              {cart.length > 0 ? (
                <button
                  type="button"
                  className="rounded-lg px-2.5 py-1.5 text-xs text-white/50 hover:bg-white/10 hover:text-white"
                  onClick={() => setCart([])}
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {/* Scrollable ticket body */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Tab: TICKET */}
            <div className={mobileTab === "pay" ? "hidden lg:block" : "block"}>
              {/* Customer */}
              <div className="border-b border-surface-100 px-4 py-3">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-surface-400">
                    Customer
                  </span>
                  <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                    <option value="">Walk-in</option>
                    {(snapshot?.customers || []).map((c: PosCustomer) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.phone ? ` · ${c.phone}` : ""}
                      </option>
                    ))}
                  </Select>
                </label>
                {customer ? (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-surface-50 px-2.5 py-2">
                      <p className="text-surface-400">Outstanding</p>
                      <p className={`font-medium ${Number(customer.receivable_balance) > 0 ? "text-red-600" : "text-surface-900"}`}>
                        {rs(customer.receivable_balance)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-50 px-2.5 py-2">
                      <p className="text-surface-400">Credit limit</p>
                      <p className="font-medium text-surface-900">
                        {Number(customer.credit_limit) > 0 ? rs(customer.credit_limit) : "Open"}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Cart lines */}
              <div className="px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-400">
                    Items ({cart.length})
                  </p>
                </div>
                {cart.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-surface-200 py-10 text-center">
                    <ShoppingCart size={24} className="mx-auto mb-2 text-surface-300" />
                    <p className="text-sm text-surface-400">Add products from the catalog</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {priced.map((row) => (
                      <li
                        key={row.item.id}
                        className="flex items-start gap-2.5 rounded-xl border border-surface-100 bg-surface-50/60 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-surface-900">{row.item.product}</p>
                          <p className="text-xs text-surface-400">
                            {rs(row.unit)} each
                            {row.unit < row.list ? <span className="ml-1 line-through text-surface-300">{rs(row.list)}</span> : null}
                            {row.promoName ? <span className="ml-1 text-brand-600">{row.promoName}</span> : null}
                            {row.free ? <span className="ml-1 text-emerald-600">+{row.free} free</span> : null}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <p className="font-medium text-surface-900">{rs(row.lineTotal)}</p>
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
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-300 hover:bg-red-50 hover:text-red-500"
                              onClick={() => removeLine(row.item.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Discount */}
              {can("sale.discount") ? (
                <div className="border-t border-surface-100 px-4 py-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-surface-400">Discount</p>
                  <div className="flex gap-2">
                    <Select
                      value={manualKind}
                      onChange={(e) => setManualKind(e.target.value)}
                      className="w-24 shrink-0"
                    >
                      <option value="">None</option>
                      <option value="percent">%</option>
                      <option value="fixed">Rs</option>
                    </Select>
                    <Input
                      value={manualValue}
                      onChange={(e) => setManualValue(e.target.value)}
                      disabled={!manualKind}
                      placeholder="0"
                    />
                  </div>
                </div>
              ) : null}

              {/* Summary */}
              {quote && cart.length > 0 ? (
                <div className="border-t border-surface-200 bg-surface-50/60 px-4 py-3">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-surface-500">
                      <span>Subtotal</span>
                      <span>{rs(quote.subtotal)}</span>
                    </div>
                    {quote.manualDisc > 0 ? (
                      <div className="flex justify-between text-brand-600">
                        <span>Discount</span>
                        <span>− {rs(quote.manualDisc)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between border-t border-surface-200 pt-2 font-semibold text-surface-900">
                      <span>Total</span>
                      <span className="font-display text-xl">{rs(quote.total)}</span>
                    </div>
                  </div>
                  {/* Mobile: Go to pay button */}
                  <button
                    type="button"
                    className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-medium text-white hover:bg-brand-700 lg:hidden"
                    onClick={() => setMobileTab("pay")}
                    disabled={cart.length === 0}
                  >
                    Proceed to payment · {rs(quote.total)}
                  </button>
                </div>
              ) : null}

              {/* Recent sales */}
              {recentSales.length > 0 ? (
                <div className="border-t border-surface-100 px-4 py-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-surface-400">Recent sales</p>
                  <ul className="space-y-2">
                    {recentSales.slice(0, 3).map((row) => (
                      <li key={row.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-surface-900">{row.number}</span>
                          <span className="block truncate text-xs text-surface-400">{row.customer_name || "Walk-in"}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-medium">{rs(row.total)}</span>
                          <span className="flex gap-2 text-xs">
                            <button type="button" className="text-brand-600 hover:underline" onClick={() => reviewSlip(row.id, row.number)}>Slip</button>
                            <button type="button" className="text-surface-400 hover:underline" onClick={() => openReturn(row.number)}>Return</button>
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          {/* ── Payment panel (always visible on desktop, tab on mobile) ── */}
          <div
            className={`safe-bottom shrink-0 border-t border-surface-200 bg-white px-4 py-4 ${
              mobileTab === "pay" || true ? "block" : "hidden"
            } lg:block`}
          >
            {/* Only show full payment on desktop or when on pay tab mobile */}
            <div className={mobileTab !== "pay" ? "hidden lg:block" : "block"}>
              {/* Total */}
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <p className="text-sm text-surface-500">Amount due</p>
                <p className="font-display text-3xl text-surface-900">{quote ? rs(quote.total) : rs(0)}</p>
              </div>

              {/* Payment method */}
              <div className="mb-3 grid grid-cols-3 gap-2">
                {(["cash", "card", "bank"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPayMethod(method)}
                    className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                      payMethod === method
                        ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                        : "border-surface-200 bg-surface-50 text-surface-600 hover:border-brand-300"
                    }`}
                  >
                    {PAY_LABEL[method]}
                  </button>
                ))}
              </div>

              {/* Amount tendered + change */}
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-surface-400">
                    Tendered
                  </label>
                  <Input
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="text-center font-display text-lg"
                  />
                </div>
                <div className={`rounded-xl px-3 py-2.5 ${change >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-400">
                    {change >= 0 ? "Change" : "Balance due"}
                  </p>
                  <p className={`font-display text-2xl ${change >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {rs(Math.abs(change))}
                  </p>
                </div>
              </div>

              {/* Quick tender */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className="rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-medium text-surface-600 hover:border-brand-400"
                  onClick={() => quote && setPayAmount(money(quote.total).toFixed(2))}
                >
                  Exact
                </button>
                {TENDER.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className="rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-medium text-surface-600 hover:border-brand-400"
                    onClick={() => setPayAmount(String(amount))}
                  >
                    {rs(amount)}
                  </button>
                ))}
              </div>

              {/* Warnings */}
              {payMethod === "cash" && !shift ? (
                <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  No open cash shift. Open a shift first or pay by card/bank.
                </p>
              ) : null}
              {error ? <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
              {message ? <p className="mb-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

              {/* Complete sale */}
              <button
                type="button"
                disabled={pending || cart.length === 0}
                onClick={checkout}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-base font-semibold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ height: "3.25rem" }}
              >
                {pending ? "Processing…" : cart.length === 0 ? "Add items to sell" : `Complete sale · ${quote ? rs(quote.total) : rs(0)}`}
              </button>
              <button
                type="button"
                className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-surface-200 text-sm text-surface-500 hover:border-surface-300 hover:text-surface-700"
                onClick={() => openReturn()}
              >
                <RotateCcw size={14} />
                Process a return
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      <Modal open={cameraOpen} title="Scan product" onClose={() => setCameraOpen(false)}>
        <CameraScan
          onCode={(code) => { applyCode(code); setCameraOpen(false); }}
          onClose={() => setCameraOpen(false)}
        />
      </Modal>
      <Modal open={connectOpen} title="Connect phone scanner" onClose={() => setConnectOpen(false)}>
        <div className="space-y-3 text-center">
          {scanToken ? <QrImage value={`${typeof window !== "undefined" ? window.location.origin : ""}/scan/${scanToken}`} /> : null}
          <p className="text-sm text-surface-400">Scan this QR with your phone. Barcodes will appear on the ticket.</p>
          <p className={`text-sm font-medium ${phoneLinked ? "text-emerald-700" : "text-surface-400"}`}>
            {phoneLinked ? "Phone connected — start scanning." : "Waiting for phone…"}
          </p>
        </div>
      </Modal>
      <Modal open={returnOpen} title="Customer return" onClose={() => setReturnOpen(false)}>
        {returnOpen ? <SaleReturnPanel initialQuery={returnQuery} onDone={onReturned} /> : null}
      </Modal>
    </div>
  );
      <section className="flex min-h-0 flex-col overflow-hidden">
        {mode === "standalone" ? <HardwareSetup hardware={hardware} compact /> : null}

        {deskHelp && HELP_COPY[deskHelp] ? (
          <div className="mb-3 rounded-2xl border border-brand-300 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Manual sale</p>
            <p className="mt-1 text-sm text-surface-700">{HELP_COPY[deskHelp]}</p>
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
          <Kpi
            icon={Wrench}
            label="Services"
            value={serviceCount.toLocaleString()}
            hint="Priced when sold"
          />
          <Kpi
            icon={Package}
            label="Products"
            value={productCount.toLocaleString()}
            hint={kindFilter === "product" && category ? category : "Goods in catalog"}
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
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-surface-500/40" />
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
              placeholder="Scan or type SKU or name"
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
          <span className="self-center text-[11px] font-semibold uppercase tracking-[0.14em] text-surface-400">Can&apos;t scan?</span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs text-surface-500 hover:border-brand-400"
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
            className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs text-surface-500 hover:border-brand-400"
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
            className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs text-surface-500 hover:border-brand-400"
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
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-300 bg-white px-3 py-1.5 text-xs text-copper-800 hover:border-brand-500"
            onClick={() => openReturn()}
          >
            <RotateCcw size={12} />
            Customer return
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs text-surface-500 hover:border-brand-400"
            onClick={() => setDeskHelp("pay")}
          >
            <CreditCard size={12} />
            Card / bank
          </button>
          {isCashier(user) ? (
            <Link href="/cashier" className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs text-brand-700">
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
                kindFilter === row.id ? "bg-brand-500 text-surface-900" : "bg-white text-surface-500"
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
              category === "" ? "bg-surface-900 text-white" : "bg-white text-surface-500"
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
                category === name ? "bg-surface-900 text-white" : "bg-white text-surface-500"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {snapshot?.catalog_truncated && !query.trim() ? (
          <p className="mb-3 text-xs text-surface-400">
            Showing first {snapshot.catalog.length} of {snapshot.catalog_total?.toLocaleString()} items. Search to find the rest.
            Use Add 1, then + / − to change quantity.
          </p>
        ) : (
          <p className="mb-3 text-xs text-surface-400">
            {items.length} {kindFilter === "service" ? "service" : kindFilter === "product" ? "product" : "item"}
            {items.length === 1 ? "" : "s"}
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
                  className={`card flex flex-col overflow-hidden p-0 transition hover:border-brand-400 ${
                    inCart ? "border-brand-400 bg-brand-500/[0.04]" : ""
                  } ${active ? "border-brand-500 ring-2 ring-copper-500/30" : ""} ${
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
                          inCart ? "bg-brand-500 text-surface-900" : "bg-surface-100 text-surface-700"
                        }`}
                      >
                        {inCart ? inCart.qty : (item.product || "?").slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">
                            {isService(item) ? "Service" : item.category || "Uncategorized"}
                            {isService(item) && item.category ? ` · ${item.category}` : ""}
                          </p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${stock.className}`}>
                            {stock.label}
                          </span>
                        </div>
                        <p className="mt-0.5 break-words font-medium leading-snug text-surface-900">{item.product}</p>
                        <p className="mt-0.5 text-xs text-surface-400">
                          {item.variant && item.variant !== item.product ? `${item.variant} · ` : ""}
                          {item.sku || "No SKU"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto flex items-end justify-between gap-2">
                      <div>
                        <p className="font-display text-xl leading-none">{rs(item.selling_price)}</p>
                        {can("report.sales") ? <p className="mt-0.5 text-[11px] text-surface-400">Cost {rs(item.cost_price)}</p> : null}
                      </div>
                      <p className="text-right text-xs text-surface-400">
                        {isService(item) ? serviceMeta(item) : `${fmtQty(item.qty)} on hand`}
                      </p>
                    </div>
                  </button>
                  <div className="border-t border-surface-100 bg-surface-50/90 px-3 py-2.5">
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
                        className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-surface-900 text-sm font-medium text-white hover:bg-surface-700"
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
            <p className="py-10 text-center text-sm text-surface-400">
              {kindFilter === "service" ? "No services match this search." : "No products match this search."}
            </p>
          ) : null}
        </div>
      </section>

      <aside
        className={`flex min-h-0 min-w-0 flex-col overflow-hidden bg-white shadow-card max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:max-h-[90dvh] max-lg:rounded-t-2xl max-lg:border max-lg:border-surface-200 max-lg:transition-transform max-lg:duration-200 lg:relative lg:rounded-2xl lg:border lg:border-surface-200 ${
          ticketOpen ? "max-lg:translate-y-0" : "max-lg:translate-y-full"
        }`}
      >
        <div className="border-b border-surface-200 bg-surface-900 px-4 py-3 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-400">Current ticket</p>
              <p className="font-display text-xl">{user?.business_name || "Ticket"}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-right text-xs text-white/70">
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
          <div className="rounded-xl border border-surface-200 bg-surface-50/70">
            <div className="receipt-no-print flex items-start justify-between gap-3 px-3 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Slip</p>
                <p className="text-xs text-surface-400">
                  {slip ? slip.number : "Stays on this side. It does not pop up after each sale."}
                </p>
              </div>
              <label className="flex max-w-[11rem] cursor-pointer items-start gap-2 text-xs text-surface-700">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={printEverySale}
                  onChange={(e) => allowPrintEverySale(e.target.checked)}
                />
                Print a slip on every sale
              </label>
            </div>
            {printEverySale && !hardware.printer.connected ? (
              <p className="receipt-no-print px-3 pb-2 text-xs text-amber-800">
                Printer is off. Sales will still be saved, and slips will print when the printer is connected.
              </p>
            ) : null}
            {slip ? (
              <div id="receipt-print-root" className="border-t border-surface-200 bg-white px-2 py-3">
                <div className="receipt-no-print mb-2 flex flex-wrap gap-1 px-1">
                  {INVOICE_DESIGNS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSlipDesign(item.id)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        (slipDesign || snapshot?.invoice?.design || "classic") === item.id
                          ? "bg-surface-900 text-white"
                          : "bg-surface-100 text-surface-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <ReceiptSlip
                  sale={slip}
                  shop={snapshot?.shop || { name: user?.business_name || "Shop" }}
                  invoice={
                    snapshot?.invoice
                      ? { ...snapshot.invoice, design: slipDesign || snapshot.invoice.design }
                      : undefined
                  }
                  tendered={slipTendered}
                />
                <div className="receipt-no-print px-2 pb-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 w-full"
                    disabled={!hardware.printer.connected}
                    onClick={() => window.print()}
                  >
                    <Printer size={15} />
                    {hardware.printer.connected ? "Print this slip" : "Connect printer to print"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <Field label="Customer">
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Walk-in customer</option>
              {(snapshot?.customers || []).map((c: PosCustomer) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` · ${c.phone}` : ""}
                </option>
              ))}
            </Select>
          </Field>

          {customer ? (
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-50 p-3 text-xs">
              <DetailRow label="Phone" value={customer.phone || "—"} />
              <DetailRow label="Credit" value={rs(customer.receivable_balance)} />
            </div>
          ) : null}

          {selected ? (
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Selected item</p>
              <p className="mt-1 font-medium text-surface-900">{selected.product}</p>
              <dl className="mt-2 space-y-1 text-xs text-surface-500/75">
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
              <div className="mt-3 border-t border-surface-200 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-surface-400">Quantity</p>
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
                        draftQty === n ? "border-surface-900 bg-surface-900 text-white" : "border-surface-200 bg-white text-surface-500"
                      }`}
                      onClick={() => setItemQty(selected, n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-surface-400">
                  {selectedLine
                    ? `${selectedLine.qty} on this ticket. Change the number and tap Update.`
                    : "Add 1, or pick a quantity then tap Add."}
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-surface-50 px-3 py-3 text-sm text-surface-400">
              Tap a product to see details. Use Add 1, or + / − to change quantity.
            </p>
          )}

          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-surface-400">Lines</p>
              {cart.length ? (
                <button type="button" className="text-xs text-red-700" onClick={() => setCart([])}>
                  Clear ticket
                </button>
              ) : null}
            </div>
            <ul className="mt-2 space-y-2">
              {cart.length === 0 ? (
                <li className="rounded-xl border border-dashed border-surface-200 px-3 py-6 text-center text-sm text-surface-400">
                  No items yet. Tap Add 1, then use + / − if the customer wants more.
                </li>
              ) : null}
              {priced.map((row) => (
                <li key={row.item.id} className="rounded-xl border border-surface-200 bg-surface-50/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <button type="button" className="min-w-0 text-left" onClick={() => setSelectedId(row.item.id)}>
                      <p className="truncate font-medium">
                        {row.item.product}
                        {isService(row.item) ? (
                          <span className="ml-1 text-[10px] font-normal uppercase tracking-wide text-sky-800">Service</span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-surface-400">
                        {row.item.sku}
                        {row.item.variant && row.item.variant !== row.item.product ? ` · ${row.item.variant}` : ""}
                      </p>
                      {row.promoName ? <p className="mt-0.5 text-[11px] text-brand-700">{row.promoName}</p> : null}
                      {row.free ? <p className="text-[11px] text-emerald-700">{row.free} free</p> : null}
                    </button>
                    <p className="shrink-0 tabular-nums font-medium">{rs(row.lineTotal)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-surface-400">
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
          ) : null}

          {recentSales.length ? (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-surface-400">Latest sales</p>
                {overview ? (
                  <Link href="/reports" className="text-xs text-brand-700 underline">
                    Reports
                  </Link>
                ) : null}
              </div>
              <ul className="mt-2 space-y-2 text-sm">
                {recentSales.slice(0, 4).map((row) => (
                  <li key={row.id} className="border-b border-surface-100 pb-2">
                    <div className="flex justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{row.number}</span>
                        <span className="block truncate text-xs text-surface-400">
                          {row.customer_name || "Walk-in"}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-medium">{rs(row.total)}</span>
                        {"cashier_name" in row && row.cashier_name ? (
                          <span className="block text-[11px] text-surface-400">{row.cashier_name}</span>
                        ) : null}
                      </span>
                    </div>
                    <div className="mt-1 flex gap-3 text-xs">
                      <button type="button" className="text-brand-700 underline" onClick={() => reviewSlip(row.id, row.number)}>
                        View slip
                      </button>
                      <button type="button" className="text-surface-400 underline" onClick={() => openReturn(row.number)}>
                        Return
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {overview?.alerts.length ? (
            <div className="space-y-2">
              {overview.alerts.slice(0, 2).map((alert) => (
                <Link key={alert.title} href={alert.href} className="block rounded-xl bg-surface-50 px-3 py-2">
                  <Badge tone={alert.tone === "good" ? "good" : alert.tone === "warn" ? "warn" : "copper"}>
                    {alert.tone === "warn" ? "Action" : "Watch"}
                  </Badge>
                  <p className="mt-1 text-sm font-medium">{alert.title}</p>
                  <p className="text-xs text-surface-400">{alert.detail}</p>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="safe-bottom shrink-0 border-t border-surface-200 bg-white p-4">
          {quote ? (
            <dl className="space-y-1.5 text-sm">
              <div className="flex items-baseline justify-between gap-3 text-surface-400">
                <dt className="shrink-0">Subtotal</dt>
                <dd className="tabular-nums">{rs(quote.subtotal)}</dd>
              </div>
              {quote.manualDisc > 0 ? (
                <div className="flex items-baseline justify-between gap-3 text-brand-700">
                  <dt className="shrink-0">Manual discount</dt>
                  <dd className="tabular-nums">- {rs(quote.manualDisc)}</dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between gap-3 border-t border-surface-200 pt-2">
                <dt className="shrink-0 text-sm text-surface-400">Total due</dt>
                <dd className="text-right font-display text-xl leading-none tabular-nums">{rs(quote.total)}</dd>
              </div>
            </dl>
          ) : null}

          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["cash", "card", "bank"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPayMethod(method)}
                className={`rounded-xl border px-2 py-2 text-xs font-medium ${
                  payMethod === method ? "border-surface-900 bg-surface-900 text-white" : "border-surface-200 bg-white text-surface-500"
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
            <div className="rounded-xl bg-surface-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-surface-400">{change >= 0 ? "Change" : "Balance due"}</p>
              <p className={`font-display text-lg ${change >= 0 ? "text-emerald-800" : "text-red-700"}`}>
                {rs(Math.abs(change))}
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              className="rounded-lg border border-surface-200 bg-white px-2.5 py-1 text-xs"
              onClick={() => quote && setPayAmount(money(quote.total).toFixed(2))}
            >
              Exact
            </button>
            {TENDER.map((amount) => (
              <button
                key={amount}
                type="button"
                className="rounded-lg border border-surface-200 bg-white px-2.5 py-1 text-xs"
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
          <Button type="button" variant="ghost" className="mt-2 h-11 w-full" onClick={() => openReturn()}>
            <RotateCcw size={16} />
            Customer return
          </Button>
        </div>
      </aside>

      {ticketOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-surface-900/40 lg:hidden"
          aria-label="Close ticket"
          onClick={() => setTicketOpen(false)}
        />
      ) : (
        <button
          type="button"
          className="fixed z-30 inline-flex min-h-12 items-center gap-2 rounded-full bg-surface-900 px-4 py-3 text-sm font-medium text-white shadow-lg lg:hidden"
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
          <p className="text-sm text-surface-400">
            Scan this QR with your phone. The camera will open and barcodes will go to the ticket.
          </p>
          <p className={`text-sm ${phoneLinked ? "text-emerald-700" : "text-surface-400"}`}>
            {phoneLinked ? "Phone connected — start scanning." : "Waiting for phone…"}
          </p>
        </div>
      </Modal>
      <Modal open={returnOpen} title="Customer return" onClose={() => setReturnOpen(false)}>
        {returnOpen ? <SaleReturnPanel initialQuery={returnQuery} onDone={onReturned} /> : null}
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
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-surface-50">
      <HardwareToasts hardware={hardware} />
      <header className="safe-top shrink-0 border-b border-surface-200 bg-surface-900 px-3 py-2.5 text-white sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">Register</p>
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
            <button
              type="button"
              onClick={() => openReturn()}
              className="btn-ghost min-h-11 border-white/15 bg-transparent px-3 text-white"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Return</span>
            </button>
            <Link href={officeHref} className="btn-ghost min-h-11 border-white/15 bg-transparent px-3 text-white">
              <LayoutDashboard size={16} />
              <span className="hidden sm:inline">Back office</span>
            </Link>
            <button type="button" onClick={logout} className="min-h-11 px-1 text-sm text-white/60 hover:text-white">
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
      className={`inline-flex items-center overflow-hidden rounded-xl border border-surface-200 bg-white ${
        size === "sm" ? "w-[7.25rem] shrink-0" : "min-w-0 flex-1"
      }`}
    >
      <button
        type="button"
        className={`grid ${btn} shrink-0 place-items-center text-surface-700 hover:bg-surface-100 disabled:opacity-35`}
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
        className="min-w-0 flex-1 border-x border-surface-200 bg-transparent py-1 text-center text-sm tabular-nums outline-none"
      />
      <button
        type="button"
        className={`grid ${btn} shrink-0 place-items-center text-surface-700 hover:bg-surface-100 disabled:opacity-35`}
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
  if (!item.track_stock) return { kind: "ok" as const, label: "No track", className: "bg-surface-100 text-surface-500" };
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
        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${warn ? "bg-amber-100 text-amber-900" : "bg-surface-900 text-white"}`}>
          <Icon size={15} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-surface-400">{label}</p>
          <p className="truncate font-display text-lg leading-tight text-surface-900">{value}</p>
          <p className="truncate text-[11px] text-surface-400">{hint}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
      <dt className="shrink-0 text-surface-400">{label}</dt>
      <dd className="min-w-0 truncate text-right text-surface-900">{value}</dd>
    </div>
  );
}
