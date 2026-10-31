"use client";

import { useEffect, useRef, useState } from "react";
import { ScanLine, Search, X, ImageOff, Tag } from "lucide-react";

import { apiBase } from "@/lib/api";
import { rs } from "@/lib/money";

type ShopInfo = {
  name: string;
  legal_name: string;
  city: string;
  logo: string;
  primary_color: string;
  accent_color: string;
};

type SearchResult = {
  id: string;
  product: string;
  variant: string;
  sku: string;
  barcode: string;
  category: string;
  selling_price: string;
  item_kind: string;
};

export default function PriceCheckerPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const [shop, setShop]     = useState<ShopInfo | null>(null);
  const [error, setError]   = useState("");
  const [query, setQuery]   = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [history, setHistory] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load shop info
  useEffect(() => {
    const base = apiBase();
    fetch(`${base}/api/public/price-check/${slug}/`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { setError("not-found"); return; }
        setShop(data);
        // Apply theme
        const root = document.documentElement;
        root.style.setProperty("--shop-primary", data.primary_color || "#1e293b");
        root.style.setProperty("--shop-accent", data.accent_color || "#6366f1");
      })
      .catch(() => setError("not-found"));
  }, [slug]);

  // Auto-focus
  useEffect(() => {
    if (shop) inputRef.current?.focus();
  }, [shop]);

  async function lookup(raw: string) {
    const q = raw.trim();
    if (!q || !shop) return;
    setSearching(true);
    setResult(null);
    try {
      const base = apiBase();
      const res = await fetch(`${base}/api/public/price-check/${slug}/search/?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        setResult(item);
        setHistory((prev) => [item, ...prev.filter((r) => r.id !== item.id)].slice(0, 6));
      } else {
        setResult(null);
      }
    } catch {
      setResult(null);
    } finally {
      setSearching(false);
      setQuery("");
      inputRef.current?.focus();
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      lookup(query);
    }
  }

  // ── Loading state ──
  if (loading && !shop) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <p className="text-surface-400">Loading…</p>
      </div>
    );
  }

  // ── Not found / disabled ──
  if (error || !shop) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100">
            <Search size={24} className="text-surface-400" />
          </div>
          <h1 className="font-display text-2xl text-surface-900">Price checker not available</h1>
          <p className="mt-2 text-sm text-surface-400">
            This shop has not enabled the price checker, or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ ["--shop-primary" as string]: shop.primary_color, ["--shop-accent" as string]: shop.accent_color }}>
      {/* Header bar with shop branding */}
      <header
        className="px-4 py-5 text-white"
        style={{ background: shop.primary_color || "#1e293b" }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {shop.logo ? (
            <img
              src={shop.logo}
              alt={shop.name}
              className="h-11 w-11 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{ background: shop.accent_color || "#6366f1" }}
            >
              {shop.name?.[0] || "?"}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl leading-tight">{shop.name}</h1>
            {shop.city ? <p className="text-xs text-white/50">{shop.city}</p> : null}
          </div>
          <span
            className="ml-auto rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
            style={{ background: shop.accent_color || "#6366f1", color: "#fff" }}
          >
            Price Check
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKey}
              placeholder="Scan barcode or type SKU / name…"
              className="w-full rounded-xl border border-surface-200 bg-white py-3.5 pl-10 pr-4 text-base shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
            />
            {query ? (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300 hover:text-surface-600"
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              >
                <X size={15} />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => lookup(query)}
            disabled={!query.trim() || searching}
            className="flex h-[3.25rem] shrink-0 items-center gap-1.5 rounded-xl px-5 text-sm font-medium text-white transition disabled:opacity-40"
            style={{ background: shop.accent_color || "#6366f1" }}
          >
            {searching ? "…" : <><ScanLine size={15} /> Check</>}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-surface-400">
          Press <kbd className="rounded border border-surface-200 bg-surface-50 px-1 font-mono text-[10px]">Enter</kbd> after typing or scanning
        </p>

        {/* Result */}
        {result ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card">
            {/* Price hero */}
            <div className="px-6 py-10 text-center text-white" style={{ background: shop.accent_color || "#6366f1" }}>
              <p className="text-sm font-medium opacity-80">Price</p>
              <p className="mt-1 font-display text-6xl font-semibold tracking-tight">
                {rs(result.selling_price)}
              </p>
            </div>
            {/* Details */}
            <div className="px-6 py-5">
              <h2 className="font-display text-2xl text-surface-900">{result.product}</h2>
              {result.variant && result.variant !== result.product ? (
                <p className="mt-1 text-sm text-surface-500">{result.variant}</p>
              ) : null}
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                {result.category ? (
                  <div className="rounded-xl bg-surface-50 px-3 py-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-widest text-surface-400">Category</dt>
                    <dd className="mt-0.5 font-medium text-surface-900">{result.category}</dd>
                  </div>
                ) : null}
                {result.sku ? (
                  <div className="rounded-xl bg-surface-50 px-3 py-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-widest text-surface-400">SKU</dt>
                    <dd className="mt-0.5 font-mono font-medium text-surface-900">{result.sku}</dd>
                  </div>
                ) : null}
                {result.barcode ? (
                  <div className="rounded-xl bg-surface-50 px-3 py-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-widest text-surface-400">Barcode</dt>
                    <dd className="mt-0.5 font-mono font-medium text-surface-900">{result.barcode}</dd>
                  </div>
                ) : null}
                {result.item_kind === "service" ? (
                  <div className="rounded-xl bg-surface-50 px-3 py-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-widest text-surface-400">Type</dt>
                    <dd className="mt-0.5 font-medium text-surface-900">Service</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        ) : searching ? (
          <div className="mt-8 flex items-center justify-center">
            <span className="text-surface-400">Searching…</span>
          </div>
        ) : null}

        {/* No result */}
        {!result && !searching && query === "" && history.length === 0 ? (
          <div className="mt-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100">
              <Tag size={22} className="text-surface-400" />
            </div>
            <p className="text-sm text-surface-400">
              Scan a product or type its name to see the price
            </p>
          </div>
        ) : null}

        {/* History */}
        {history.length > 0 ? (
          <div className="mt-8">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-surface-400">
              Recent checks
            </p>
            <ul className="space-y-2">
              {history.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-surface-200 bg-white px-4 py-3 text-left transition hover:border-brand-300 hover:shadow-sm"
                    onClick={() => setResult(item)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-surface-900">{item.product}</p>
                      <p className="text-xs text-surface-400">{item.sku}</p>
                    </div>
                    <span className="shrink-0 font-display text-lg font-semibold" style={{ color: shop.accent_color || "#6366f1" }}>
                      {rs(item.selling_price)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </main>
    </div>
  );
}
