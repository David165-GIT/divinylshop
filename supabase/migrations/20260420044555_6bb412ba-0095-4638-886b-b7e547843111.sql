ALTER TABLE public.events ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX events_only_one_featured ON public.events (is_featured) WHERE is_featured = true;

CREATE OR REPLACE FUNCTION public.unset_other_featured_events()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_featured = true THEN
    UPDATE public.events SET is_featured = false WHERE id <> NEW.id AND is_featured = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER events_unset_other_featured
BEFORE INSERT OR UPDATE OF is_featured ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.unset_other_featured_events();