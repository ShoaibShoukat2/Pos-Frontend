export function rs(value: string | number | null | undefined): string {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "Rs 0.00";
  return `Rs ${n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function num(value: string | number | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isNaN(n) ? 0 : n;
}
