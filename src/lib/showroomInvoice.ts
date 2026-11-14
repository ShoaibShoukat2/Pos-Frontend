import type { CarInvoiceData } from "@/components/showroom/CarSaleInvoice";

type SaleLike = {
  id: string;
  invoice_number?: string;
  sale_date: string;
  selling_price?: string;
  discount?: string;
  final_amount?: string;
  received_amount?: string;
  remaining_amount?: string;
  payment_method?: string;
  notes?: string;
  customer_name?: string;
  customer_signature?: string;
  dealer_signature?: string;
  car_info?: Record<string, string | number | null> | null;
  customer_info?: Record<string, string | null> | null;
  payments?: { amount: string; payment_date: string; payment_method: string }[];
};

export function invoiceFromSale(
  sale: SaleLike,
  shop?: { name?: string; cashier?: string },
): CarInvoiceData {
  const car = sale.car_info || {};
  const customer = sale.customer_info || {};
  const selling = Number(sale.selling_price || 0);
  const discount = Number(sale.discount || 0);
  const finalAmount = Number(sale.final_amount || Math.max(0, selling - discount));
  const received = Number(sale.received_amount || 0);
  return {
    sale_id: sale.id,
    invoice_number: sale.invoice_number || `SR-${sale.id.slice(0, 8).toUpperCase()}`,
    sale_date: sale.sale_date,
    shop_name: shop?.name || "Car Showroom",
    customer_name: String(customer.name || sale.customer_name || ""),
    customer_phone: String(customer.phone || ""),
    customer_cnic: String(customer.cnic || ""),
    customer_address: String(customer.address || ""),
    car_brand: String(car.brand_name || ""),
    car_model: String(car.model || ""),
    car_variant: String(car.variant || ""),
    car_year: Number(car.model_year || 0),
    car_color: String(car.color || ""),
    registration_number: String(car.registration_number || ""),
    chassis_number: String(car.chassis_number || ""),
    engine_number: String(car.engine_number || ""),
    engine_cc: Number(car.engine_cc || 0),
    fuel_type: String(car.fuel_type_name || ""),
    transmission: String(car.transmission_name || ""),
    mileage_km: Number(car.mileage_km || 0),
    selling_price: selling,
    discount,
    final_amount: finalAmount,
    received_amount: received,
    remaining_amount: Number(sale.remaining_amount || Math.max(0, finalAmount - received)),
    payment_method: sale.payment_method || "cash",
    notes: sale.notes || "",
    cashier_name: shop?.cashier || "",
    customer_signature: sale.customer_signature || "",
    dealer_signature: sale.dealer_signature || "",
    payments: (sale.payments || []).map((row) => ({
      date: row.payment_date,
      amount: Number(row.amount || 0),
      method: row.payment_method,
    })),
  };
}
