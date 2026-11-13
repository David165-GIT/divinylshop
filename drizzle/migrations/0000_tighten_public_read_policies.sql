DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.site_settings;
CREATE POLICY "Public settings are viewable by everyone" ON public.site_settings FOR SELECT
USING (key = 'gallery_video_url' OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Records are viewable by everyone" ON public.records;
CREATE POLICY "In-stock records are viewable by everyone" ON public.records FOR SELECT
USING (quantity > 0 OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT
USING (title IS NOT NULL OR public.has_role(auth.uid(), 'admin'::app_role));