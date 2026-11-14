"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { api, asList } from "@/lib/api";
import { rs } from "@/lib/money";
import { CarSaleInvoice, type CarInvoiceData } from "@/components/showroom/CarSaleInvoice";
import { useAuth } from "@/lib/auth";

type Sale = {
  id: string;
  car_display: string;
  customer_name: string;
  sale_date: string;
  final_amount: string;
  remaining_amount: string;
  profit: string;
  payment_method: string;
  selling_price: string;
  discount: string;
  received_amount: string;
  // expanded
  car?: {
    id: string; display_name: string; brand_name: string; model: string;
    variant: string; model_year: number; color: string;
    registration_number: string; chassis_number: string; engine_number: string;
    engine_cc: number; fuel_type_name: string; transmission_name: string; mileage_km: number;
  };
  customer?: { id: string; name: string; phone: string; cnic: string; address: string };
  notes?: string;
};

export default function SalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<CarInvoiceData | null>(null);

  useEffect(() => {
    api("/api/showroom/car-sales/")
      .then((d) => setSales(asList(d as any)))
      .catch(() => setSales([]))
      .finally(() => setLoading(false));
  }, []);

  async function openInvoice(sale: Sale) {
    // Fetch full detail with car + customer
    try {
      const full = await api<Sale>(`/api/showroom/car-sales/${sale.id}/`);
      // Also fetch car detail
      const car = full.car || (await api<Sale["car"]>(`/api/showroom/cars/${(full as any).car}/`));
      const customer = full.customer || (await api<Sale["customer"]>(`/api/showroom/showroom-customers/${(full as any).customer}/`));

      const data: CarInvoiceData = {
        invoice_number: `INV-${full.id.toString().slice(0, 8).toUpperCase()}`,
        sale_date: full.sale_date,
        shop_name: user?.business_name || "Car Showroom",
        shop_phone: "",
        shop_address: "",
        customer_name: (customer as any)?.name || full.customer_name,
        customer_phone: (customer as any)?.phone || "",
        customer_cnic: (customer as any)?.cnic || "",
        customer_address: (customer as any)?.address || "",
        car_brand: (car as any)?.brand_name || "",
        car_model: (car as any)?.model || full.car_display,
        car_variant: (car as any)?.variant || "",
        car_year: (car as any)?.model_year || 0,
        car_color: (car as any)?.color || "",
        registration_number: (car as any)?.registration_number || "",
        chassis_number: (car as any)?.chassis_number || "",
        engine_number: (car as any)?.engine_number || "",
        engine_cc: (car as any)?.engine_cc || 0,
        fuel_type: (car as any)?.fuel_type_name || "",
        transmission: (car as any)?.transmission_name || "",
        mileage_km: (car as any)?.mileage_km || 0,
        selling_price: parseFloat(full.selling_price || "0"),
        discount: parseFloat(full.discount || "0"),
        final_amount: parseFloat(full.final_amount || "0"),
        received_amount: parseFloat(full.received_amount || "0"),
        remaining_amount: parseFloat(full.remaining_amount || "0"),
        payment_method: full.payment_method,
        notes: full.notes || "",
      };
      setInvoice(data);
    } catch {
      alert("Could not load invoice details.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Invoice modal */}
      {invoice ? (
        <CarSaleInvoice data={invoice} onClose={() => setInvoice(null)} />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Showroom</p>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Car Sales</h1>
        </div>
        <Link
          href="/showroom/sales/new"
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <Plus size={16} /> New Sale
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="px-5 py-8 text-slate-400">Loading…</p>
        ) : sales.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-slate-400">No sales yet.</p>
            <Link href="/showroom/sales/new" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">Record first sale</Link>
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Car</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Remaining</th>
                <th className="px-5 py-3">Profit</th>
                <th className="px-5 py-3">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{s.car_display}</td>
                  <td className="px-5 py-3 text-slate-600">{s.customer_name}</td>
                  <td className="px-5 py-3 text-slate-500">{s.sale_date}</td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{rs(parseFloat(s.final_amount || "0"))}</td>
                  <td className="px-5 py-3">
                    <span className={parseFloat(s.remaining_amount) > 0 ? "font-medium text-red-600" : "text-emerald-600"}>
                      {parseFloat(s.remaining_amount) > 0 ? rs(parseFloat(s.remaining_amount)) : "Paid ✓"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={parseFloat(s.profit) >= 0 ? "text-emerald-600" : "text-red-600"}>
                      {parseFloat(s.profit) >= 0 ? "+" : ""}{rs(parseFloat(s.profit || "0"))}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => openInvoice(s)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <FileText size={13} />
                      View / Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
