"use client";

import { useEffect, useRef, useState } from "react";
import { ScanLine, Search, X } from "lucide-react";

import { CameraScan } from "@/components/CameraScan";
import { Modal, PageHeader } from "@/components/ui";
import { api, asList } from "@/lib/api";
import { rs } from "@/lib/money";
import type { PosCatalogItem } from "@/lib/types";

type Result = PosCatalogItem & { found: true } | { found: false; query: string };

export default function PriceCheckPage() {
  const [query, setQuery]       = useState("");
  const [result, setResult]     = useState<Result | null>(null);
  const [loading, setLoading]   = useState(false);
  const [history, setHistory]   = useState<PosCatalogItem[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function lookup(raw: string) {
    const q = raw.trim();
    if (!q) return;
    setLoading(true);
    setResult(null);
    try {
      const data = asList(
        await api<PosCatalogItem[] | { results: PosCatalogItem[] }>(
          `/api/pos/catalog/?search=${encodeURIComponent(q)}&page_size=5`,
        ),
      );
      // Prefer exact barcode/sku match first
      const exact = data.find(
        (r) => r.barcode.toLowerCase() === q.toLowerCase() || r.sku.toLowerCase() === q.toLowerCase(),
      );
      const item = exact || data[0] || null;
      if (item) {
        setResult({ ...item, found: true });
        setHistory((prev) => {
          const next = [item, ...prev.filter((r) => r.id !== item.id)].slice(0, 8);
          return next;
        });
      } else {
        setResult({ found: false, query: q });
      }
    } catch {
      setResult({ found: false, query: q });
    } finally {
      setLoading(false);
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

  function onScan(code: string) {
    setCameraOpen(false);
    lookup(code);
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        eyebrow="Tools"
        title="Price checker"
        description="Scan or type a barcode or SKU to see the selling price instantly."
      />

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
            className="field h-12 !pl-10 text-base"
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
          onClick={() => setCameraOpen(true)}
          className="flex h-12 shrink-0 items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 text-sm font-medium text-surface-600 hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          <ScanLine size={17} />
          Camera
        </button>
        <button
          type="button"
          onClick={() => lookup(query)}
          disabled={!query.trim() || loading}
          className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40 transition-colors"
        >
          {loading ? "…" : "Check"}
        </button>
      </div>

      <p className="mt-2 text-xs text-surface-400">
        Press <kbd className="rounded border border-surface-200 bg-surface-50 px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> after typing, or use a USB barcode scanner — it sends Enter automatically.
      </p>

      {/* Result card */}
      {result ? (
        <div className="mt-6">
          {result.found ? (
            <div className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-card">
              {/* Price hero */}
              <div className="bg-brand-600 px-6 py-8 text-center text-white">
                <p className="text-sm font-medium text-brand-200">Selling price</p>
                <p className="mt-1 font-display text-6xl font-semibold tracking-tight">
                  {rs(result.selling_price)}
                </p>
              </div>
              {/* Product details */}
              <div className="px-6 py-5">
                <h2 className="font-display text-2xl text-surface-900">{result.product}</h2>
                {result.variant && result.variant !== result.product ? (
                  <p className="mt-1 text-sm text-surface-500">{result.variant}</p>
                ) : null}
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-surface-50 px-3 py-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-widest text-surface-400">SKU</dt>
                    <dd className="mt-0.5 font-mono font-medium text-surface-900">{result.sku || "—"}</dd>
                  </div>
                  <div className="rounded-xl bg-surface-50 px-3 py-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-widest text-surface-400">Category</dt>
                    <dd className="mt-0.5 font-medium text-surface-900">{result.category || "—"}</dd>
                  </div>
                  {result.barcode ? (
                    <div className="rounded-xl bg-surface-50 px-3 py-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-widest text-surface-400">Barcode</dt>
                      <dd className="mt-0.5 font-mono font-medium text-surface-900">{result.barcode}</dd>
                    </div>
                  ) : null}
                  {result.track_stock ? (
                    <div className="rounded-xl bg-surface-50 px-3 py-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-widest text-surface-400">In stock</dt>
                      <dd className={`mt-0.5 font-medium ${Number(result.qty) <= 0 ? "text-red-600" : "text-emerald-700"}`}>
                        {Number(result.qty) <= 0 ? "Out of stock" : `${result.qty} units`}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-surface-200 bg-white px-6 py-10 text-center shadow-card">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-100">
                <Search size={20} className="text-surface-400" />
              </div>
              <p className="font-medium text-surface-900">No product found</p>
              <p className="mt-1 text-sm text-surface-400">
                Nothing matched <span className="font-mono">{result.query}</span>
              </p>
            </div>
          )}
        </div>
      ) : null}

      {/* Scan history */}
      {history.length > 0 ? (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-400">
              Recent checks
            </p>
            <button
              type="button"
              className="text-xs text-surface-400 hover:text-surface-600"
              onClick={() => setHistory([])}
            >
              Clear
            </button>
          </div>
          <ul className="space-y-2">
            {history.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-surface-200 bg-white px-4 py-3 text-left transition hover:border-brand-300 hover:shadow-sm"
                  onClick={() => setResult({ ...item, found: true })}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-surface-900">{item.product}</p>
                    <p className="text-xs text-surface-400">
                      {item.sku}
                      {item.category ? ` · ${item.category}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-lg font-semibold text-surface-900">
                    {rs(item.selling_price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Camera modal */}
      <Modal open={cameraOpen} title="Scan barcode" onClose={() => setCameraOpen(false)}>
        <CameraScan onCode={onScan} onClose={() => setCameraOpen(false)} />
      </Modal>
    </div>
  );
}
