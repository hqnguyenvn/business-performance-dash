

## Plan: Fix Salary Cost Calculation in Customer Report

### Problem
When a customer has projects across multiple companies in the same month, the current grouping by `(year, month, customer_id, company_id)` assigns the **full** customer salary cost to each company row, inflating costs and making profit incorrect.

### Recommended Approach: Option 1

Option 1 is the cleanest solution because salary costs in the system are tracked per customer, not per company. Grouping by company creates an inherent mismatch. Removing the company dimension eliminates the root cause.

Option 2 would work but still shows a company column that doesn't meaningfully relate to salary cost allocation — it's a workaround rather than a fix.

### Changes

#### `src/pages/CustomerReport.tsx`
1. **Change grouping key** from `${year}_${month}_${customer_id}_${company_id}` to `${year}_${month}_${customer_id}`
2. **Remove `company_id` and `company_code`** from `CustomerReportData` interface
3. **Remove company-related maps** (`bmmByPeriodCompany`, `salaryWithoutCustomerMap`, allocated salary logic)
4. **Simplify salary cost**: directly use `salaryMap` keyed by `${year}_${month}_${customer_id}`
5. **Recalculate Bonus** per row:
   - Compute `avgBonusPerBMM` for each period = `(salaryCostFromCosts * bonusRate) / totalBMM`
   - For each customer row: `bonusValue = avgBonusPerBMM * customerBMM`
6. **Remove** fetches for `bonus_by_c`, `salaryWithoutCustomerRows`, `companies` (no longer needed for grouping)
7. **Update sort**: sort by `month`, then `customer_code`

#### `src/components/customer-report/ReportTable.tsx`
1. **Remove Company column** from table header and body
2. **Remove `company_code`** from `GroupedCustomerData` interface
3. **Remove `isCompanyReport`** logic (no longer needed since company column is gone)
4. **Update column filter** for `company_code` — remove it
5. **Adjust `colSpan`** for loading/empty states

#### `src/utils/customerReportExport.ts`
1. **Remove "Company" column** from CSV headers and row data

### Data Flow After Fix
```text
Group by: (year, month, customer_id)
Salary Cost = salary_costs WHERE customer_id matches (year, month)
Bonus = (Salary cost from costs table * bonusRate / totalBMM) * customer BMM
Overhead = unchanged (already per-BMM based)
```

### Files Changed
- `src/pages/CustomerReport.tsx` — main logic refactor
- `src/components/customer-report/ReportTable.tsx` — remove company column
- `src/utils/customerReportExport.ts` — remove company from CSV export

