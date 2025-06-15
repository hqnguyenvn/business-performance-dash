
-- Create table for bonus_by_d
CREATE TABLE public.bonus_by_d (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  bn_bmm NUMERIC NOT NULL,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance (optional, but recommended)
CREATE INDEX idx_bonus_by_d_year_month_division ON public.bonus_by_d (year, month, division_id);

-- Enable RLS for bonus_by_d table
ALTER TABLE public.bonus_by_d ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read bonus_by_d
CREATE POLICY "allow authenticated read bonus_by_d"
  ON public.bonus_by_d
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow admin to insert/update/delete
CREATE POLICY "allow admin write bonus_by_d"
  ON public.bonus_by_d
  FOR ALL
  USING (check_user_role(auth.uid(), 'Admin'))
  WITH CHECK (check_user_role(auth.uid(), 'Admin'));
