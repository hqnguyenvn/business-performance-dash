
-- Create employees table
CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username character varying NOT NULL DEFAULT '',
  name character varying NOT NULL DEFAULT '',
  type character varying NOT NULL DEFAULT '',
  division_id uuid REFERENCES public.divisions(id),
  role_id uuid REFERENCES public.roles(id),
  category character varying NOT NULL DEFAULT '',
  status character varying NOT NULL DEFAULT 'Working',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Allow admins full access to employees"
ON public.employees FOR ALL
USING (check_user_role(auth.uid(), 'Admin'::app_role))
WITH CHECK (check_user_role(auth.uid(), 'Admin'::app_role));

-- Authenticated read
CREATE POLICY "Allow authenticated users to read employees"
ON public.employees FOR SELECT
USING (auth.role() = 'authenticated'::text);

-- Update trigger
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
