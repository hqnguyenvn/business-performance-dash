export interface Employee {
  id: string;
  username: string;
  name: string;
  type: string;
  division_id: string | null;
  role_id: string | null;
  category: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export const EMPLOYEE_TYPES = ["Sinh viên", "Nhân viên", "Cộng tác viên"];
export const EMPLOYEE_CATEGORIES = ["Overhead", "Development"];
export const EMPLOYEE_STATUSES = ["Working", "Off"];
