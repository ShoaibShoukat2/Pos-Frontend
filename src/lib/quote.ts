import { num } from "./money";
import type { PosCatalogItem, PosCustomer, PosSnapshot, Promotion } from "./types";

export type CartLine = { item: PosCatalogItem; qty: number };

function matches(promo: Promotion, item: PosCatalogItem) {
  if (promo.variant) return promo.variant === item.id;
  if (promo.product) return promo.product === item.product_id;
  if (promo.category) return promo.category === item.category_id;
  return true;
}

function unitAfterPromo(list: number, promo: Promotion) {
  if (promo.kind === "price") return Math.max(0, num(promo.value));
  if (promo.kind === "percent") return Math.max(0, list * (1 - num(promo.value) / 100));
  if (promo.kind === "fixed") return Math.max(0, list - num(promo.value));
  return list;
}

export function quoteCart(
  lines: CartLine[],
  snapshot: PosSnapshot,
  opts: {
    couponCode?: string;
    customer?: PosCustomer | null;
    manualKind?: string;
    manualValue?: number;
    redeemPoints?: number;
  },
) {
  const priced = lines.map((line) => {
    const list = num(line.item.selling_price);
    let unit = list;
    let promoName = "";
    let free = 0;
    for (const promo of snapshot.promotions.filter((p) => p.is_active && matches(p, line.item))) {
      if (promo.kind === "bogo") {
        const cycle = num(promo.buy_qty) + num(promo.get_qty);
        if (cycle > 0) {
          const nextFree = Math.floor(line.qty / cycle) * num(promo.get_qty);
          if (nextFree >= free) {
            free = nextFree;
            promoName = promo.name;
          }
        }
        continue;
      }
      const next = unitAfterPromo(list, promo);
      if (next < unit) {
        unit = next;
        promoName = promo.name;
      }
    }
    const lineTotal = (line.qty - free) * unit;
    return { ...line, list, unit, free, lineTotal, promoName };
  });

  const subtotal = priced.reduce((sum, row) => sum + row.lineTotal, 0);
  const coupon = snapshot.coupons.find((c) => c.is_active && c.code.toLowerCase() === (opts.couponCode || "").trim().toLowerCase());
  let couponDisc = 0;
  if (coupon && subtotal >= num(coupon.min_spend)) {
    couponDisc = coupon.kind === "percent" ? subtotal * (num(coupon.value) / 100) : num(coupon.value);
    if (num(coupon.max_discount) > 0) couponDisc = Math.min(couponDisc, num(coupon.max_discount));
    couponDisc = Math.min(couponDisc, subtotal);
  }

  const memberPct = num(opts.customer?.membership_discount);
  const memberDisc = Math.min(subtotal - couponDisc, ((subtotal - couponDisc) * memberPct) / 100);

  let remaining = Math.max(0, subtotal - couponDisc - memberDisc);
  let manualDisc = 0;
  if (opts.manualKind === "percent") manualDisc = remaining * ((opts.manualValue || 0) / 100);
  if (opts.manualKind === "fixed") manualDisc = Math.min(opts.manualValue || 0, remaining);
  remaining = Math.max(0, remaining - manualDisc);

  const rate = num(snapshot.loyalty.redemption_rate) || 1;
  const redeemPts = Math.min(opts.redeemPoints || 0, num(opts.customer?.loyalty_points));
  let pointsDisc = Math.min(redeemPts * rate, remaining);
  const usedPoints = rate ? pointsDisc / rate : 0;
  const total = Math.max(0, remaining - pointsDisc);
  const earn =
    opts.customer && snapshot.loyalty.is_active && num(snapshot.loyalty.points_per_amount) > 0
      ? Math.floor(total / num(snapshot.loyalty.points_per_amount))
      : 0;

  return {
    priced,
    subtotal,
    couponDisc,
    memberDisc,
    manualDisc,
    pointsDisc,
    usedPoints,
    discountTotal: couponDisc + memberDisc + manualDisc + pointsDisc,
    total,
    earn,
    coupon,
  };
}
