
-- Create table for bonus by company
CREATE TABLE public.bonus_by_c (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year integer NOT NULL,
  company_id uuid NOT NULL,
  bn_bmm numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add trigger to update updated_at column
CREATE TRIGGER update_bonus_by_c_updated_at
  BEFORE UPDATE ON public.bonus_by_c
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_bonus_by_c_year ON public.bonus_by_c(year);
CREATE INDEX idx_bonus_by_c_company_id ON public.bonus_by_c(company_id);
CREATE INDEX idx_bonus_by_c_year_company ON public.bonus_by_c(year, company_id);
