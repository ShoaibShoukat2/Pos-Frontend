// ─── Translation dictionary ───────────────────────────────────────────────────
// Add new keys here in BOTH languages. Keep alphabetical within each section.

export type Lang = "en" | "ur";

export const translations = {
  // ── Nav ──
  nav_overview:      { en: "Overview",       ur: "مجموعی جائزہ" },
  nav_pos:           { en: "POS",            ur: "فروخت" },
  nav_returns:       { en: "Returns",        ur: "واپسی" },
  nav_reports:       { en: "Reports",        ur: "رپورٹس" },
  nav_products:      { en: "Products",       ur: "مصنوعات" },
  nav_services:      { en: "Services",       ur: "خدمات" },
  nav_customers:     { en: "Customers",      ur: "گاہک" },
  nav_purchases:     { en: "Purchases",      ur: "خریداری" },
  nav_suppliers:     { en: "Suppliers",      ur: "سپلائر" },
  nav_expenses:      { en: "Expenses",       ur: "اخراجات" },
  nav_cash:          { en: "Cash drawer",    ur: "کیش دراز" },
  nav_business:      { en: "Business",       ur: "کاروبار" },
  nav_invoices:      { en: "Invoices",       ur: "رسیدیں" },
  nav_add_cashier:   { en: "Add cashier",    ur: "کیشیئر شامل کریں" },
  nav_sign_out:      { en: "Sign out",       ur: "لاگ آؤٹ" },

  // ── Dashboard ──
  dash_title:        { en: "Dashboard",      ur: "ڈیش بورڈ" },
  dash_today_sales:  { en: "Sales today",    ur: "آج کی فروخت" },
  dash_net_profit:   { en: "Net profit",     ur: "خالص منافع" },
  dash_orders:       { en: "Orders",         ur: "آرڈرز" },
  dash_customers:    { en: "Customers",      ur: "گاہک" },
  dash_receivables:  { en: "Receivables",    ur: "وصولیاں" },
  dash_payables:     { en: "Payables",       ur: "ادائیگیاں" },
  dash_expenses:     { en: "Expenses",       ur: "اخراجات" },
  dash_products:     { en: "Products",       ur: "مصنوعات" },
  dash_services:     { en: "Services",       ur: "خدمات" },
  dash_staff:        { en: "Staff",          ur: "عملہ" },
  dash_open_pos:     { en: "Open POS",       ur: "فروخت کھولیں" },
  dash_add_cashier:  { en: "Add cashier",    ur: "کیشیئر شامل کریں" },
  dash_period_today: { en: "Today",          ur: "آج" },
  dash_period_week:  { en: "7 days",         ur: "7 دن" },
  dash_period_month: { en: "This month",     ur: "اس ماہ" },
  dash_loading:      { en: "Loading workspace…", ur: "لوڈ ہو رہا ہے…" },

  // ── POS / Checkout ──
  pos_cart:          { en: "Cart",           ur: "کارٹ" },
  pos_search:        { en: "Search products…", ur: "مصنوعات تلاش کریں…" },
  pos_customer:      { en: "Customer",       ur: "گاہک" },
  pos_walkin:        { en: "Walk-in",        ur: "آنے والا" },
  pos_discount:      { en: "Discount",       ur: "رعایت" },
  pos_payment:       { en: "Payment",        ur: "ادائیگی" },
  pos_cash:          { en: "Cash",           ur: "نقد" },
  pos_card:          { en: "Card",           ur: "کارڈ" },
  pos_bank:          { en: "Bank",           ur: "بینک" },
  pos_wallet:        { en: "Wallet",         ur: "والٹ" },
  pos_total:         { en: "Total",          ur: "کل" },
  pos_paid:          { en: "Paid",           ur: "ادا شدہ" },
  pos_change:        { en: "Change",         ur: "باقی" },
  pos_charge:        { en: "Charge",         ur: "وصول کریں" },
  pos_complete:      { en: "Complete sale",  ur: "فروخت مکمل کریں" },
  pos_clear:         { en: "Clear cart",     ur: "کارٹ خالی کریں" },
  pos_out_of_stock:  { en: "Out of stock",   ur: "ختم ہو گئی" },
  pos_balance_due:   { en: "Balance due",    ur: "باقی رقم" },

  // ── Receipt ──
  rcpt_invoice:      { en: "Invoice",        ur: "رسید" },
  rcpt_invoice_no:   { en: "Invoice no.",    ur: "رسید نمبر" },
  rcpt_date:         { en: "Date",           ur: "تاریخ" },
  rcpt_cashier:      { en: "Cashier",        ur: "کیشیئر" },
  rcpt_customer:     { en: "Customer",       ur: "گاہک" },
  rcpt_branch:       { en: "Branch",         ur: "شاخ" },
  rcpt_payment:      { en: "Payment",        ur: "ادائیگی" },
  rcpt_item:         { en: "Item",           ur: "اشیاء" },
  rcpt_qty:          { en: "Qty",            ur: "مقدار" },
  rcpt_rate:         { en: "Rate",           ur: "قیمت" },
  rcpt_amount:       { en: "Amount",         ur: "رقم" },
  rcpt_subtotal:     { en: "Subtotal",       ur: "ذیلی کل" },
  rcpt_discount:     { en: "Discount",       ur: "رعایت" },
  rcpt_total:        { en: "Total",          ur: "کل رقم" },
  rcpt_paid:         { en: "Paid",           ur: "ادا شدہ" },
  rcpt_change:       { en: "Change",         ur: "باقی رقم" },
  rcpt_balance_due:  { en: "Balance due",    ur: "واجب الادا" },
  rcpt_walkin:       { en: "Walk-in",        ur: "نقد گاہک" },
  rcpt_method_cash:  { en: "Cash",           ur: "نقد" },
  rcpt_method_card:  { en: "Card",           ur: "کارڈ" },
  rcpt_method_bank:  { en: "Bank",           ur: "بینک" },
  rcpt_method_wallet:{ en: "Wallet",         ur: "والٹ" },
  rcpt_no_items:     { en: "No items on this slip.", ur: "اس رسید پر کوئی اشیاء نہیں۔" },
  rcpt_print:        { en: "Print slip",     ur: "رسید پرنٹ کریں" },
  rcpt_done:         { en: "Done",           ur: "مکمل" },
  rcpt_slip:         { en: "Customer slip",  ur: "گاہک کی رسید" },

  // ── Common ──
  common_save:       { en: "Save",           ur: "محفوظ کریں" },
  common_cancel:     { en: "Cancel",         ur: "منسوخ" },
  common_search:     { en: "Search",         ur: "تلاش" },
  common_loading:    { en: "Loading…",       ur: "لوڈ ہو رہا ہے…" },
  common_error:      { en: "Error",          ur: "خرابی" },
  common_success:    { en: "Saved",          ur: "محفوظ ہو گیا" },
  common_owner:      { en: "Owner",          ur: "مالک" },
  common_staff:      { en: "Staff",          ur: "عملہ" },
  common_language:   { en: "Language",       ur: "زبان" },
  common_english:    { en: "English",        ur: "انگریزی" },
  common_urdu:       { en: "اردو",           ur: "اردو" },
} as const;

export type TKey = keyof typeof translations;

export function t(key: TKey, lang: Lang): string {
  return translations[key][lang];
}
