

## Analysis: Why Employee CSV Import is Slow

The Employee import processes each CSV row **one at a time sequentially**, making a separate HTTP request to Supabase for each row (`await employeeService.update(...)` or `await employeeService.create(...)`). For 100 rows, that means 100 sequential network round-trips — each taking ~100-300ms — totaling 10-30 seconds.

Other screens (MasterData, Roles, etc.) use the same pattern but typically have very few rows (10-30), so the delay is not noticeable. Employee data has many more rows (dozens per month × multiple months).

## Solution: Batch Operations

Split the CSV rows into two groups (updates and creates), then send them to Supabase in bulk using batch `insert` and individual `update` calls run in parallel.

### Changes to `src/components/employees/EmployeeTable.tsx` — `handleImport` function:

1. **Separate rows into two arrays**: `toCreate` (new records) and `toUpdate` (existing records matched by year/month/username)
2. **Batch create**: Use a single `supabase.from('employees').insert(toCreate)` call instead of N individual creates
3. **Parallel update**: Run all update calls concurrently using `Promise.allSettled()` instead of sequential `await` in a loop
4. **Error handling**: Collect errors from failed promises and report them

### Key code approach:

```typescript
// Phase 1: Classify rows into creates vs updates
const toCreate = [];
const toUpdate = [];

for (const row of rows) {
  // ... parse row into item ...
  const existing = existingMap.get(key);
  if (existing) {
    toUpdate.push({ id: existing.id, ...item });
  } else {
    toCreate.push(item);
  }
}

// Phase 2: Batch create
if (toCreate.length > 0) {
  const { error } = await supabase.from('employees').insert(toCreate);
  if (error) errors.push(error.message);
  else created = toCreate.length;
}

// Phase 3: Parallel updates
const updateResults = await Promise.allSettled(
  toUpdate.map(({ id, ...fields }) => employeeService.update(id, fields))
);
// Count successes/failures from results
```

This reduces network calls from N sequential requests to 1 batch insert + M parallel updates, dramatically improving performance.

### No other files need changes.

