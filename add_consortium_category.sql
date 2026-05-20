-- Add Consortium Category to product_categories
-- This ensures the category exists for the consortium products to be linked correctly.

INSERT INTO public.product_categories (name)
SELECT 'Consórcio'
WHERE NOT EXISTS (
    SELECT 1 FROM public.product_categories WHERE name = 'Consórcio'
);
