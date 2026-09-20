import { money } from "./money";
import type { PosCatalogItem, PosCustomer, PosSnapshot } from "./types";

export type CartLine = { item: PosCatalogItem; qty: number };

export function quoteCart(
  lines: CartLine[],
  _snapshot: PosSnapshot,
  opts: {
    couponCode?: string;
    customer?: PosCustomer | null;
    manualKind?: string;
    manualValue?: number;
    redeemPoints?: number;
  },
) {
  const priced = lines.map((line) => {
    const list = money(line.item.selling_price);
    const unit = list;
    const lineTotal = money(line.qty * unit);
    return { ...line, list, unit, free: 0, lineTotal, promoName: "" };
  });

  const subtotal = money(priced.reduce((sum, row) => sum + row.lineTotal, 0));
  let remaining = subtotal;
  let manualDisc = 0;
  if (opts.manualKind === "percent") manualDisc = money(remaining * ((opts.manualValue || 0) / 100));
  if (opts.manualKind === "fixed") manualDisc = money(Math.min(opts.manualValue || 0, remaining));
  remaining = money(Math.max(0, remaining - manualDisc));

  return {
    priced,
    subtotal,
    couponDisc: 0,
    memberDisc: 0,
    manualDisc,
    pointsDisc: 0,
    usedPoints: 0,
    discountTotal: money(manualDisc),
    total: remaining,
    earn: 0,
    coupon: undefined,
  };
}
