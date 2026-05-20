-- STORAGE BUCKET SETUP
-- Create the product-images bucket if it doesn't exist

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the bucket
-- Allow public access to view images
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Allow admins to upload/manage images
-- Assuming is_admin() function exists from previous setup
CREATE POLICY "Admin Upload Access" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admin Update Access" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admin Delete Access" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND public.is_admin());
