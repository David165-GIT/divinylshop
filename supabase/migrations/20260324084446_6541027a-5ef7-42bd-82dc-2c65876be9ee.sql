ALTER TABLE public.records DROP CONSTRAINT IF EXISTS records_category_check;

ALTER TABLE public.records
ADD CONSTRAINT records_category_check
CHECK (category = ANY (ARRAY['vinyl'::text, 'cd'::text, 'hifi'::text, 'editions_originales'::text]));