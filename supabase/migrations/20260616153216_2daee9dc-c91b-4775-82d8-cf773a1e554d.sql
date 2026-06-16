
DROP POLICY IF EXISTS "Authenticated users can delete record images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update record images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload record images" ON storage.objects;
DROP POLICY IF EXISTS "Record images are publicly accessible" ON storage.objects;

CREATE POLICY "Admins can upload record images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'record-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update record images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'record-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete record images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'record-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can list record images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'record-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
