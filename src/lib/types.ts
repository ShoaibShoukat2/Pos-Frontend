export type Permission = {
  id: string;
  codename: string;
  name: string;
  module: string;
  module_label: string;
};

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  is_owner: boolean;
  is_platform_admin?: boolean;
  is_cashier?: boolean;
  role: string | null;
  role_name?: string | null;
  default_branch: string | null;
  default_branch_name?: string | null;
  branch_ids?: string[];
  permissions: string[];
  business_id?: string;
  business_name?: string;
  business_type?: string;
  date_joined?: string;
};

export type PlatformOverview = {
  period: "today" | "week" | "month";
  businesses: { total: number; active: number; inactive: number; new: number };
  users: { total: number; owners: number; staff: number; active: number; new: number };
  branches: { total: number };
  products: { total: number };
  customers: { total: number };
  sales: { count: number; revenue: string; period_count: number; period_revenue: string };
  sales_trend: { date: string; orders: number; revenue: string }[];
  recent_businesses: {
    id: string;
    name: string;
    business_type: string;
    city: string;
    is_active: boolean;
    created_at: string;
  }[];
};

export type PlatformBusiness = {
  id: string;
  name: string;
  legal_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  business_type: string;
  is_active: boolean;
  user_count: number;
  branch_count: number;
  product_count: number;
  customer_count: number;
  sale_count: number;
  owner_email: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  is_owner: boolean;
  role_name: string | null;
  business: string | null;
  business_name: string | null;
  date_joined: string;
  last_login: string | null;
};

export type AuthPayload = {
  access: string;
  refresh: string;
  user: User;
};

export type CashierOverview = {
  cashier_name: string;
  business_name: string;
  branch_name: string;
  today_sales: string;
  orders: number;
  open_shift: {
    id: string;
    number: string;
    branch_name: string;
    expected_cash: string;
    sales_cash: string;
  } | null;
  sold_products: {
    product: string;
    sku: string;
    qty: string;
    revenue: string;
    tickets: number;
  }[];
  recent_sales: {
    id: string;
    number: string;
    total: string;
    customer_name: string;
    branch_name: string;
    payment_method?: string;
    created_at: string;
    cashier_name?: string;
    lines?: { product: string; sku: string; qty: string; total: string }[];
  }[];
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Business = {
  id: string;
  name: string;
  legal_name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  tax_number: string;
  logo: string | null;
  timezone: string;
  date_format: string;
  fiscal_year_start_month: number;
  business_type: string;
  is_active: boolean;
};

export type Branch = {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  is_head_office: boolean;
  is_active: boolean;
};

export type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  exchange_rate: string;
  is_base: boolean;
  is_active: boolean;
};

export type TaxRate = {
  id: string;
  name: string;
  code: string;
  rate: string;
  is_inclusive: boolean;
  is_default: boolean;
  is_active: boolean;
};

export type InvoiceSettings = {
  id: string;
  prefix: string;
  next_number: number;
  number_padding: number;
  footer_note: string;
  terms: string;
  show_logo: boolean;
  show_tax_breakdown: boolean;
  show_cashier_name: boolean;
  paper_size: "80mm" | "58mm" | "A4";
  preview_number: string;
};

export type Category = {
  id: string;
  name: string;
  kind?: "product" | "service";
  is_active: boolean;
  product_count?: number;
};

export type Brand = {
  id: string;
  name: string;
  is_active: boolean;
  product_count?: number;
};

export type Unit = {
  id: string;
  name: string;
  short_code: string;
  is_active: boolean;
};

export type VariantStock = {
  branch_id: string;
  branch_name: string;
  quantity: string;
  is_low: boolean;
};

export type ProductVariant = {
  id: string;
  product?: string;
  product_name?: string;
  name: string;
  display_name: string;
  sku: string;
  barcode: string;
  attributes: Record<string, string>;
  cost_price: string;
  selling_price: string;
  min_stock: string;
  is_default: boolean;
  is_active: boolean;
  total_stock?: string | null;
  stock_by_branch?: VariantStock[];
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string | null;
  category_name?: string | null;
  brand: string | null;
  brand_name?: string | null;
  unit: string;
  unit_code?: string;
  tax_rate: string | null;
  sku: string;
  barcode: string;
  cost_price: string;
  selling_price: string;
  min_stock: string;
  has_variants: boolean;
  track_stock: boolean;
  item_kind?: "product" | "service";
  duration_minutes?: number;
  warranty_days?: number;
  is_active: boolean;
  variant_count?: number | null;
  total_stock?: string | null;
  variants?: ProductVariant[];
};

export type StockLevel = {
  id: string;
  variant: string;
  product_name: string;
  variant_name: string;
  sku: string;
  barcode: string;
  branch: string;
  branch_name: string;
  quantity: string;
  min_stock: string;
  cost_price: string;
  stock_value: string;
  is_low: boolean;
};

