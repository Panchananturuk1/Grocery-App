-- Fix Categories RLS Policies
-- First grant privileges to tables for anonymous users
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.products TO anon;

-- Next ensure RLS is enabled
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (this will remove any conflicting policies)
DROP POLICY IF EXISTS "Everyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Everyone can view products" ON public.products;
DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;

-- Create new policies with consistent naming
CREATE POLICY "public_categories_select" 
  ON public.categories 
  FOR SELECT 
  TO anon
  USING (true);

CREATE POLICY "public_products_select" 
  ON public.products 
  FOR SELECT 
  TO anon
  USING (true);

-- Verify if the policies were created correctly
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename IN ('categories', 'products');

-- Add a test record to each table if they're empty
DO $$
BEGIN
  -- Check if categories table is empty
  IF NOT EXISTS (SELECT 1 FROM public.categories LIMIT 1) THEN
    INSERT INTO public.categories (name, description)
    VALUES ('Test Category', 'This is a test category');
  END IF;
  
  -- Check if products table is empty
  IF NOT EXISTS (SELECT 1 FROM public.products LIMIT 1) THEN
    -- Get a category ID to use
    DECLARE
      cat_id UUID;
    BEGIN
      SELECT id INTO cat_id FROM public.categories LIMIT 1;
      
      IF cat_id IS NOT NULL THEN
        INSERT INTO public.products (name, description, price, category_id)
        VALUES ('Test Product', 'This is a test product', 9.99, cat_id);
      END IF;
    END;
  END IF;
END;
$$; 