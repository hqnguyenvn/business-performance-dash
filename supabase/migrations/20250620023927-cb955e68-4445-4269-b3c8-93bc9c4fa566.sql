
-- Create table for parameter
CREATE TABLE public.parameter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  code VARCHAR NOT NULL,
  value NUMERIC NOT NULL,
  descriptions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_parameter_year_code ON public.parameter (year, code);

-- Enable RLS for parameter table
ALTER TABLE public.parameter ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read parameter
CREATE POLICY "allow authenticated read parameter"
  ON public.parameter
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow admin to insert/update/delete
CREATE POLICY "allow admin write parameter"
  ON public.parameter
  FOR ALL
  USING (check_user_role(auth.uid(), 'Admin'))
  WITH CHECK (check_user_role(auth.uid(), 'Admin'));
