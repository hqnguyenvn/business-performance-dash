export interface Employee {
  id: string;
  username: string;
  name: string;
  type: string;
  division_id: string | null;
  role_id: string | null;
  category: string;
  status: string;
  year: number;
  month: number;
  working_day: number;
  created_at?: string;
  updated_at?: string;
}

export const EMPLOYEE_TYPES = ["Sinh viên", "Nhân viên", "Cộng tác viên"];
export const EMPLOYEE_CATEGORIES = ["Overhead", "Development"];
export const EMPLOYEE_STATUSES = ["Working", "Off"];

export const MONTH_LABELS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Count weekdays (Mon-Fri) in a given month (1-indexed) */
export function getBusinessDays(year: number, month: number): number {
  const totalDays = getDaysInMonth(year, month);
  let count = 0;
  for (let d = 1; d <= totalDays; d++) {
    const day = new Date(year, month - 1, d).getDay(); // 0=Sun, 6=Sat
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}
