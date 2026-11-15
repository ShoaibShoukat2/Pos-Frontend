export type RentalInvoiceData = {
  rental_id?: string;
  invoice_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_cnic?: string;
  customer_address?: string;
  car_name: string;
  registration_number?: string;
  start_date: string;
  end_date: string;
  days: number;
  daily_rate: number;
  total_amount: number;
  deposit: number;
  received_amount: number;
  balance: number;
  payment_method: string;
  notes?: string;
  shop_name: string;
  cashier_name?: string;
  customer_photo?: string;
  customer_signature?: string;
  dealer_signature?: string;
  guarantor_signature?: string;
  customer_thumbprint?: string;
  guarantor_thumbprint?: string;
  cnic_front?: string;
  cnic_back?: string;
  status?: string;
};

export function whatsAppLink(phone: string, message: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  const intl = digits.startsWith("0") ? `92${digits.slice(1)}` : digits.startsWith("92") ? digits : `92${digits}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

export function rentalMessage(row: {
  shop?: string;
  invoice_number?: string;
  car: string;
  registration_number?: string;
  customer: string;
  start_date: string;
  end_date: string;
  days: number;
  daily_rate: string | number;
  total_amount: string | number;
  deposit: string | number;
  received_amount: string | number;
  balance: string | number;
}) {
  const money = (value: string | number) => `Rs ${Number(value || 0).toLocaleString("en-PK")}`;
  return [
    `${row.shop || "Rent a Car"} — rental ${row.invoice_number || ""}`.trim(),
    `Car: ${row.car}${row.registration_number ? ` (${row.registration_number})` : ""}`,
    `Customer: ${row.customer}`,
    `From ${row.start_date} to ${row.end_date} (${row.days} day${row.days === 1 ? "" : "s"})`,
    `Daily rate: ${money(row.daily_rate)}`,
    `Rent total: ${money(row.total_amount)}`,
    `Security deposit: ${money(row.deposit)}`,
    `Received: ${money(row.received_amount)}`,
    `Balance: ${money(row.balance)}`,
  ].join("\n");
}

type RentalApi = {
  id: string;
  invoice_number?: string;
  car_name?: string;
  registration_number?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_cnic?: string;
  customer_address?: string;
  start_date: string;
  end_date: string;
  days?: number;
  daily_rate?: string;
  total_amount?: string;
  deposit?: string;
  received_amount?: string;
  balance?: string;
  payment_method?: string;
  notes?: string;
  customer_photo?: string;
  customer_signature?: string;
  dealer_signature?: string;
  guarantor_signature?: string;
  customer_thumbprint?: string;
  guarantor_thumbprint?: string;
  cnic_front?: string;
  cnic_back?: string;
  status?: string;
};

export function invoiceFromRental(row: RentalApi, shop?: { name?: string; cashier?: string }): RentalInvoiceData {
  const start = new Date(row.start_date);
  const end = new Date(row.end_date);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return {
    rental_id: row.id,
    invoice_number: row.invoice_number || "RC",
    customer_name: row.customer_name || "",
    customer_phone: row.customer_phone || "",
    customer_cnic: row.customer_cnic || "",
    customer_address: row.customer_address || "",
    car_name: row.car_name || "",
    registration_number: row.registration_number || "",
    start_date: row.start_date,
    end_date: row.end_date,
    days: row.days || Math.max(1, diff || 1),
    daily_rate: Number(row.daily_rate || 0),
    total_amount: Number(row.total_amount || 0),
    deposit: Number(row.deposit || 0),
    received_amount: Number(row.received_amount || 0),
    balance: Number(row.balance || 0),
    payment_method: row.payment_method || "cash",
    notes: row.notes || "",
    shop_name: shop?.name || "Rent a Car",
    cashier_name: shop?.cashier || "",
    customer_photo: row.customer_photo || "",
    customer_signature: row.customer_signature || "",
    dealer_signature: row.dealer_signature || "",
    guarantor_signature: row.guarantor_signature || "",
    customer_thumbprint: row.customer_thumbprint || "",
    guarantor_thumbprint: row.guarantor_thumbprint || "",
    cnic_front: row.cnic_front || "",
    cnic_back: row.cnic_back || "",
    status: row.status || "",
  };
}
