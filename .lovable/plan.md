

## Plan: Add EE (Employee Efficiency) KPI to Dashboard

### What is EE?

**EE = BMM / CMM** where:
- **BMM** (Billable Man Month) = Sum of `quantity` from `revenues` table (filtered by year/months)
- **CMM** (Calendar Man Month) = Sum of each employee's `Convert Working Day` / `business days of that month`, aggregated across all filtered months
  - `Convert Working Day` = `working_day × getConvertFactor(type)`
  - `business days` = weekdays (Mon-Fri) count via `getBusinessDays(year, month)`

### Changes

#### 1. `src/hooks/useDashboardStats.ts`
- Add `employees` fetch query: `supabase.from("employees").select("*").eq("year", year).in("month", months)` (and same for previous period)
- Add `ee` field to `DashboardStats` interface as `StatWithChange`
- In `calcStats`, compute:
  - `totalBMM` = sum of `quantity` from revenues
  - `totalCMM` = for each employee row, `(working_day * convertFactor) / getBusinessDays(year, month)`, summed across all rows
  - `ee = totalBMM / totalCMM` (or 0 if CMM = 0)
- Return EE with year-over-year comparison like other stats

#### 2. `src/pages/Index.tsx`
- Add a 5th stat card for "EE" after "Customers"
- Display as percentage format (e.g., `85.2%`) with `formatNumber` or fixed decimals
- Use a new icon (e.g., `Activity` or `Gauge` from lucide-react)
- Include year-over-year percent change like other cards

#### 3. `src/components/dashboard/StatCards.tsx`
- Grid layout update: change from `lg:grid-cols-4` to `lg:grid-cols-5` to accommodate 5 cards

### Data Flow
```text
revenues.quantity → sum → BMM
employees (working_day, type, month) → convertFactor × working_day / businessDays(year, month) → sum → CMM
EE = BMM / CMM → display as percentage
```

