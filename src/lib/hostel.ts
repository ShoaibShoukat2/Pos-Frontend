import { ApiError, fieldErrors } from "./api";

export type HostelSession = {
  role: "owner" | "manager" | "employee";
  branch_id: string | null;
  branch_name: string;
  employee_id: string | null;
  full_name: string;
  permissions: string[];
  hostel_name: string;
  logo: string;
};

export function seatKind(furnishing?: string | null) {
  return furnishing === "mattress" ? "Mattress" : "Bed";
}

export function seatMix(room: {
  bed_count?: number;
  mattress_count?: number;
  beds?: { furnishing?: string | null }[];
  monthly_rent?: string | number | null;
  mattress_rent?: string | number | null;
}) {
  const beds = room.bed_count ?? (room.beds || []).filter((bed) => bed.furnishing !== "mattress").length;
  const mattresses = room.mattress_count ?? Math.max(0, (room.beds || []).length - beds);
  const bedLabel = beds === 1 ? "bed seat" : "bed seats";
  const mattressLabel = mattresses === 1 ? "mattress seat" : "mattress seats";
  return `${beds} ${bedLabel} · ${pkr(room.monthly_rent)} · ${mattresses} ${mattressLabel} · ${pkr(room.mattress_rent)}`;
}

export function pkr(value: string | number | null | undefined) {
  const amount = Number(value || 0);
  return `Rs ${amount.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export function errText(error: unknown) {
  if (error instanceof ApiError) {
    const fields = fieldErrors(error.body);
    return fields.detail || fields.non_field_errors || Object.values(fields).find(Boolean) || "Could not save that.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Could not connect. Check the server and try again.";
}

export function can(session: HostelSession | null, code: string) {
  if (!session) return false;
  if (session.role === "owner") return true;
  return session.permissions.includes(code);
}

export async function readUpload(file: File, allowPdf = false) {
  if (file.size > 1_200_000) throw new Error("Keep the file under 1.2 MB.");
  const allowed = ["image/jpeg", "image/png", "image/webp", ...(allowPdf ? ["application/pdf"] : [])];
  if (!allowed.includes(file.type)) {
    throw new Error(allowPdf ? "Use a JPG, PNG, WEBP, or PDF." : "Use a JPG, PNG, or WEBP image.");
  }
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export function waLink(phone: string, text: string) {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function monthName(month: number) {
  return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month - 1] || "";
}

export function paymentSummary(input: {
  hostel: string;
  branch: string;
  customer: string;
  room: string;
  seat: string;
  rent: string | number;
  paid: string | number;
  remaining: string | number;
  paidMonths: string[];
  pendingMonths: string[];
}) {
  return [
    "HOSTEL PAYMENT SUMMARY",
    "",
    `Hostel: ${input.hostel}`,
    `Branch: ${input.branch}`,
    `Customer: ${input.customer}`,
    `Room: ${input.room || "-"}`,
    `Seat: ${input.seat || "-"}`,
    `Monthly Rent: ${pkr(input.rent)}`,
    `Paid Amount: ${pkr(input.paid)}`,
    `Remaining Balance: ${pkr(input.remaining)}`,
    `Paid Months: ${input.paidMonths.length ? input.paidMonths.join(", ") : "-"}`,
    `Pending Months: ${input.pendingMonths.length ? input.pendingMonths.join(", ") : "-"}`,
  ].join("\n");
}

export function printNow() {
  document.body.classList.add("printing-hostel");
  window.print();
  window.setTimeout(() => document.body.classList.remove("printing-hostel"), 300);
}

export function listOf<T = any>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  const record = data as { results?: T[] };
  return record.results || [];
}

export function pageOf<T = any>(data: unknown): { results: T[]; count: number } {
  if (!data) return { results: [], count: 0 };
  if (Array.isArray(data)) return { results: data as T[], count: data.length };
  const record = data as { results?: T[]; count?: number };
  const results = record.results || [];
  return { results, count: record.count ?? results.length };
}
