
-- Drop the existing 'division' and 'customer_id' columns which have incorrect types or names.
ALTER TABLE public.salary_costs DROP COLUMN IF EXISTS division;
ALTER TABLE public.salary_costs DROP COLUMN IF EXISTS customer_id;

-- Add new columns with the correct UUID types and foreign key references.
ALTER TABLE public.salary_costs ADD COLUMN division_id UUID;
ALTER TABLE public.salary_costs ADD CONSTRAINT salary_costs_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.divisions(id) ON DELETE SET NULL;

ALTER TABLE public.salary_costs ADD COLUMN customer_id UUID;
ALTER TABLE public.salary_costs ADD CONSTRAINT salary_costs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- For consistency with the 'costs' table, the 'month' column will be changed from text to an integer.
ALTER TABLE public.salary_costs ALTER COLUMN month TYPE INTEGER USING (
    CASE
        WHEN lower(month) = 'jan' THEN 1
        WHEN lower(month) = 'feb' THEN 2
        WHEN lower(month) = 'mar' THEN 3
        WHEN lower(month) = 'apr' THEN 4
        WHEN lower(month) = 'may' THEN 5
        WHEN lower(month) = 'jun' THEN 6
        WHEN lower(month) = 'jul' THEN 7
        WHEN lower(month) = 'aug' THEN 8
        WHEN lower(month) = 'sep' THEN 9
        WHEN lower(month) = 'oct' THEN 10
        WHEN lower(month) = 'nov' THEN 11
        WHEN lower(month) = 'dec' THEN 12
        ELSE 1
    END
);
