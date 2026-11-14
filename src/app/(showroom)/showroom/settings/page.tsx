"use client";

import { FormEvent, useEffect, useState } from "react";
import { Camera, Fingerprint, PenLine, Printer } from "lucide-react";
import { CarSaleInvoice, type CarInvoiceData } from "@/components/showroom/CarSaleInvoice";
import { api, asList } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { readShowroomPaper, saveShowroomPaper, type ShowroomPaper } from "@/lib/showroomInvoice";

type Item = { id: string; name: string };

function Section({ title, endpoint }: { title: string; endpoint: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { api(endpoint).then((d) => setItems(asList(d as any))).catch(() => {}); }, [endpoint]);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const item = await api<Item>(endpoint, { method: "POST", body: JSON.stringify({ name: name.trim() }) });
      setItems((prev) => [...prev, item]);
      setName("");
    } catch {}
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    try { await api(`${endpoint}${id}/`, { method: "DELETE" }); setItems((prev) => prev.filter((i) => i.id !== id)); } catch {}
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-semibold text-slate-900">{title}</h3>
      <form onSubmit={add} className="mb-4 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Add ${title.toLowerCase()}…`}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
        <button type="submit" disabled={saving} className="btn btn-primary px-4 py-2 text-sm">Add</button>
      </form>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-700">{item.name}</span>
            <button type="button" onClick={() => remove(item.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-slate-400">No {title.toLowerCase()} yet.</li>}
      </ul>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Showroom</p>
        <h1 className="font-display text-2xl font-semibold text-slate-900">Settings</h1>
      </div>
      <InvoiceSettings shopName={user?.business_name} cashier={user?.full_name} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Section title="Car Brands"          endpoint="/api/showroom/car-brands/" />
        <Section title="Fuel Types"          endpoint="/api/showroom/fuel-types/" />
        <Section title="Transmission Types"  endpoint="/api/showroom/transmissions/" />
        <Section title="Expense Categories"  endpoint="/api/showroom/showroom-expense-categories/" />
      </div>
    </div>
  );
}

function InvoiceSettings({ shopName, cashier }: { shopName?: string; cashier?: string }) {
  const [paper, setPaper] = useState<ShowroomPaper>("a4");

  useEffect(() => {
    setPaper(readShowroomPaper());
  }, []);

  function choose(next: ShowroomPaper) {
    setPaper(next);
    saveShowroomPaper(next);
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Sale invoice</p>
        <h2 className="mt-1 font-display text-xl font-semibold text-slate-900">Invoice</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Choose the paper. Photo, thumb impression and both signatures are taken on the invoice when a sale is completed at the counter.
        </p>
        <div className="mt-5 grid gap-2">
          <PaperChoice
            active={paper === "a4"}
            title="A4"
            detail="Full agreement for the customer file."
            onClick={() => choose("a4")}
          />
          <PaperChoice
            active={paper === "80mm"}
            title="80mm thermal"
            detail="Counter slip on the receipt printer."
            onClick={() => choose("80mm")}
          />
        </div>
        <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <CaptureRow icon={Camera} label="Customer photo" />
          <CaptureRow icon={Fingerprint} label="Thumb impression" />
          <CaptureRow icon={PenLine} label="Customer signature" />
          <CaptureRow icon={PenLine} label="Dealer signature" />
          <CaptureRow icon={Printer} label="Prints on the connected printer" />
        </ul>
      </div>
      <div className="min-w-0">
        <CarSaleInvoice layout="preview" paper={paper} onPaperChange={choose} data={previewInvoice(shopName, cashier)} />
      </div>
    </section>
  );
}

function PaperChoice({
  active,
  title,
  detail,
  onClick,
}: {
  active: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-3 text-left transition ${
        active ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/15" : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <span className="block text-sm font-medium text-slate-900">{title}</span>
      <span className="mt-0.5 block text-xs text-slate-500">{detail}</span>
    </button>
  );
}

function CaptureRow({ icon: Icon, label }: { icon: typeof Camera; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <Icon size={14} className="text-indigo-500" />
      {label}
    </li>
  );
}

function previewInvoice(shopName?: string, cashier?: string): CarInvoiceData {
  return {
    invoice_number: "SR-00001",
    sale_date: new Date().toISOString().slice(0, 10),
    shop_name: shopName || "Car Showroom",
    customer_name: "Ahmad Khan",
    customer_phone: "0300-1234567",
    customer_cnic: "35202-1234567-1",
    customer_address: "Lahore",
    car_brand: "Toyota",
    car_model: "Corolla",
    car_variant: "Altis",
    car_year: 2020,
    car_color: "White",
    registration_number: "LEA-1234",
    chassis_number: "NZE141-0000001",
    engine_number: "1NZ-0000001",
    engine_cc: 1800,
    fuel_type: "Petrol",
    transmission: "Automatic",
    mileage_km: 45000,
    selling_price: 4500000,
    discount: 0,
    final_amount: 4500000,
    received_amount: 1500000,
    remaining_amount: 3000000,
    payment_method: "bank",
    cashier_name: cashier || "",
  };
}
