import { money } from "./money";
import type { PosCatalogItem, PosCustomer, PosSnapshot, Promotion } from "./types";

export type CartLine = { item: PosCatalogItem; qty: number };

function matchesPromo(promo: Promotion, item: PosCatalogItem): boolean {
  if (promo.variant) return promo.variant === item.id;
  if (promo.product) return promo.product === item.product_id;
  if (promo.category) return promo.category === item.category_id;
  return true; // global promo
}

function unitAfterPromo(listPrice: number, promo: Promotion): number {
  const val = parseFloat(promo.value);
  if (promo.kind === "price") return Math.max(0, money(val));
  if (promo.kind === "percent") return money(listPrice * (1 - val / 100));
  if (promo.kind === "fixed") return Math.max(0, money(listPrice - val));
  return listPrice;
}

function isPromoActive(promo: Promotion, now: Date): boolean {
  if (promo.starts_at && new Date(promo.starts_at) > now) return false;
  if (promo.ends_at && new Date(promo.ends_at) < now) return false;
  return promo.is_active;
}

export function quoteCart(
  lines: CartLine[],
  snapshot: PosSnapshot,
  opts: {
    customer?: PosCustomer | null;
    manualKind?: string;
    manualValue?: number;
  },
) {
  const now = new Date();
  const activePromos = (snapshot.promotions || []).filter((p) => isPromoActive(p, now));

  const priced = lines.map((line) => {
    const list = money(parseFloat(line.item.selling_price));
    let unit = list;
    let promoName = "";
    let free = 0;

    for (const promo of activePromos) {
      if (!matchesPromo(promo, line.item)) continue;

      if (promo.kind === "bogo") {
        const buyQty = parseFloat(promo.buy_qty);
        const getQty = parseFloat(promo.get_qty);
        const cycle = buyQty + getQty;
        if (cycle > 0) {
          const freeFromPromo = Math.floor(line.qty / cycle) * getQty;
          if (freeFromPromo > free) {
            free = freeFromPromo;
            promoName = promo.name;
          }
        }
        continue;
      }

      const nextUnit = unitAfterPromo(list, promo);
      if (nextUnit < unit) {
        unit = nextUnit;
        promoName = promo.name;
      }
    }

    const paidQty = line.qty - free;
    const lineTotal = money(paidQty * unit);
    return { ...line, list, unit, free, lineTotal, promoName };
  });

  const subtotal = money(priced.reduce((sum, row) => sum + row.lineTotal, 0));

  // Manual discount
  let manualDisc = 0;
  if (opts.manualKind === "percent") {
    manualDisc = money(subtotal * ((opts.manualValue || 0) / 100));
  } else if (opts.manualKind === "fixed") {
    manualDisc = money(Math.min(opts.manualValue || 0, subtotal));
  }

  const discountTotal = money(manualDisc);
  const total = money(Math.max(0, subtotal - discountTotal));

  return {
    priced,
    subtotal,
    manualDisc,
    discountTotal,
    total,
  };
}
