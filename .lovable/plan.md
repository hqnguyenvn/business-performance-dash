

## Analysis: Import CSV Logic for Employee Working Days

### Current behavior

The current import logic (lines 100-140 in `EmployeeTable.tsx`) does **NOT** implement upsert logic. It always calls `employeeService.create(item)` for every row in the CSV, meaning:

- Every row is inserted as a **new record**, regardless of whether a matching (Year, Month, User name) already exists
- There is no duplicate check — importing the same CSV twice will create duplicate records
- The `updated` counter is hardcoded to `0`

### Proposed fix

Add upsert logic: before inserting, query existing employees to find a match by `(year, month, username)`. If found, update; if not, create.

#### Changes in `src/components/employees/EmployeeTable.tsx` — `handleImport` function:

1. Before the loop, fetch all existing employees for the relevant year (or use the already-loaded `employees` state) to build a lookup
2. For each CSV row, check if an employee with matching `(year, month, username)` exists in the current data
3. If match found → call `employeeService.update(existingId, fields)` and increment `updated` counter
4. If no match → call `employeeService.create(item)` and increment `created` counter

#### Changes in `src/services/employeeService.ts`:

No changes needed — `update` method already exists and accepts partial fields.

### Key code sketch

```typescript
// Inside handleImport, before the loop:
const existingMap = new Map<string, Employee>();
for (const emp of employees) {
  const key = `${emp.year}-${emp.month}-${emp.username.toLowerCase()}`;
  existingMap.set(key, emp);
}

// Inside the loop, after building `item`:
const key = `${item.year}-${item.month}-${item.username.toLowerCase()}`;
const existing = existingMap.get(key);
if (existing && !existing.id.startsWith("tmp-")) {
  await employeeService.update(existing.id, item);
  updated++;
} else {
  await employeeService.create(item);
  created++;
}
```

This ensures CSV import works as an upsert: update existing records when (Year, Month, User name) matches, create new ones otherwise.

