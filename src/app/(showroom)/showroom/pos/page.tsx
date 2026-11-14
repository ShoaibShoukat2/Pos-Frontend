"use client";

import { useEffect, useState } from "react";
import {
  Car, Check, ChevronDown, CreditCard,
  FileText, Search, User, X,
} from "lucide-react";
import { ApiError, api, asList, fieldErrors } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CarSaleInvoice, type CarInvoiceData } from "@/components/showroom/CarSaleInvoice";
import { invoiceFromSale } from "@/lib/showroomInvoice";

type CarItem = {
  id: string; display_name: string; brand_name: string; model: string;
  variant: string; model_year: number; color: string;
  registration_number: string; chassis_number: string; engine_number: string;
  engine_cc: number; fuel_type_name: string; transmission_name: string;
  mileage_km: number; selling_price: string; purchase_price: string; status: string;
};

type Customer = { id: string; name: string; phone: string; cnic: string; address: string };

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  bank: "Bank Transfer",
  card: "Card",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
};

function rs(v: number) {
  return `Rs ${v.toLocaleString("en-PK", { minimumFractionDigits: 0 })}`;
}

export default function ShowroomPOS() {
  const { user } = useAuth();

  // Data
  const [cars, setCars] = useState<CarItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Selection
  const [selectedCar, setSelectedCar] = useState<CarItem | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [carSearch, setCarSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCarList, setShowCarList] = useState(false);
  const [showCustomerList, setShowCustomerList] = useState(false);

  // Payment
  const [sellingPrice, setSellingPrice] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [received, setReceived] = useState("0");
  const [payMethod, setPayMethod] = useState("cash");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  // State
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [invoice, setInvoice] = useState<CarInvoiceData | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [carData, customerData] = await Promise.all([
          api("/api/showroom/cars/?status=available"),
          api("/api/showroom/showroom-customers/"),
        ]);
        if (!alive) return;
        let list = asList<CarItem>(carData as CarItem[] | { results: CarItem[] });
        const picked = new URLSearchParams(window.location.search).get("car");
        if (picked && !list.some((row) => row.id === picked)) {
          try {
            const one = await api<CarItem>(`/api/showroom/cars/${picked}/`);
            if (one.status !== "sold") list = [one, ...list];
          } catch {
            /* car may already be sold */
          }
        }
        if (!alive) return;
        setCars(list);
        setCustomers(asList<Customer>(customerData as Customer[] | { results: Customer[] }));
        const match = picked ? list.find((row) => row.id === picked) : undefined;
        if (match) {
          setSelectedCar(match);
          setSellingPrice(match.selling_price);
        }
      } catch {
        /* counter still opens; lists stay empty */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // When car is selected, prefill selling price
  function selectCar(car: CarItem) {
    setSelectedCar(car);
    setSellingPrice(car.selling_price);
    setShowCarList(false);
    setCarSearch("");
  }

  const finalAmount = Math.max(0, parseFloat(sellingPrice || "0") - parseFloat(discount || "0"));
  const remaining = Math.max(0, finalAmount - parseFloat(received || "0"));
  const profit = finalAmount - parseFloat(selectedCar?.purchase_price || "0");

  const filteredCars = cars.filter((c) =>
    !carSearch || c.display_name.toLowerCase().includes(carSearch.toLowerCase()) ||
    c.registration_number.toLowerCase().includes(carSearch.toLowerCase()) ||
    c.color.toLowerCase().includes(carSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter((c) =>
    !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone || "").includes(customerSearch)
  );

  async function completeSale() {
    if (!selectedCar) { setErrors({ car: "Select a car first." }); return; }
    if (!selectedCustomer) { setErrors({ customer: "Select a customer first." }); return; }
    if (finalAmount <= 0) { setErrors({ price: "Selling price must be greater than 0." }); return; }

    setPending(true);
    setErrors({});

    try {
      const sale = await api<any>("/api/showroom/car-sales/", {
        method: "POST",
        body: JSON.stringify({
          car: selectedCar.id,
          customer: selectedCustomer.id,
          sale_date: saleDate,
          selling_price: sellingPrice,
          discount: discount || "0",
          received_amount: received || "0",
          payment_method: payMethod,
          notes,
        }),
      });

      setInvoice(invoiceFromSale(sale, {
        name: user?.business_name || "Car Showroom",
        cashier: user?.full_name || "",
      }));

      // Remove sold car from list
      setCars((prev) => prev.filter((c) => c.id !== selectedCar.id));

    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
      else setErrors({ detail: "Could not complete sale." });
    } finally {
      setPending(false);
    }
  }

  function resetForm() {
    setSelectedCar(null);
    setSelectedCustomer(null);
    setSellingPrice("0");
    setDiscount("0");
    setReceived("0");
    setPayMethod("cash");
    setNotes("");
    setErrors({});
    setInvoice(null);
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Invoice modal */}
      {invoice ? (
        <CarSaleInvoice
          data={invoice}
          onClose={resetForm}
        />
      ) : null}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Car Showroom</p>
          <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">Sale Counter</h1>
          <p className="mt-0.5 text-sm text-slate-400">Select a car and customer, enter payment, complete sale.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
          <Car size={15} className="text-indigo-500" />
          {cars.length} available
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">

        {/* ── LEFT — Car + Customer selection ─────────────────────────── */}
        <div className="space-y-4">

          {/* Car selector */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">Select Car</p>
                {selectedCar ? (
                  <button type="button" onClick={() => setSelectedCar(null)} className="text-xs text-slate-400 hover:text-red-500">Clear</button>
                ) : null}
              </div>
            </div>
            <div className="p-4">
              {selectedCar ? (
                /* Selected car card */
                <div className="flex items-start gap-4 rounded-xl border-2 border-indigo-500 bg-indigo-50 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
                    <Car size={22} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-semibold text-slate-900">{selectedCar.display_name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                      {selectedCar.color ? <span>{selectedCar.color}</span> : null}
                      {selectedCar.registration_number ? <span>Reg: {selectedCar.registration_number}</span> : null}
                      {selectedCar.mileage_km ? <span>{selectedCar.mileage_km.toLocaleString()} km</span> : null}
                      {selectedCar.fuel_type_name ? <span>{selectedCar.fuel_type_name}</span> : null}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-xl font-bold text-indigo-700">{rs(parseFloat(selectedCar.selling_price))}</p>
                    <p className="text-xs text-slate-400">Listed price</p>
                  </div>
                </div>
              ) : (
                /* Search + list */
                <div>
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={carSearch}
                      onChange={(e) => { setCarSearch(e.target.value); setShowCarList(true); }}
                      onFocus={() => setShowCarList(true)}
                      placeholder="Search by name, reg. no., color…"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>
                  {errors.car ? <p className="mt-1 text-xs text-red-600">{errors.car}</p> : null}
                  <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200">
                    {filteredCars.length === 0 ? (
                      <p className="p-4 text-sm text-slate-400">No available cars.</p>
                    ) : (
                      filteredCars.map((car) => (
                        <button
                          key={car.id}
                          type="button"
                          onClick={() => selectCar(car)}
                          className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-indigo-50 transition-colors"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                            <Car size={16} className="text-indigo-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">{car.display_name}</p>
                            <p className="text-xs text-slate-400">
                              {[car.color, car.registration_number, car.mileage_km ? `${car.mileage_km.toLocaleString()} km` : ""].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <p className="shrink-0 font-display text-sm font-semibold text-slate-900">{rs(parseFloat(car.selling_price))}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer selector */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">Select Customer</p>
                {selectedCustomer ? (
                  <button type="button" onClick={() => setSelectedCustomer(null)} className="text-xs text-slate-400 hover:text-red-500">Clear</button>
                ) : null}
              </div>
            </div>
            <div className="p-4">
              {selectedCustomer ? (
                <div className="flex items-center gap-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600">
                    <User size={18} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{selectedCustomer.name}</p>
                    <p className="text-xs text-slate-500">
                      {[selectedCustomer.phone, selectedCustomer.cnic].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <Check size={18} className="ml-auto shrink-0 text-emerald-600" />
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search by name or phone…"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>
                  {errors.customer ? <p className="mt-1 text-xs text-red-600">{errors.customer}</p> : null}
                  <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-200">
                    {filteredCustomers.length === 0 ? (
                      <p className="p-4 text-sm text-slate-400">No customers found. <a href="/showroom/customers/new" className="text-indigo-600 underline">Add one</a></p>
                    ) : filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left last:border-b-0 hover:bg-slate-50"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <User size={14} className="text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.phone || "No phone"}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Car details panel (shown when car selected) */}
          {selectedCar ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Vehicle Specs</p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                {[
                  { label: "Reg. No.", value: selectedCar.registration_number },
                  { label: "Chassis", value: selectedCar.chassis_number },
                  { label: "Engine No.", value: selectedCar.engine_number },
                  { label: "Engine CC", value: selectedCar.engine_cc ? `${selectedCar.engine_cc} cc` : null },
                  { label: "Fuel", value: selectedCar.fuel_type_name },
                  { label: "Transmission", value: selectedCar.transmission_name },
                  { label: "Mileage", value: selectedCar.mileage_km ? `${selectedCar.mileage_km.toLocaleString()} km` : null },
                  { label: "Color", value: selectedCar.color },
                  { label: "Year", value: String(selectedCar.model_year) },
                ].filter((r) => r.value).map((r) => (
                  <div key={r.label}>
                    <dt className="text-slate-400">{r.label}</dt>
                    <dd className="font-medium text-slate-700">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>

        {/* ── RIGHT — Payment panel ─────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="font-semibold text-slate-900">Payment Details</p>
            </div>
            <div className="space-y-4 p-5">
              {/* Sale date */}
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">Sale Date</label>
                <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
              </div>

              {/* Selling price */}
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">Selling Price (Rs)</label>
                <input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-center font-display text-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
                {errors.price ? <p className="mt-1 text-xs text-red-600">{errors.price}</p> : null}
              </div>

              {/* Discount */}
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">Discount (Rs)</label>
                <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
              </div>

              {/* Final amount display */}
              <div className="rounded-xl bg-slate-900 px-4 py-3 text-center text-white">
                <p className="text-xs font-semibold uppercase tracking-widest opacity-60">Total Amount</p>
                <p className="font-display text-3xl font-bold">{rs(finalAmount)}</p>
              </div>

              {/* Received */}
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">Received Amount (Rs)</label>
                <input type="number" value={received} onChange={(e) => setReceived(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-center font-display text-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
              </div>

              {/* Quick amounts */}
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => setReceived(String(finalAmount))}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-400">
                  Full amount
                </button>
                {[500000, 1000000, 1500000, 2000000].map((a) => (
                  <button key={a} type="button" onClick={() => setReceived(String(a))}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-400">
                    {rs(a)}
                  </button>
                ))}
              </div>

              {/* Remaining */}
              <div className={`rounded-xl px-4 py-3 ${remaining > 0 ? "bg-red-50 border border-red-200" : "bg-emerald-50 border border-emerald-200"}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-[10px] font-semibold uppercase tracking-widest ${remaining > 0 ? "text-red-500" : "text-emerald-600"}`}>
                    {remaining > 0 ? "Balance Remaining" : "Fully Paid"}
                  </p>
                  <p className={`font-display text-xl font-bold ${remaining > 0 ? "text-red-700" : "text-emerald-700"}`}>
                    {remaining > 0 ? rs(remaining) : "✓"}
                  </p>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">Payment Method</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(METHOD_LABEL).map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setPayMethod(val)}
                      className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                        payMethod === val
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  placeholder="Token amount received, delivery date…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
              </div>

              {/* Profit preview */}
              {selectedCar && finalAmount > 0 ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated profit</span>
                    <span className={profit >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
                      {profit >= 0 ? "+" : ""}{rs(profit)}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Errors */}
              {errors.detail ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{errors.detail}</div>
              ) : null}

              {/* Complete sale */}
              <button
                type="button"
                onClick={completeSale}
                disabled={pending || !selectedCar || !selectedCustomer}
                className={`flex h-14 w-full items-center justify-center gap-2.5 rounded-xl text-base font-bold transition-all ${
                  !selectedCar || !selectedCustomer
                    ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                    : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.98]"
                }`}
              >
                {pending ? (
                  "Processing…"
                ) : !selectedCar ? (
                  "Select a car first"
                ) : !selectedCustomer ? (
                  "Select a customer"
                ) : (
                  <>
                    <FileText size={18} />
                    Complete Sale & Print Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
