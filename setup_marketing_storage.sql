
-- Create marketing-materials bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-materials', 'marketing-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read marketing materials
DROP POLICY IF EXISTS "Public Access Marketing Materials" ON storage.objects;
CREATE POLICY "Public Access Marketing Materials" ON storage.objects
  FOR SELECT USING (bucket_id = 'marketing-materials');

-- Allow admins to upload/manage marketing materials
-- Using public.is_admin() which was defined in admin_rls_setup.sql
DROP POLICY IF EXISTS "Admin Upload Marketing Materials" ON storage.objects;
CREATE POLICY "Admin Upload Marketing Materials" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'marketing-materials' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Update Marketing Materials" ON storage.objects;
CREATE POLICY "Admin Update Marketing Materials" ON storage.objects
  FOR UPDATE USING (bucket_id = 'marketing-materials' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Delete Marketing Materials" ON storage.objects;
CREATE POLICY "Admin Delete Marketing Materials" ON storage.objects
  FOR DELETE USING (bucket_id = 'marketing-materials' AND public.is_admin());