export type StockMovement = {
  id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  branch_name: string;
  movement_type: string;
  quantity: string;
  balance_after: string;
  reason: string;
  created_by_name?: string;
  created_at: string;
};

export type StockOperation = {
  id: string;
  number: string;
  kind: string;
  branch: string;
  branch_name: string;
  status: string;
  reason: string;
  posted_at: string | null;
  created_at: string;
};

export type StockTransfer = {
  id: string;
  number: string;
  from_branch: string;
  to_branch: string;
  from_branch_name: string;
  to_branch_name: string;
  status: string;
  reason: string;
  created_at: string;
};

export type Supplier = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  tax_number: string;
  notes: string;
  is_active: boolean;
  payable_balance?: string;
  order_count?: number;
};

export type PurchaseOrderLine = {
  id: string;
  variant: string;
  product_name: string;
  variant_name: string;
  sku: string;
  quantity: string;
  received_qty: string;
  outstanding_qty: string;
  unit_cost: string;
  line_total: string;
};

export type PurchaseOrder = {
  id: string;
  number: string;
  supplier: string;
  supplier_name: string;
  branch: string;
  branch_name: string;
  status: string;
  notes: string;
  expected_date: string | null;
  lines: PurchaseOrderLine[];
  total: string | number;
  created_at: string;
};

export type GoodsReceipt = {
  id: string;
  number: string;
  supplier_name: string;
  branch_name: string;
  purchase_order_number?: string;
  status: string;
  total_amount: string | number;
  posted_at: string | null;
};

export type Payable = {
  id: string;
  supplier_name: string;
  receipt_number: string;
  amount: string;
  paid_amount: string;
  balance: string;
  status: string;
  created_at: string;
};

export type InventorySummary = {
  on_hand_qty: string | number;
  stock_value: string | number;
  low_stock: number;
  sku_locations: number;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  credit_limit: string;
  receivable_balance: string;
  total_purchases: string;
  loyalty_points: string;
  membership_tier?: string | null;
  membership_name?: string;
  membership_discount?: string;
  is_active: boolean;
};

export type LedgerEntry = {
  id: string;
  entry_type: string;
  amount: string;
  balance_after: string;
  reason: string;
  created_at: string;
};

export type CustomerSale = {
  id: string;
  number: string;
  customer: string;
  customer_name: string;
  branch: string;
  branch_name: string;
  total: string;
  paid_amount: string;
  due_amount: string;
  payment_method: string;
  loyalty_points: string;
  notes: string;
  created_at: string;
};

export type ExpenseCategory = {
  id: string;
  name: string;
  is_system: boolean;
  is_active: boolean;
};

export type Expense = {
  id: string;
  number: string;
  category: string;
  category_name: string;
  branch: string;
  branch_name: string;
  amount: string;
  method: string;
  notes: string;
  created_at: string;
};

export type CashMovement = {
  id: string;
  kind: string;
  amount: string;
  balance_after: string;
  reason: string;
  created_at: string;
};

export type CashSession = {
  id: string;
  number: string;
  branch: string;
  branch_name: string;
  opened_by_name?: string;
  status: string;
  opening_cash: string;
  sales_cash: string;
  customer_received: string;
  expense_total: string;
  refund_total: string;
  supplier_paid: string;
  expected_cash: string;
  actual_cash: string | null;
  difference: string | null;
  notes: string;
  movements?: CashMovement[];
  created_at: string;
  closed_at: string | null;
};

export type FinanceSummary = {
  receivables: string;
  payables: string;
  expenses_today: string;
  open_shift: CashSession | null;
};

export type ReportSeries = { date: string; total: string; orders: number };

export type DashboardReport = {
  period: string;
  from: string;
  to: string;
  today_sales: string;
  today_profit: string;
  gross_profit: string;
  orders: number;
  customers: number;
  low_stock: number;
  outstanding: string;
  payables: string;
  expenses: string;
  revenue: string;
  cost: string;
};

export type OwnerAlert = {
  tone: "warn" | "copper" | "good";
  title: string;
  detail: string;
  href: string;
};

export type OwnerOverview = DashboardReport & {
  stock_value: string;
  sku_locations: number;
  products: number;
  services: number;
  variants: number;
  suppliers: number;
  branches: number;
  users_total: number;
  users_active: number;
  daily: ReportSeries[];
  top_products: { product: string; qty: string; revenue: string }[];
  recent_sales: {
    id: string;
    number: string;
    total: string;
    customer_name: string;
    branch_name: string;
    cashier_name: string;
    created_at: string;
  }[];
  team: {
    id: string;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    is_owner: boolean;
  }[];
  open_shifts: {
    id: string;
    number: string;
    branch_name: string;
    opened_by: string;
    expected_cash: string;
    sales_cash: string;
  }[];
  alerts: OwnerAlert[];
  live_products: LiveProduct[];
  activity: LiveActivity[];
  live_counts: { sold: number; purchased: number; added: number; updated: number; total: number };
};

