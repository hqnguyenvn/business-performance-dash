-- Remove percent_bn column from bonus_by_c table
ALTER TABLE public.bonus_by_c DROP COLUMN IF EXISTS percent_bn;
