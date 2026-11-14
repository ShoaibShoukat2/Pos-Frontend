"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Car,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Truck,
  Users,
  Plus,
} from "lucide-react";

import { CarSaleInvoice, type CarInvoiceData } from "@/components/showroom/CarSaleInvoice";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function rs(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return `Rs ${n.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

type Dashboard = {
  total_cars: number;
  available: number;
  reserved: number;
  sold: number;
  total_investment: string;
  total_sales_revenue: string;
  total_expenses: string;
  total_profit: string;
  customer_dues: string;
  seller_dues: string;
  cash_received?: string;
  dues_count?: number;
  unsigned_invoices?: number;
  today_sales?: string;
  today_count?: number;
  month_sales?: string;
  month_profit?: string;
  month_count?: number;
  stock_value?: string;
  stock_cost?: string;
  monthly?: { label: string; sales: string; count: number }[];
  recent_sales: {
    id: string; invoice_number?: string; car: string; customer: string;
    amount: string; remaining?: string; date: string; profit: string; signed?: boolean;
  }[];
  available_cars: {
    id: string; name: string; color: string;
    year: number; price: string; mileage: number;
  }[];
};

function sampleInvoice(shopName?: string, cashier?: string): CarInvoiceData {
  const today = new Date().toISOString().slice(0, 10);
  return {
    invoice_number: "SR-SAMPLE",
    sale_date: today,
    shop_name: shopName || "Car Showroom",
    customer_name: "Customer name",
    customer_phone: "0300-0000000",
    customer_cnic: "35202-0000000-1",
    customer_address: "Customer address",
    car_brand: "Toyota",
    car_model: "Corolla",
    car_variant: "Altis",
    car_year: 2020,
    car_color: "White",
    registration_number: "LEA-0000",
    chassis_number: "CHS-000000",
    engine_number: "ENG-000000",
    engine_cc: 1800,
    fuel_type: "Petrol",
    transmission: "Automatic",
    mileage_km: 45000,
    selling_price: 4500000,
    discount: 0,
    final_amount: 4500000,
    received_amount: 1500000,
    remaining_amount: 3000000,
    payment_method: "cash",
    cashier_name: cashier || "",
    notes: "Sample invoice. A real sale uses the same design.",
  };
}

export default function ShowroomDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Dashboard>("/api/showroom/dashboard/")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const profit = parseFloat(data?.total_profit || "0");
  const monthBars = data?.monthly || [];
  const peak = Math.max(1, ...monthBars.map((row) => parseFloat(row.sales || "0")));
  const todayLabel = new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Car Showroom
          </p>
          <h1 className="font-display text-xl font-semibold text-slate-900 sm:text-2xl">
            {user?.business_name || "Dashboard"}
          </h1>
          {loading ? <p className="text-xs text-slate-400">Loading showroom numbers…</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/showroom/pos"
            className="btn btn-primary flex-1 text-center text-sm sm:flex-none"
          >
            Sale Counter
          </Link>
          <Link
            href="/showroom/inventory/new"
            className="btn btn-ghost flex-1 text-center text-sm sm:flex-none"
          >
            <Plus size={15} />
            Add Car
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Printer</p>
          <h2 className="font-display text-lg font-semibold text-slate-900">Invoice design</h2>
          <p className="text-sm text-slate-500">
            Customer photo, thumb impression and signatures print on this invoice. Connect the printer, then print.
          </p>
        </div>
        <CarSaleInvoice embedded data={sampleInvoice(user?.business_name, user?.full_name)} />
      </section>

      <section className="overflow-hidden rounded-2xl bg-slate-900 text-white shadow-sm">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">{todayLabel}</p>
            <p className="mt-3 text-sm text-white/60">This month</p>
            <p className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{rs(data?.month_sales ?? 0)}</p>
            <p className="mt-2 text-sm text-white/70">
              {data?.month_count ?? 0} cars sold · profit {rs(data?.month_profit ?? 0)} · today {rs(data?.today_sales ?? 0)}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <HeroStat label="Received" value={rs(data?.cash_received ?? 0)} />
            <HeroStat label="Stock value" value={rs(data?.stock_value ?? 0)} />
            <HeroStat label="Dues" value={rs(data?.customer_dues ?? 0)} />
          </div>
        </div>
        {(data?.unsigned_invoices || data?.dues_count) ? (
          <div className="flex flex-wrap gap-2 border-t border-white/10 px-5 py-3 text-xs sm:px-6">
            {data?.unsigned_invoices ? (
              <Link href="/showroom/sales" className="rounded-full bg-amber-400/15 px-3 py-1 font-medium text-amber-200">
                {data.unsigned_invoices} invoice{data.unsigned_invoices === 1 ? "" : "s"} waiting for a signature
              </Link>
            ) : null}
            {data?.dues_count ? (
              <Link href="/showroom/payments" className="rounded-full bg-red-400/15 px-3 py-1 font-medium text-red-200">
                {data.dues_count} balance{data.dues_count === 1 ? "" : "s"} still open
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>

      {monthBars.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sales</p>
              <h2 className="font-semibold text-slate-900">Last 6 months</h2>
            </div>
            <Link href="/showroom/reports" className="text-xs font-medium text-indigo-600">Reports</Link>
          </div>
          <div className="grid h-36 grid-cols-6 items-end gap-2">
            {monthBars.map((row) => {
              const amount = parseFloat(row.sales || "0");
              const height = Math.max(8, Math.round((amount / peak) * 100));
              return (
                <div key={row.label} className="flex h-full flex-col justify-end gap-2">
                  <div className="flex flex-1 items-end">
                    <div
                      className="w-full rounded-t-lg bg-indigo-600"
                      style={{ height: `${height}%` }}
                      title={`${row.label}: ${rs(amount)}`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-medium text-slate-500">{row.label}</p>
                    <p className="text-[10px] text-slate-400">{row.count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ── Car status — 2 cols mobile, 4 cols desktop ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatusCard
          icon={CheckCircle}
          label="Available"
          value={data?.available ?? 0}
          color="emerald"
        />
        <StatusCard
          icon={Clock}
          label="Reserved"
          value={data?.reserved ?? 0}
          color="amber"
        />
        <StatusCard
          icon={Car}
          label="Sold"
          value={data?.sold ?? 0}
          color="slate"
        />
        <StatusCard
          icon={Car}
          label="Total Cars"
          value={data?.total_cars ?? 0}
          color="indigo"
        />
      </div>

      {/* ── Financial KPIs — 1 col mobile, 2 col sm, 3 col lg ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          icon={TrendingUp}
          label="Total Sales"
          value={rs(data?.total_sales_revenue ?? 0)}
          color="indigo"
        />
        <KpiCard
          icon={Car}
          label="Total Investment"
          value={rs(data?.total_investment ?? 0)}
          color="slate"
        />
        <KpiCard
          icon={profit >= 0 ? TrendingUp : TrendingDown}
          label="Profit after expenses"
          value={rs(data?.total_profit ?? 0)}
          color={profit >= 0 ? "emerald" : "red"}
        />
        <KpiCard
          icon={AlertCircle}
          label="Total Expenses"
          value={rs(data?.total_expenses ?? 0)}
          color="amber"
        />
        <KpiCard
          icon={Users}
          label="Customer Dues"
          value={rs(data?.customer_dues ?? 0)}
          color="red"
        />
        <KpiCard
          icon={Truck}
          label="Seller Dues"
          value={rs(data?.seller_dues ?? 0)}
          color="amber"
        />
      </div>

      {/* ── Recent sales + Available cars — stack on mobile, side by side on lg ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Recent Sales */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5">
            <h2 className="font-semibold text-slate-900">Recent Sales</h2>
            <Link
              href="/showroom/sales"
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {!data?.recent_sales.length ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              No sales yet.{" "}
              <Link href="/showroom/pos" className="text-indigo-600 underline">
                Make first sale
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recent_sales.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/showroom/sales?invoice=${row.id}`}
                    className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-slate-50 sm:px-5"
                  >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {row.car}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {row.invoice_number ? `${row.invoice_number} · ` : ""}{row.customer} · {row.date}
                      {row.signed ? "" : " · signature pending"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {rs(row.amount)}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        parseFloat(row.profit) >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {parseFloat(row.profit) >= 0 ? "+" : ""}
                      {rs(row.profit)}
                    </p>
                  </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Available Cars */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5">
            <h2 className="font-semibold text-slate-900">Available Cars</h2>
            <Link
              href="/showroom/inventory"
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {!data?.available_cars.length ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              No available cars.{" "}
              <Link
                href="/showroom/inventory/new"
                className="text-indigo-600 underline"
              >
                Add one
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.available_cars.map((car) => (
                <li key={car.id}>
                  <Link href={`/showroom/inventory/${car.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 sm:px-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                    <Car size={16} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {car.name}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {[
                        car.color,
                        car.mileage
                          ? `${car.mileage.toLocaleString()} km`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-sm font-semibold text-slate-900">
                    {rs(car.price)}
                  </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
          {[
            { href: "/showroom/inventory/new", label: "Add car" },
            { href: "/showroom/purchases/new", label: "Record purchase" },
            { href: "/showroom/pos",           label: "Sale counter" },
            { href: "/showroom/expenses/new",  label: "Add expense" },
            { href: "/showroom/customers/new", label: "New customer" },
            { href: "/showroom/sellers/new",   label: "New seller" },
            { href: "/showroom/reports",       label: "Reports" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-sm font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors lg:flex-none"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Helper components ─────────────────────────────────────────── */

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-1 font-display text-sm font-semibold leading-tight sm:text-base">{value}</p>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Car;
  label: string;
  value: number;
  color: "emerald" | "amber" | "slate" | "indigo";
}) {
  const styles = {
    emerald: { card: "border-emerald-200 bg-emerald-50", icon: "text-emerald-500", val: "text-emerald-700", lbl: "text-emerald-600" },
    amber:   { card: "border-amber-200 bg-amber-50",     icon: "text-amber-500",   val: "text-amber-700",   lbl: "text-amber-600" },
    slate:   { card: "border-slate-200 bg-white",        icon: "text-slate-400",   val: "text-slate-700",   lbl: "text-slate-500" },
    indigo:  { card: "border-indigo-200 bg-indigo-50",   icon: "text-indigo-500",  val: "text-indigo-700",  lbl: "text-indigo-600" },
  };
  const s = styles[color];
  return (
    <div className={`rounded-2xl border p-4 text-center ${s.card}`}>
      <Icon size={20} className={`mx-auto mb-1.5 ${s.icon}`} />
      <p className={`font-display text-2xl font-bold sm:text-3xl ${s.val}`}>{value}</p>
      <p className={`mt-0.5 text-xs font-medium ${s.lbl}`}>{label}</p>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Car;
  label: string;
  value: string;
  color: "indigo" | "emerald" | "red" | "amber" | "slate";
}) {
  const styles = {
    indigo:  { bg: "bg-indigo-50",  icon: "text-indigo-600",  val: "text-slate-900" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", val: "text-emerald-700" },
    red:     { bg: "bg-red-50",     icon: "text-red-500",     val: "text-red-700" },
    amber:   { bg: "bg-amber-50",   icon: "text-amber-600",   val: "text-amber-700" },
    slate:   { bg: "bg-slate-100",  icon: "text-slate-500",   val: "text-slate-700" },
  };
  const s = styles[color];
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
        <Icon size={18} className={s.icon} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <p className={`mt-0.5 font-display text-lg font-bold leading-tight sm:text-xl ${s.val}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
