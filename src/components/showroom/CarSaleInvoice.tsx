"use client";

import { useRef } from "react";
import { Printer } from "lucide-react";

export type CarInvoiceData = {
  invoice_number: string;
  sale_date: string;
  // Shop
  shop_name: string;
  shop_address?: string;
  shop_phone?: string;
  shop_ntn?: string;
  // Customer
  customer_name: string;
  customer_phone?: string;
  customer_cnic?: string;
  customer_address?: string;
  // Car details
  car_brand: string;
  car_model: string;
  car_variant?: string;
  car_year: number;
  car_color?: string;
  registration_number?: string;
  chassis_number?: string;
  engine_number?: string;
  engine_cc?: number;
  fuel_type?: string;
  transmission?: string;
  mileage_km?: number;
  // Financial
  selling_price: number;
  discount: number;
  final_amount: number;
  received_amount: number;
  remaining_amount: number;
  payment_method: string;
  // Optional
  notes?: string;
  cashier_name?: string;
};

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  bank: "Bank Transfer",
  card: "Card",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
};

function rs(v: number) {
  return `Rs ${v.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function CarSaleInvoice({ data, onClose }: { data: CarInvoiceData; onClose?: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  function print() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[48rem]">
        {/* Toolbar — hidden on print */}
        <div className="invoice-no-print mb-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Sale Invoice</p>
            <p className="font-medium text-slate-900">{data.invoice_number}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={print}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              <Printer size={15} />
              Print Invoice
            </button>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            ) : null}
          </div>
        </div>

        {/* Invoice body */}
        <div id="car-invoice-print-root" ref={printRef} className="rounded-2xl border border-slate-200 bg-white shadow-lg">

          {/* Header */}
          <div className="border-b-2 border-slate-900 px-8 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold text-slate-900">{data.shop_name}</h1>
                {data.shop_address ? <p className="mt-1 text-sm text-slate-500">{data.shop_address}</p> : null}
                {data.shop_phone ? <p className="text-sm text-slate-500">Tel: {data.shop_phone}</p> : null}
                {data.shop_ntn ? <p className="text-sm text-slate-500">NTN: {data.shop_ntn}</p> : null}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sale Invoice</p>
                <p className="mt-1 font-display text-2xl font-bold text-slate-900">{data.invoice_number}</p>
                <p className="mt-1 text-sm text-slate-500">{data.sale_date}</p>
                {data.cashier_name ? <p className="text-xs text-slate-400">Processed by: {data.cashier_name}</p> : null}
              </div>
            </div>
          </div>

          {/* Customer + Car in two columns */}
          <div className="grid grid-cols-2 gap-0 border-b border-slate-200">
            {/* Customer */}
            <div className="border-r border-slate-200 px-8 py-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Customer Details</p>
              <table className="w-full text-sm">
                <tbody className="space-y-1">
                  <InfoRow label="Name" value={data.customer_name} />
                  {data.customer_phone ? <InfoRow label="Phone" value={data.customer_phone} /> : null}
                  {data.customer_cnic ? <InfoRow label="CNIC" value={data.customer_cnic} /> : null}
                  {data.customer_address ? <InfoRow label="Address" value={data.customer_address} /> : null}
                </tbody>
              </table>
            </div>
            {/* Vehicle */}
            <div className="px-8 py-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Vehicle Details</p>
              <table className="w-full text-sm">
                <tbody>
                  <InfoRow label="Make / Model" value={`${data.car_brand} ${data.car_model}${data.car_variant ? ` ${data.car_variant}` : ""}`} />
                  <InfoRow label="Year" value={String(data.car_year)} />
                  {data.car_color ? <InfoRow label="Color" value={data.car_color} /> : null}
                  {data.registration_number ? <InfoRow label="Reg. No." value={data.registration_number} /> : null}
                  {data.chassis_number ? <InfoRow label="Chassis No." value={data.chassis_number} /> : null}
                  {data.engine_number ? <InfoRow label="Engine No." value={data.engine_number} /> : null}
                  {data.engine_cc ? <InfoRow label="Engine CC" value={`${data.engine_cc} cc`} /> : null}
                  {data.fuel_type ? <InfoRow label="Fuel Type" value={data.fuel_type} /> : null}
                  {data.transmission ? <InfoRow label="Transmission" value={data.transmission} /> : null}
                  {data.mileage_km ? <InfoRow label="Mileage" value={`${data.mileage_km.toLocaleString()} km`} /> : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial summary */}
          <div className="px-8 py-6">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Payment Summary</p>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50">
                    <td className="px-5 py-3 text-slate-500">Vehicle selling price</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-900">{rs(data.selling_price)}</td>
                  </tr>
                  {data.discount > 0 ? (
                    <tr>
                      <td className="px-5 py-3 text-slate-500">Discount</td>
                      <td className="px-5 py-3 text-right text-emerald-600">− {rs(data.discount)}</td>
                    </tr>
                  ) : null}
                  <tr className="bg-slate-900 text-white">
                    <td className="px-5 py-4 font-bold">Total Amount</td>
                    <td className="px-5 py-4 text-right font-display text-xl font-bold">{rs(data.final_amount)}</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 text-slate-500">
                      Amount received
                      <span className="ml-2 text-xs text-slate-400">({METHOD_LABEL[data.payment_method] || data.payment_method})</span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-emerald-600">{rs(data.received_amount)}</td>
                  </tr>
                  <tr className={data.remaining_amount > 0 ? "bg-red-50" : "bg-emerald-50"}>
                    <td className={`px-5 py-3 font-semibold ${data.remaining_amount > 0 ? "text-red-700" : "text-emerald-700"}`}>
                      {data.remaining_amount > 0 ? "Balance remaining" : "Fully paid"}
                    </td>
                    <td className={`px-5 py-3 text-right font-display text-lg font-bold ${data.remaining_amount > 0 ? "text-red-700" : "text-emerald-700"}`}>
                      {data.remaining_amount > 0 ? rs(data.remaining_amount) : "✓ Cleared"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {data.notes ? (
            <div className="border-t border-slate-100 px-8 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Notes</p>
              <p className="mt-2 text-sm text-slate-600">{data.notes}</p>
            </div>
          ) : null}

          {/* Signature section */}
          <div className="border-t-2 border-dashed border-slate-300 px-8 py-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="mb-2 h-12 border-b border-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Customer Signature</p>
                <p className="mt-1 text-sm text-slate-600">{data.customer_name}</p>
              </div>
              <div className="text-center">
                <div className="mb-2 h-12 border-b border-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Dealer Signature</p>
                <p className="mt-1 text-sm text-slate-600">{data.shop_name}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-8 py-4 text-center">
            <p className="text-xs text-slate-400">
              This is a computer-generated invoice. Thank you for your purchase from {data.shop_name}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-0.5 pr-3 text-slate-400 align-top">{label}</td>
      <td className="py-0.5 font-medium text-slate-900">{value}</td>
    </tr>
  );
}
