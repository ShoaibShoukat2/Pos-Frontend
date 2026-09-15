"use client";

import type { ReactNode } from "react";

import { Empty, Input } from "@/components/ui";

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="animate-pulse">
        <div className="h-10 bg-paper-100" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-3 border-t border-paper-100 px-4 py-3">
            {Array.from({ length: cols }).map((__, j) => (
              <div key={j} className="h-4 flex-1 rounded bg-paper-100" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="max-w-sm"
    />
  );
}

export function Pager({
  page,
  pages,
  count,
  onPage,
}: {
  page: number;
  pages: number;
  count: number;
  onPage: (page: number) => void;
}) {
  if (count === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-700/70">
      <p>
        {count.toLocaleString()} record{count === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-ghost px-3 py-1.5"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <span>
          Page {page} / {pages}
        </span>
        <button
          type="button"
          className="btn-ghost px-3 py-1.5"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function ListState({
  loading,
  count,
  emptyTitle,
  emptyHint,
  cols = 4,
  children,
}: {
  loading: boolean;
  count: number;
  emptyTitle: string;
  emptyHint?: string;
  cols?: number;
  children: ReactNode;
}) {
  if (loading && count === 0) return <TableSkeleton cols={cols} />;
  if (!loading && count === 0) return <Empty title={emptyTitle} hint={emptyHint} />;
  return (
    <div className={loading ? "opacity-70 transition-opacity" : ""}>
      {children}
    </div>
  );
}
