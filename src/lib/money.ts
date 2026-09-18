export function num(value: string | number | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isNaN(n) ? 0 : n;
}

/** Round to 2 decimal places the same way POS totals are stored. */
export function money(value: string | number | null | undefined): number {
  return Math.round((num(value) + Number.EPSILON) * 100) / 100;
}

export function rs(value: string | number | null | undefined): string {
  return `Rs ${money(value).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
