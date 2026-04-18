
-- Substitui SELECT amplo por SELECT restrito a admin (URLs públicas continuam acessíveis sem RLS).
DROP POLICY IF EXISTS "site_assets_public_read" ON storage.objects;
CREATE POLICY "site_assets_admin_list" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'::app_role));
