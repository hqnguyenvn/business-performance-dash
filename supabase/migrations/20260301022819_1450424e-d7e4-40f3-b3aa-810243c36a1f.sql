
-- Enable RLS on bonus_by_c
ALTER TABLE public.bonus_by_c ENABLE ROW LEVEL SECURITY;

-- Add policies (matching the pattern of bonus_by_d)
CREATE POLICY "allow admin write bonus_by_c"
ON public.bonus_by_c FOR ALL
USING (check_user_role(auth.uid(), 'Admin'::app_role))
WITH CHECK (check_user_role(auth.uid(), 'Admin'::app_role));

CREATE POLICY "allow authenticated read bonus_by_c"
ON public.bonus_by_c FOR SELECT
USING (auth.role() = 'authenticated'::text);
