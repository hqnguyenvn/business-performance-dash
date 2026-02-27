
## Plan: Fix default month selection and add Select All / Clear All buttons

### 1. Change default selected months from "1 to current month" to "1 to previous month"

Currently, if it's March (month 3), the system selects months [1, 2, 3]. The fix changes this to [1, 2].

**Files to update (default months logic):**

- `src/hooks/costs/useCostsState.ts` -- hardcoded `[1, 2, 3, 4, 5, 6]`, change to dynamic `1..(currentMonth - 1)`
- `src/hooks/salary-costs/useSalaryCostsState.ts` -- uses `Array.from({ length: currentMonth }, ...)`, change to `currentMonth - 1`
- `src/hooks/useRevenueData.tsx` -- same pattern, change to `currentMonth - 1`
- `src/hooks/useBusinessReport.ts` -- same pattern, change to `currentMonth - 1`
- `src/pages/Index.tsx` (Dashboard) -- same pattern, change to `currentMonth - 1`
- `src/pages/CustomerReport.tsx` -- same pattern, change to `currentMonth - 1`
- `src/pages/CompanyReport.tsx` -- same pattern, change to `currentMonth - 1`
- `src/pages/DivisionReport.tsx` -- same pattern, change to `currentMonth - 1`

The change in each file is the same: replace `{ length: currentMonth }` with `{ length: currentMonth - 1 }` (or equivalent).

### 2. Add "Select All" and "Clear All" buttons to all month filter toolbars

Currently only `RevenueFilters.tsx` has these buttons. The following filter components need them added:

- `src/components/costs/CostsToolbar.tsx`
- `src/components/salary-costs/SalaryCostsToolbar.tsx`
- `src/components/dashboard/DashboardFilter.tsx`
- `src/components/business-report/BusinessReportFilters.tsx`
- `src/components/customer-report/ReportFilter.tsx`

Each component will need:
- A `setSelectedMonths` (or equivalent) prop to set all months or clear all
- Two small buttons: "Select All" (sets months 1-12) and "Clear All" (sets empty array)
- Buttons styled consistently with the existing `RevenueFilters.tsx` pattern (outline variant, small size)

For components that only expose `onMonthToggle`, the parent will also need to pass a `setSelectedMonths` callback. Affected parents:
- `src/pages/Costs.tsx` / `src/hooks/costs/useCostsState.ts` -- expose `setSelectedMonths`
- `src/pages/SalaryCosts.tsx` / `src/hooks/salary-costs/useSalaryCostsState.ts` -- expose `setSelectedMonths`
- `src/pages/BusinessReport.tsx` / `src/hooks/useBusinessReport.ts` -- expose `setSelectedMonths`
- `src/pages/Index.tsx` -- already has `setSelectedMonths`

### Summary of changes

| Area | Files changed | Change |
|------|--------------|--------|
| Default months | 8 files | `currentMonth` to `currentMonth - 1` |
| Select All / Clear All buttons | 5 filter components + their parent hooks/pages | Add buttons and pass `setSelectedMonths` prop |
