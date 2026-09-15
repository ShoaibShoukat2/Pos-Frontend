"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui";
import { api, asList } from "@/lib/api";
import { useDebounced } from "@/lib/query";
import type { ProductVariant } from "@/lib/types";

export function VariantPicker({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}) {
  const [q, setQ] = useState("");
  const search = useDebounced(q, 250);
  const [rows, setRows] = useState<ProductVariant[]>([]);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams({ page_size: "20" });
    if (search.trim()) params.set("search", search.trim());
    api<ProductVariant[] | { results: ProductVariant[] }>(`/api/variants/?${params}`, { signal: ctrl.signal })
      .then((data) => setRows(asList(data)))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setRows([]);
      });
    return () => ctrl.abort();
  }, [search]);

  useEffect(() => {
    if (!value) {
      setLabel("");
      return;
    }
    const found = rows.find((row) => row.id === value);
    if (found) setLabel(`${found.product_name} · ${found.display_name} (${found.sku})`);
  }, [value, rows]);

  return (
    <div className="space-y-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search SKU, barcode or name"
      />
      <select
        className="field"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{label || "Select variant"}</option>
        {rows.map((row) => (
          <option key={row.id} value={row.id}>
            {row.product_name} · {row.display_name} ({row.sku})
          </option>
        ))}
      </select>
    </div>
  );
}

export function ProductPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const search = useDebounced(q, 250);
  const [rows, setRows] = useState<{ id: string; name: string; sku: string }[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams({ page_size: "20" });
    if (search.trim()) params.set("search", search.trim());
    api<{ id: string; name: string; sku: string }[] | { results: { id: string; name: string; sku: string }[] }>(
      `/api/products/?${params}`,
      { signal: ctrl.signal },
    )
      .then((data) => setRows(asList(data)))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setRows([]);
      });
    return () => ctrl.abort();
  }, [search]);

  return (
    <div className="space-y-2">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product" />
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All products</option>
        {rows.map((row) => (
          <option key={row.id} value={row.id}>
            {row.name} ({row.sku})
          </option>
        ))}
      </select>
    </div>
  );
}
