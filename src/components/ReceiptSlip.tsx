"use client";

import { useEffect, useState } from "react";
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

export type InvoiceDesign = "classic" | "compact" | "bold" | "formal";

export const INVOICE_DESIGNS: { id: InvoiceDesign; label: string; hint: string }[] = [
  { id: "classic", label: "Classic", hint: "Centered shop name and a simple ticket." },
  { id: "compact", label: "Compact", hint: "Tight lines for a short thermal slip." },
  { id: "bold", label: "Bold", hint: "Dark header and a strong total." },
  { id: "formal", label: "Formal", hint: "Invoice heading, ruled table and a totals box." },
];

function paperClass(size?: InvoiceSettings["paper_size"]) {
  if (size === "58mm") return "receipt-paper-58";
  if (size === "A4") return "receipt-paper-a4";
  return "receipt-paper-80";
}

function designOf(invoice?: InvoiceSettings | null): InvoiceDesign {
  const value = invoice?.design;
  if (value === "compact" || value === "bold" || value === "formal") return value;
  return "classic";
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

  const wide = invoice?.paper_size === "A4" || designOf(invoice) === "formal";
  const design = designOf(invoice);
  const logo = invoice?.show_logo && shop?.logo ? shop.logo : "";
  const address = [shop?.address, shop?.city].filter(Boolean).join(", ");

  if (design === "bold") {
    return (
      <article className={`receipt-slip receipt-design-bold ${paperClass(invoice?.paper_size)}`}>
        <header className="bg-ink-950 px-3 py-4 text-center text-paper-50">
          {logo ? <img src={logo} alt="" className="mx-auto mb-2 h-10 object-contain" /> : null}
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-copper-400">Invoice</p>
          <h1 className="mt-1 font-display text-2xl leading-tight">{shopName}</h1>
          {address ? <p className="mt-1 text-[11px] text-paper-50/70">{address}</p> : null}
          {shop?.phone ? <p className="text-[11px] text-paper-50/70">{shop.phone}</p> : null}
        </header>
        <div className="space-y-2 px-3 py-3">
          <Meta sale={sale} invoice={invoice} method={method} />
          <ItemList lines={lines} wide={wide} />
          <div className="flex items-baseline justify-between bg-copper-500 px-3 py-2 text-ink-950">
            <span className="text-xs font-semibold uppercase tracking-wide">Total</span>
            <span className="font-display text-xl">{rs(total)}</span>
          </div>
          <Totals sale={sale} discount={discount} given={given} change={change} due={due} method={method} hideTotal />
          <Footer invoice={invoice} />
        </div>
      </article>
    );
  }

  if (design === "formal") {
    return (
      <article className={`receipt-slip receipt-design-formal ${paperClass(invoice?.paper_size)} ${wide ? "receipt-slip-a4" : ""}`}>
        <header className="flex items-start justify-between gap-4 border-b-2 border-ink-950 pb-3">
          <div>
            {logo ? <img src={logo} alt="" className="mb-2 h-12 object-contain" /> : null}
            <h1 className="font-display text-xl leading-tight text-ink-950">{shopName}</h1>
            {address ? <p className="mt-1 text-[11px] text-ink-700/75">{address}</p> : null}
            {shop?.phone ? <p className="text-[11px] text-ink-700/75">{shop.phone}</p> : null}
            {shop?.tax_number ? <p className="text-[11px] text-ink-700/75">NTN {shop.tax_number}</p> : null}
          </div>
          <div className="text-right">
            <p className="font-display text-3xl leading-none text-ink-950">Invoice</p>
            <p className="mt-2 text-xs font-medium">{sale.number}</p>
            {when(sale) ? <p className="text-[11px] text-ink-700/70">{when(sale)}</p> : null}
          </div>
        </header>
        <div className="mt-3">
          <Meta sale={sale} invoice={invoice} method={method} hideNumber />
        </div>
        <div className="mt-3">
          <ItemList lines={lines} wide />
        </div>
        <div className="mt-3 ml-auto w-full max-w-xs border border-ink-950/20 p-3">
          <Totals sale={sale} discount={discount} given={given} change={change} due={due} method={method} />
        </div>
        <Footer invoice={invoice} />
      </article>
    );
  }

  if (design === "compact") {
    return (
      <article className={`receipt-slip receipt-design-compact ${paperClass(invoice?.paper_size)}`}>
        <header className="text-center">
          <h1 className="text-sm font-semibold leading-tight">{shopName}</h1>
          {address ? <p className="text-[10px] leading-snug text-ink-700/70">{address}</p> : null}
          <p className="text-[10px] text-ink-700/70">
            {sale.number}
            {when(sale) ? ` · ${when(sale)}` : ""}
          </p>
        </header>
        <div className="receipt-rule" />
        <ItemList lines={lines} wide={false} compact />
        <div className="receipt-rule" />
        <Totals sale={sale} discount={discount} given={given} change={change} due={due} method={method} />
        <Footer invoice={invoice} />
      </article>
    );
  }

  return (
    <article className={`receipt-slip receipt-design-classic ${paperClass(invoice?.paper_size)} ${wide ? "receipt-slip-a4" : ""}`}>
      <header className="text-center">
        {invoice?.show_logo && shop?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.logo} alt="" className="mx-auto mb-2 h-12 object-contain" />
        ) : null}
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ink-700/55">Invoice</p>
        <h1 className="mt-1 font-display text-xl leading-tight text-ink-950">{shopName}</h1>
        {shop?.address || shop?.city ? (
          <p className="mt-1 text-[11px] leading-snug text-ink-700/75">
            {[shop.address, shop.city].filter(Boolean).join(", ")}
          </p>
        ) : null}
        {shop?.phone ? <p className="text-[11px] text-ink-700/75">Tel {shop.phone}</p> : null}
        {shop?.tax_number ? <p className="text-[11px] text-ink-700/75">NTN {shop.tax_number}</p> : null}
      </header>

      <div className="receipt-rule" />
      <div className={wide ? "grid grid-cols-2 gap-x-8 gap-y-1" : "space-y-0.5"}>
        <Row label="Invoice no." value={sale.number} />
        {when(sale) ? <Row label="Date" value={when(sale)} /> : null}
        {invoice?.show_cashier_name !== false && sale.cashier_name ? (
          <Row label="Cashier" value={sale.cashier_name} />
        ) : null}
        <Row label="Customer" value={sale.customer_name || "Walk-in"} />
        {sale.branch_name ? <Row label="Branch" value={sale.branch_name} /> : null}
        <Row label="Payment" value={method} />
      </div>

      <div className="receipt-rule" />
      {lines.length === 0 ? (
        <p className="py-3 text-center text-xs text-ink-700/70">No items on this slip.</p>
      ) : wide ? (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-ink-950/20 text-[10px] uppercase tracking-wide text-ink-700/60">
              <th className="pb-1.5 font-semibold">Item</th>
              <th className="pb-1.5 text-right font-semibold">Qty</th>
              <th className="pb-1.5 text-right font-semibold">Rate</th>
              <th className="pb-1.5 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={line.id || `${line.sku}-${i}`} className="border-b border-ink-950/10">
                <td className="py-1.5 pr-3 align-top">
                  <span className="block font-medium text-ink-950">{line.product_name}</span>
                  {line.variant_name && line.variant_name !== line.product_name ? (
                    <span className="block text-[10px] text-ink-700/60">{line.variant_name}</span>
                  ) : null}
                  {line.sku ? <span className="block text-[10px] text-ink-700/55">{line.sku}</span> : null}
                </td>
                <td className="py-1.5 text-right align-top tabular-nums">{fmtQty(line.quantity)}</td>
                <td className="py-1.5 text-right align-top tabular-nums">{rs(line.promo_price || line.unit_price)}</td>
                <td className="py-1.5 text-right align-top font-medium tabular-nums">{rs(line.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>
          <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wide text-ink-700/55">
            <span>Item</span>
            <span>Amount</span>
          </div>
          {lines.map((line, i) => {
            const unit = num(line.promo_price || line.unit_price);
            return (
              <div key={line.id || `${line.sku}-${i}`} className="border-b border-dashed border-ink-950/15 py-1.5">
                <p className="text-xs font-medium leading-snug text-ink-950">{line.product_name}</p>
                {line.variant_name && line.variant_name !== line.product_name ? (
                  <p className="text-[10px] text-ink-700/60">{line.variant_name}</p>
                ) : null}
                <div className="mt-0.5 flex items-baseline justify-between gap-3 text-[11px]">
                  <span className="text-ink-700/70">
                    Qty {fmtQty(line.quantity)}
                    {unit > 0 ? ` × ${rs(unit)}` : ""}
                    {line.sku ? ` · ${line.sku}` : ""}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-ink-950">{rs(line.line_total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="receipt-rule" />
      <div className={wide ? "ml-auto w-72" : ""}>
        <Row label="Subtotal" value={rs(sale.subtotal || sale.total)} />
        {discount > 0 ? <Row label="Discount" value={`− ${rs(discount)}`} /> : null}
        <div className="my-1 border-t border-ink-950/20 pt-1">
          <Row label="Total" value={rs(total)} strong />
        </div>
        <Row label="Paid" value={rs(given)} />
        <Row label="Method" value={method} />
        {change > 0 ? <Row label="Change" value={rs(change)} /> : null}
        {due > 0 ? <Row label="Balance due" value={rs(due)} /> : null}
      </div>

      {invoice?.footer_note ? (
        <>
          <div className="receipt-rule" />
          <p className="text-center text-[11px] leading-snug text-ink-800">{invoice.footer_note}</p>
        </>
      ) : null}
      {invoice?.terms ? <p className="mt-2 text-center text-[10px] leading-snug text-ink-700/70">{invoice.terms}</p> : null}
    </article>
  );
}

function Meta({
  sale,
  invoice,
  method,
  hideNumber,
}: {
  sale: PosSale;
  invoice?: InvoiceSettings | null;
  method: string;
  hideNumber?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      {hideNumber ? null : <Row label="Invoice no." value={sale.number} />}
      {when(sale) && hideNumber ? null : when(sale) ? <Row label="Date" value={when(sale)} /> : null}
      {invoice?.show_cashier_name !== false && sale.cashier_name ? <Row label="Cashier" value={sale.cashier_name} /> : null}
      <Row label="Customer" value={sale.customer_name || "Walk-in"} />
      {sale.branch_name ? <Row label="Branch" value={sale.branch_name} /> : null}
      <Row label="Payment" value={method} />
    </div>
  );
}

function ItemList({
  lines,
  wide,
  compact,
}: {
  lines: NonNullable<PosSale["lines"]>;
  wide: boolean;
  compact?: boolean;
}) {
  if (lines.length === 0) {
    return <p className="py-3 text-center text-xs text-ink-700/70">No items on this slip.</p>;
  }
  if (!wide) {
    return (
      <div>
        {lines.map((line, i) => {
          const unit = num(line.promo_price || line.unit_price);
          return (
            <div key={line.id || `${line.sku}-${i}`} className="border-b border-dashed border-ink-950/15 py-1">
              <p className={`${compact ? "text-[11px]" : "text-xs"} font-medium leading-snug text-ink-950`}>{line.product_name}</p>
              <div className="flex items-baseline justify-between gap-2 text-[10px]">
                <span className="text-ink-700/70">
                  {fmtQty(line.quantity)}
                  {unit > 0 ? ` × ${rs(unit)}` : ""}
                </span>
                <span className="font-medium tabular-nums">{rs(line.line_total)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <table className="w-full border-collapse text-left text-xs">
      <thead>
        <tr className="border-b border-ink-950 text-[10px] uppercase tracking-wide">
          <th className="py-1 font-semibold">Item</th>
          <th className="py-1 text-right font-semibold">Qty</th>
          <th className="py-1 text-right font-semibold">Rate</th>
          <th className="py-1 text-right font-semibold">Amount</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line, i) => (
          <tr key={line.id || `${line.sku}-${i}`} className="border-b border-ink-950/10">
            <td className="py-1.5 pr-2">
              <span className="block font-medium">{line.product_name}</span>
              {line.variant_name && line.variant_name !== line.product_name ? (
                <span className="block text-[10px] text-ink-700/60">{line.variant_name}</span>
              ) : null}
            </td>
            <td className="py-1.5 text-right tabular-nums">{fmtQty(line.quantity)}</td>
            <td className="py-1.5 text-right tabular-nums">{rs(line.promo_price || line.unit_price)}</td>
            <td className="py-1.5 text-right font-medium tabular-nums">{rs(line.line_total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Totals({
  sale,
  discount,
  given,
  change,
  due,
  method,
  hideTotal,
}: {
  sale: PosSale;
  discount: number;
  given: number;
  change: number;
  due: number;
  method: string;
  hideTotal?: boolean;
}) {
  const total = num(sale.net_total || sale.total);
  return (
    <div>
      <Row label="Subtotal" value={rs(sale.subtotal || sale.total)} />
      {discount > 0 ? <Row label="Discount" value={`− ${rs(discount)}`} /> : null}
      {hideTotal ? null : (
        <div className="my-1 border-t border-ink-950/20 pt-1">
          <Row label="Total" value={rs(total)} strong />
        </div>
      )}
      <Row label="Paid" value={rs(given)} />
      <Row label="Method" value={method} />
      {change > 0 ? <Row label="Change" value={rs(change)} /> : null}
      {due > 0 ? <Row label="Balance due" value={rs(due)} /> : null}
    </div>
  );
}

function Footer({ invoice }: { invoice?: InvoiceSettings | null }) {
  if (!invoice?.footer_note && !invoice?.terms) return null;
  return (
    <div>
      {invoice.footer_note ? (
        <>
          <div className="receipt-rule" />
          <p className="text-center text-[11px] leading-snug text-ink-800">{invoice.footer_note}</p>
        </>
      ) : null}
      {invoice.terms ? <p className="mt-2 text-center text-[10px] leading-snug text-ink-700/70">{invoice.terms}</p> : null}
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
  const [design, setDesign] = useState<InvoiceDesign>(designOf(invoice));
  const printed = { ...(invoice || {}), design } as InvoiceSettings;
  const wide = printed.paper_size === "A4" || design === "formal";

  useEffect(() => {
    if (open) setDesign(designOf(invoice));
  }, [open, invoice]);

  useEffect(() => {
    if (!open || !sale || !autoPrint) return;
    const tick = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(tick);
  }, [open, sale, autoPrint]);

  if (!open || !sale) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-ink-950/50 p-0 sm:items-start sm:p-4">
      <div
        className={`flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white sm:mt-8 sm:rounded-2xl ${
          wide ? "sm:max-w-[min(52rem,calc(100vw-2rem))]" : "sm:max-w-[min(28rem,calc(100vw-2rem))]"
        }`}
      >
        <div className="receipt-no-print flex items-center justify-between gap-3 border-b border-paper-200 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-copper-600">Customer slip</p>
            <p className="font-medium text-ink-950">{sale.number}</p>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 px-1 text-sm text-ink-700/70 hover:text-ink-950">
            Close
          </button>
        </div>
        <div className="receipt-no-print flex flex-wrap gap-2 border-b border-paper-200 px-4 py-3">
          {INVOICE_DESIGNS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDesign(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                design === item.id ? "bg-ink-950 text-paper-50" : "bg-paper-100 text-ink-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-paper-50 px-3 py-4">
          <div id="receipt-print-root" className="mx-auto">
            <ReceiptSlip sale={sale} shop={shop} invoice={printed} tendered={tendered} />
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
