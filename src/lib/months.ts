/**
 * Single source of truth for month options + year list used across pickers,
 * reports, filters, and CSV imports.
 *
 * Renaming a month or adjusting the year range requires editing ONLY this file.
 */

export interface MonthOption {
  value: number;
  label: string;
  short: string;
}

export const MONTHS: readonly MonthOption[] = [
  { value: 1, label: "January", short: "Jan" },
  { value: 2, label: "February", short: "Feb" },
  { value: 3, label: "March", short: "Mar" },
  { value: 4, label: "April", short: "Apr" },
  { value: 5, label: "May", short: "May" },
  { value: 6, label: "June", short: "Jun" },
  { value: 7, label: "July", short: "Jul" },
  { value: 8, label: "August", short: "Aug" },
  { value: 9, label: "September", short: "Sep" },
  { value: 10, label: "October", short: "Oct" },
  { value: 11, label: "November", short: "Nov" },
  { value: 12, label: "December", short: "Dec" },
];

export const MONTH_SHORTS = MONTHS.map((m) => m.short);

/** Start year — oldest supported */
export const START_YEAR = 2023;

/** Year list for dropdowns. Always includes the current year. */
export function buildYearList(): number[] {
  const currentYear = new Date().getFullYear();
  const end = Math.max(currentYear, START_YEAR);
  return Array.from({ length: end - START_YEAR + 1 }, (_, i) => START_YEAR + i);
}

export const YEARS = buildYearList();

/** 1-indexed month number → short label, or the number as a string on invalid input. */
export function monthShort(month: number): string {
  const m = MONTHS.find((x) => x.value === month);
  return m?.short ?? String(month);
}

/** 1-indexed month number → full label. */
export function monthLabel(month: number): string {
  const m = MONTHS.find((x) => x.value === month);
  return m?.label ?? String(month);
}
