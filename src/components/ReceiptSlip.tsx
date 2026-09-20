"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui";
import { num, rs } from "@/lib/money";
import type { InvoiceSettings, PosSale, ReceiptShop } from "@/lib/types";

export type { ReceiptShop };

const PAY_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  bank: "Bank",
  wallet: "Wallet",
};

function fmtQty(value: string | number | undefined) {
  const n = num(value);
  return n.toLocaleString("en-PK", { maximumFractionDigits: n % 1 === 0 ? 0 : 3 });
}

function when(sale: PosSale) {
  const raw = sale.sold_at || sale.created_at;
  if (!raw) return "";
  const at = new Date(raw);
  if (Number.isNaN(at.getTime())) return "";
  return at.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paperClass(size?: InvoiceSettings["paper_size"]) {
  if (size === "58mm") return "receipt-paper-58";
  if (size === "A4") return "receipt-paper-a4";
  return "receipt-paper-80";
}

export function ReceiptSlip({
  sale,
  shop,
  invoice,
  tendered,
}: {
  sale: PosSale;
  shop?: ReceiptShop | null;
  invoice?: InvoiceSettings | null;
  tendered?: number | null;
}) {
  const shopName = shop?.legal_name || shop?.name || "Shop";
  const total = num(sale.net_total || sale.total);
  const paid = num(sale.paid_amount);
  const due = num(sale.due_amount);
  const discount = num(sale.discount_total);
  const given = tendered != null && tendered > 0 ? tendered : paid;
  const change = Math.max(0, given - total);
  const method = PAY_LABEL[sale.payment_method || "cash"] || sale.payment_method || "Cash";
  const lines = sale.lines || [];

  return (
    <div className={`receipt-slip ${paperClass(invoice?.paper_size)}`}>
      {invoice?.show_logo && shop?.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shop.logo} alt="" className="mx-auto mb-2 h-12 object-contain" />
      ) : null}
      <h1 className="text-center font-display text-xl leading-tight text-ink-950">{shopName}</h1>
      {shop?.address || shop?.city ? (
        <p className="mt-1 text-center text-[11px] leading-snug text-ink-700/80">
          {[shop.address, shop.city].filter(Boolean).join(", ")}
        </p>
      ) : null}
      {shop?.phone ? <p className="text-center text-[11px] text-ink-700/80">{shop.phone}</p> : null}
      {shop?.tax_number ? <p className="text-center text-[11px] text-ink-700/80">NTN {shop.tax_number}</p> : null}

      <div className="receipt-rule" />
      <Row label="Ticket" value={sale.number} />
      {when(sale) ? <Row label="Date" value={when(sale)} /> : null}
      {invoice?.show_cashier_name !== false && sale.cashier_name ? (
        <Row label="Cashier" value={sale.cashier_name} />
      ) : null}
      <Row label="Customer" value={sale.customer_name || "Walk-in"} />
      <div className="receipt-rule" />

      {lines.length === 0 ? (
        <p className="py-3 text-center text-xs text-ink-700/70">No items on this slip.</p>
      ) : (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-ink-700/55">
              <th className="pb-1 font-medium">Item</th>
              <th className="pb-1 text-right font-medium">Qty</th>
              <th className="pb-1 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => {
              const unit = num(line.promo_price || line.unit_price);
              return (
                <tr key={line.id || `${line.sku}-${i}`}>
                  <td className="py-1 pr-2 align-top">
                    <span className="block font-medium text-ink-950">{line.product_name}</span>
                    {line.variant_name && line.variant_name !== line.product_name ? (
                      <span className="block text-[10px] text-ink-700/60">{line.variant_name}</span>
                    ) : null}
                    {line.sku ? <span className="block text-[10px] text-ink-700/55">{line.sku}</span> : null}
                    {unit > 0 ? (
                      <span className="block text-[10px] text-ink-700/55">{rs(unit)} each</span>
                    ) : null}
                  </td>
                  <td className="py-1 text-right align-top tabular-nums">{fmtQty(line.quantity)}</td>
                  <td className="py-1 text-right align-top tabular-nums">{rs(line.line_total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="receipt-rule" />
      <Row label="Subtotal" value={rs(sale.subtotal || sale.total)} />
      {discount > 0 ? <Row label="Discount" value={`- ${rs(discount)}`} /> : null}
      <Row label="Total" value={rs(total)} strong />
      <Row label={`Paid · ${method}`} value={rs(given)} />
      {change > 0 ? <Row label="Change" value={rs(change)} /> : null}
      {due > 0 ? <Row label="Balance due" value={rs(due)} /> : null}

      {invoice?.footer_note ? (
        <>
          <div className="receipt-rule" />
          <p className="text-center text-[11px] leading-snug text-ink-800">{invoice.footer_note}</p>
        </>
      ) : null}
      {invoice?.terms ? <p className="mt-2 text-center text-[10px] leading-snug text-ink-700/70">{invoice.terms}</p> : null}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 text-xs ${strong ? "mt-1" : ""}`}>
      <span className="shrink-0 text-ink-700/70">{label}</span>
      <span className={`min-w-0 break-words text-right tabular-nums ${strong ? "font-display text-base text-ink-950" : "text-ink-950"}`}>
        {value}
      </span>
    </div>
  );
}

export function ReceiptReview({
  open,
  sale,
  shop,
  invoice,
  tendered,
  autoPrint,
  onClose,
}: {
  open: boolean;
  sale: PosSale | null;
  shop?: ReceiptShop | null;
  invoice?: InvoiceSettings | null;
  tendered?: number | null;
  autoPrint?: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open || !sale || !autoPrint) return;
    const tick = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(tick);
  }, [open, sale, autoPrint]);

  if (!open || !sale) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-ink-950/50 p-0 sm:items-start sm:p-4">
      <div className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white sm:mt-8 sm:max-w-[min(28rem,calc(100vw-2rem))] sm:rounded-2xl">
        <div className="receipt-no-print flex items-center justify-between gap-3 border-b border-paper-200 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-copper-600">Customer slip</p>
            <p className="font-medium text-ink-950">{sale.number}</p>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 px-1 text-sm text-ink-700/70 hover:text-ink-950">
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-paper-50 px-3 py-4">
          <div id="receipt-print-root" className="mx-auto">
            <ReceiptSlip sale={sale} shop={shop} invoice={invoice} tendered={tendered} />
          </div>
        </div>
        <div className="receipt-no-print grid grid-cols-2 gap-2 border-t border-paper-200 p-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Done
          </Button>
          <Button type="button" variant="copper" onClick={() => window.print()}>
            <Printer size={16} />
            Print slip
          </Button>
        </div>
      </div>
    </div>
  );
}