export type LiveProduct = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  selling_price: string;
  cost_price: string;
  qty: string;
  action: "sold" | "purchased" | "added" | "updated" | "catalog";
  detail: string;
  at: string;
};

export type LiveActivity = {
  kind: "sold" | "purchased" | "added" | "updated";
  title: string;
  detail: string;
  at: string;
  href: string;
};

export type SalesReport = {
  period: string;
  from: string;
  to: string;
  totals: { revenue: string; orders: number };
  daily: ReportSeries[];
  weekly: ReportSeries[];
  monthly: ReportSeries[];
  cashiers: { name: string; total: string; orders: number }[];
  products: { product: string; category: string; qty: string; revenue: string }[];
  categories: { category: string; qty: string; revenue: string }[];
};

export type InventoryReport = {
  from: string;
  to: string;
  valuation: string;
  sku_locations: number;
  low_count: number;
  current: {
    product: string;
    variant: string;
    sku: string;
    branch: string;
    qty: string;
    cost: string;
    value: string;
    is_low: boolean;
  }[];
  low_stock: InventoryReport["current"];
  fast_moving: { product: string; on_hand: string; sold: string }[];
  slow_moving: { product: string; on_hand: string; sold: string }[];
};

export type FinancialReport = {
  period: string;
  from: string;
  to: string;
  revenue: string;
  cost: string;
  gross_profit: string;
  expenses: string;
  net_profit: string;
  receivables: string;
  payables: string;
  expense_breakdown: { category: string; total: string }[];
  cogs_note: string;
};

export type Role = {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  permissions: Permission[];
  permission_ids?: string[];
  user_count: number;
};

export type Coupon = {
  id: string;
  code: string;
  kind: "percent" | "fixed";
  value: string;
  min_spend: string;
  max_discount: string;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
};

export type Promotion = {
  id: string;
  name: string;
  kind: "percent" | "fixed" | "bogo" | "price";
  value: string;
  buy_qty: string;
  get_qty: string;
  product: string | null;
  product_name?: string;
  category: string | null;
  category_name?: string;
  variant: string | null;
  variant_name?: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

export type MembershipTier = {
  id: string;
  name: string;
  min_points: string;
  discount_percent: string;
  is_active: boolean;
};

export type LoyaltySettings = {
  id: string;
  points_per_amount: string;
  redemption_rate: string;
  min_redeem_points: string;
  is_active: boolean;
};

export type PosCatalogItem = {
  id: string;
  product_id: string;
  product: string;
  variant: string;
  sku: string;
  barcode: string;
  category: string;
  category_id: string | null;
  selling_price: string;
  cost_price: string;
  track_stock: boolean;
  item_kind?: "product" | "service";
  duration_minutes?: number;
  warranty_days?: number;
  qty: string;
};

export type PosCustomer = Customer & {
  membership_name?: string;
  membership_discount?: string;
};

export type PosSnapshot = {
  branch: Branch;
  branches: Branch[];
  catalog: PosCatalogItem[];
  catalog_truncated?: boolean;
  catalog_total?: number;
  catalog_products?: number;
  catalog_services?: number;
  customers: PosCustomer[];
  customer_truncated?: boolean;
  coupons: Coupon[];
  promotions: Promotion[];
  tiers: MembershipTier[];
  loyalty: LoyaltySettings;
  open_shift: CashSession | null;
};

export type PosSalePayload = {
  client_uuid: string;
  branch?: string;
  customer?: string | null;
  coupon_code?: string;
  manual_discount_kind?: string;
  manual_discount_value?: string;
  redeem_points?: string;
  notes?: string;
  sold_at?: string;
  lines: { variant: string; quantity: string }[];
  payments: { method: string; amount: string }[];
};

export type PosSale = {
  id: string;
  number: string;
  client_uuid: string;
  status?: string;
  total: string;
  paid_amount: string;
  due_amount: string;
  discount_total: string;
  returned_total?: string;
  refunded_amount?: string;
  net_total?: string;
  loyalty_earned: string;
  payment_method?: string;
  customer_name?: string;
  branch_name?: string;
  cashier_name?: string;
  created_at?: string;
  lines?: {
    id: string;
    variant?: string;
    product_name: string;
    variant_name: string;
    sku: string;
    quantity: string;
    returned_qty?: string;
    returned_amount?: string;
    returnable_qty?: string;
    line_total: string;
    promo_name?: string;
  }[];
};

export type PosSaleReturn = {
  id: string;
  number: string;
  sale: string;
  sale_number: string;
  sale_detail?: PosSale;
  branch_name?: string;
  customer_name?: string;
  refund_amount: string;
  credit_reduced: string;
  cash_refunded: string;
  refund_method: string;
  reason: string;
  cashier_name?: string;
  created_at: string;
  lines: {
    id: string;
    variant?: string;
    sale_line: string;
    product_name: string;
    variant_name: string;
    sku: string;
    quantity: string;
    amount: string;
  }[];
};
