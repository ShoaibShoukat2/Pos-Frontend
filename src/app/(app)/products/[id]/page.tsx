"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    api<Product>(`/api/products/${params.id}/`).then(setProduct).catch(() => {});
  }, [params.id]);

  if (!product) {
    return <p className="text-sm text-ink-700/70">Loading product…</p>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title={product.name}
        description={`${product.sku} · ${product.item_kind === "service" ? "Service" : product.has_variants ? "Variant product" : "Simple SKU"}`}
        action={
          <Link href="/products" className="btn-ghost">
            Back
          </Link>
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {product.item_kind === "service" ? (
          <>
            <Stat label="Selling" value={`Rs ${product.selling_price}`} />
            <Stat label="Cost" value={`Rs ${product.cost_price}`} />
            <Stat label="Duration" value={product.duration_minutes ? `${product.duration_minutes} min` : "—"} />
            <Stat label="Warranty" value={product.warranty_days ? `${product.warranty_days} days` : "—"} />
          </>
        ) : (
          <>
            <Stat label="Selling" value={`Rs ${product.selling_price}`} />
            <Stat label="Cost" value={`Rs ${product.cost_price}`} />
            <Stat label="On hand" value={String(product.total_stock ?? 0)} />
            <Stat label="Min stock" value={String(product.min_stock)} />
          </>
        )}
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
            <tr>
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Barcode</th>
              <th className="px-4 py-3">Sell</th>
              <th className="px-4 py-3">Stock by branch</th>
            </tr>
          </thead>
          <tbody>
            {(product.variants || []).map((variant) => (
              <tr key={variant.id} className="border-t border-paper-100">
                <td className="px-4 py-3">
                  <p className="font-medium">{variant.display_name}</p>
                  {variant.is_default ? <Badge>Default</Badge> : null}
                </td>
                <td className="px-4 py-3">{variant.sku}</td>
                <td className="px-4 py-3">{variant.barcode || "—"}</td>
                <td className="px-4 py-3">Rs {variant.selling_price}</td>
                <td className="px-4 py-3">
                  {(variant.stock_by_branch || []).length === 0 ? (
                    <span className="text-ink-700/50">0</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {variant.stock_by_branch?.map((row) => (
                        <Badge key={row.branch_id} tone={row.is_low ? "warn" : "good"}>
                          {row.branch_name}: {row.quantity}
                        </Badge>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-700/55">{label}</p>
      <p className="stat-value mt-1">{value}</p>
    </div>
  );
}
