-- Add variations column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variations jsonb DEFAULT '{}'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.products.variations IS 'Stores product options like sizes, colors, numbering, etc. Format: {"sizes": ["P", "M"], "colors": ["Red", "Blue"]}';
