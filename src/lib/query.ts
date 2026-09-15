"use client";

import { useCallback, useEffect, useState } from "react";

import { api, asPage } from "./api";

export const PAGE_SIZE = 25;

export function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function usePagedList<T>(
  path: string,
  opts: {
    enabled?: boolean;
    extraParams?: Record<string, string | undefined>;
    pageSize?: number;
  } = {},
) {
  const enabled = opts.enabled !== false;
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const extraKey = JSON.stringify(opts.extraParams || {});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useDebounced(search, 250);
  const [rows, setRows] = useState<T[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [q, extraKey, path]);

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    if (q.trim()) params.set("search", q.trim());
    for (const [key, value] of Object.entries(opts.extraParams || {})) {
      if (value) params.set(key, value);
    }
    const sep = path.includes("?") ? "&" : "?";
    api<T[] | { results: T[]; count: number }>(`${path}${sep}${params.toString()}`, { signal: ctrl.signal })
      .then((data) => {
        const next = asPage(data);
        setRows(next.results);
        setCount(next.count);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setRows([]);
        setCount(0);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [enabled, path, page, pageSize, q, extraKey, reloadTick]);

  const reload = useCallback(() => setReloadTick((n) => n + 1), []);
  const pages = Math.max(1, Math.ceil(count / pageSize) || 1);

  return { rows, count, loading, page, setPage, search, setSearch, pages, reload, pageSize };
}
