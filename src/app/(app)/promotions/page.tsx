"use client";

import { FormEvent, useEffect, useState } from "react";

import { TableSkeleton } from "@/components/DataTable";
import { ProductPicker } from "@/components/VariantPicker";
import { Button, Empty, Field, Input, Modal, PageHeader, Select } from "@/components/ui";
import { api, asList } from "@/lib/api";
import type { Coupon, LoyaltySettings, MembershipTier, Promotion } from "@/lib/types";

export default function PromotionsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [openCoupon, setOpenCoupon] = useState(false);
  const [openPromo, setOpenPromo] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: "", kind: "percent", value: "10", min_spend: "0" });
  const [promoForm, setPromoForm] = useState({
    name: "",
    kind: "percent",
    value: "10",
    buy_qty: "1",
    get_qty: "1",
    product: "",
  });

  async function load() {
    const [c, p, t, l] = await Promise.all([
      api<Coupon[]>("/api/coupons/"),
      api<Promotion[]>("/api/promotions/"),
      api<MembershipTier[]>("/api/membership-tiers/"),
      api<LoyaltySettings>("/api/loyalty-settings/"),
    ]);
    setCoupons(asList(c));
    setPromos(asList(p));
    setTiers(asList(t));
    setLoyalty(l);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function saveCoupon(e: FormEvent) {
    e.preventDefault();
    await api("/api/coupons/", { method: "POST", body: JSON.stringify(couponForm) });
    setOpenCoupon(false);
    await load();
  }

  async function savePromo(e: FormEvent) {
    e.preventDefault();
    await api("/api/promotions/", {
      method: "POST",
      body: JSON.stringify({ ...promoForm, product: promoForm.product || null }),
    });
    setOpenPromo(false);
    await load();
  }

  async function saveLoyalty(e: FormEvent) {
    e.preventDefault();
    if (!loyalty) return;
    await api("/api/loyalty-settings/", { method: "PUT", body: JSON.stringify(loyalty) });
    await load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Module 18"
        title="Loyalty & discounts"
        description="Coupons, promotional prices, Buy 1 Get 1, membership tiers and points."
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpenPromo(true)}>
              Add promotion
            </Button>
            <Button onClick={() => setOpenCoupon(true)}>Add coupon</Button>
          </div>
        }
      />

      {loading ? <TableSkeleton /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <h2 className="px-5 pt-5 font-display text-xl">Coupons</h2>
          {coupons.length === 0 ? (
            <div className="p-5">
              <Empty title="No coupons" hint="Create SAVE10 for 10% off." />
            </div>
          ) : (
            <table className="mt-3 w-full text-left text-sm">
              <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Used</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((row) => (
                  <tr key={row.id} className="border-t border-paper-100">
                    <td className="px-4 py-3 font-medium">{row.code}</td>
                    <td className="px-4 py-3">{row.kind}</td>
                    <td className="px-4 py-3">{row.value}</td>
                    <td className="px-4 py-3">{row.used_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card overflow-hidden">
          <h2 className="px-5 pt-5 font-display text-xl">Promotions</h2>
          {promos.length === 0 ? (
            <div className="p-5">
              <Empty title="No promotions" hint="Percentage, fixed, promo price or Buy 1 Get 1." />
            </div>
          ) : (
            <table className="mt-3 w-full text-left text-sm">
              <thead className="bg-paper-50 text-xs uppercase tracking-wide text-ink-700/60">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Kind</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Applies to</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((row) => (
                  <tr key={row.id} className="border-t border-paper-100">
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3">{row.kind}</td>
                    <td className="px-4 py-3">{row.kind === "bogo" ? `${row.buy_qty}+${row.get_qty}` : row.value}</td>
                    <td className="px-4 py-3">{row.product_name || row.category_name || row.variant_name || "All"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-display text-xl">Membership</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {tiers.map((tier) => (
              <li key={tier.id} className="flex justify-between border-b border-paper-100 pb-2">
                <span>
                  {tier.name} · from {tier.min_points} pts
                </span>
                <span>{tier.discount_percent}% off</span>
              </li>
            ))}
          </ul>
        </section>
        <form className="card space-y-3 p-5" onSubmit={saveLoyalty}>
          <h2 className="font-display text-xl">Points</h2>
          {loyalty ? (
            <>
              <Field label="1 point per amount (Rs)">
                <Input
                  value={loyalty.points_per_amount}
                  onChange={(e) => setLoyalty({ ...loyalty, points_per_amount: e.target.value })}
                />
              </Field>
              <Field label="Rupees per redeemed point">
                <Input
                  value={loyalty.redemption_rate}
                  onChange={(e) => setLoyalty({ ...loyalty, redemption_rate: e.target.value })}
                />
              </Field>
              <Button type="submit">Save loyalty</Button>
            </>
          ) : null}
        </form>
      </div>

      <Modal open={openCoupon} title="New coupon" onClose={() => setOpenCoupon(false)}>
        <form className="space-y-3" onSubmit={saveCoupon}>
          <Field label="Code">
            <Input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} />
          </Field>
          <Field label="Type">
            <Select value={couponForm.kind} onChange={(e) => setCouponForm({ ...couponForm, kind: e.target.value })}>
              <option value="percent">Percentage</option>
              <option value="fixed">Fixed</option>
            </Select>
          </Field>
          <Field label="Value">
            <Input value={couponForm.value} onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })} />
          </Field>
          <Field label="Minimum spend">
            <Input value={couponForm.min_spend} onChange={(e) => setCouponForm({ ...couponForm, min_spend: e.target.value })} />
          </Field>
          <Button type="submit">Create coupon</Button>
        </form>
      </Modal>

      <Modal open={openPromo} title="New promotion" onClose={() => setOpenPromo(false)}>
        <form className="space-y-3" onSubmit={savePromo}>
          <Field label="Name">
            <Input value={promoForm.name} onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })} />
          </Field>
          <Field label="Kind">
            <Select value={promoForm.kind} onChange={(e) => setPromoForm({ ...promoForm, kind: e.target.value })}>
              <option value="percent">Percentage off</option>
              <option value="fixed">Fixed off</option>
              <option value="price">Promotional price</option>
              <option value="bogo">Buy 1 Get 1</option>
            </Select>
          </Field>
          {promoForm.kind === "bogo" ? (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Buy">
                <Input value={promoForm.buy_qty} onChange={(e) => setPromoForm({ ...promoForm, buy_qty: e.target.value })} />
              </Field>
              <Field label="Get free">
                <Input value={promoForm.get_qty} onChange={(e) => setPromoForm({ ...promoForm, get_qty: e.target.value })} />
              </Field>
            </div>
          ) : (
            <Field label="Value">
              <Input value={promoForm.value} onChange={(e) => setPromoForm({ ...promoForm, value: e.target.value })} />
            </Field>
          )}
          <Field label="Product (optional)">
            <ProductPicker value={promoForm.product} onChange={(product) => setPromoForm({ ...promoForm, product })} />
          </Field>
          <Button type="submit">Create promotion</Button>
        </form>
      </Modal>
    </div>
  );
}
