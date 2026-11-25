import { ApiError, NetworkError } from "./api";

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  quantity: "Quantity",
  selling_price: "Selling price",
  cost_price: "Cost",
  barcode: "Barcode",
  category: "Category",
  size: "Size",
  garment_type: "Type",
  pack_quantity: "Pieces in a pack",
  pack_price: "Pack price",
  carton_quantity: "Pieces in a carton",
  carton_price: "Carton price",
  customer: "Customer",
  payments: "Payment",
  lines: "Items",
  branch: "Branch",
  opening_cash: "Opening cash",
  credit_limit: "Credit limit",
  phone: "Phone",
  email: "Email",
  password: "Password",
  amount: "Amount",
  method: "Payment method",
  manual_discount_value: "Discount",
  min_stock: "Minimum stock",
  opening_stock: "Opening stock",
};

export function explainError(error: unknown, fallback = "Something went wrong. Try again.") {
  if (error instanceof NetworkError) {
    return "The shop server is not reachable. Check the connection, then try again.";
  }
  if (error instanceof ApiError) {
    const fromBody = collectMessages(error.body);
    if (error.status === 401) return fromBody || "Your sign-in expired. Sign in again.";
    if (error.status === 403) return fromBody || "You are not allowed to do that. Ask the owner to allow it.";
    if (error.status === 404) return fromBody || "That record was not found. It may already have been removed.";
    if (error.status >= 500) return fromBody || "The server could not finish this. Try again in a moment.";
    if (fromBody) return fromBody;
  }
  if (error instanceof Error && error.message && error.message !== "Request failed") return error.message;
  return fallback;
}

function collectMessages(body: unknown) {
  const lines: string[] = [];
  walk(body, "", lines);
  return Array.from(new Set(lines.map((line) => line.trim()).filter(Boolean))).join(" ");
}

function walk(value: unknown, label: string, lines: string[]) {
  if (value == null || value === "") return;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const text = String(value).trim();
    if (!text) return;
    lines.push(label ? `${pretty(label)}: ${text}` : text);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walk(item, label, lines);
    return;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const next = key === "detail" || key === "non_field_errors" ? label : key;
      walk(child, next, lines);
    }
  }
}

function pretty(key: string) {
  return FIELD_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
