ALTER TABLE public.events ADD COLUMN end_date timestamp with time zone;
ALTER TABLE public.events ALTER COLUMN event_date DROP NOT NULL;