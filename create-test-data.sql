-- Script to create test data regardless of exact table structure
-- This will inspect the tables and insert compatible data

-- First ensure categories table exists and has test data
DO $$
BEGIN
  -- Check if categories table exists
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'categories'
  ) THEN
    -- Insert a test category if the table is empty
    IF NOT EXISTS (SELECT 1 FROM public.categories LIMIT 1) THEN
      INSERT INTO public.categories (name, description)
      VALUES ('Test Category', 'This is a test category');
    END IF;
    
    -- Verify we have a category to use
    IF EXISTS (SELECT 1 FROM public.categories LIMIT 1) THEN
      -- Get the first category ID
      DECLARE
        cat_id UUID;
      BEGIN
        SELECT id INTO cat_id FROM public.categories LIMIT 1;
        
        -- Check if products table exists
        IF EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public' AND tablename = 'products'
        ) THEN
          -- Check which columns exist in products table
          DECLARE
            has_stock BOOLEAN;
            has_image_url BOOLEAN;
            insertion_cols TEXT;
            insertion_vals TEXT;
          BEGIN
            -- Check for stock column
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'stock'
            ) INTO has_stock;
            
            -- Check for image_url column
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image_url'
            ) INTO has_image_url;
            
            -- Build dynamic insertion SQL
            insertion_cols := 'name, description, price, category_id';
            insertion_vals := E'\'Test Product\', \'This is a test product\', 9.99, \'''' || cat_id || E'\'\'';
            
            IF has_stock THEN
              insertion_cols := insertion_cols || ', stock';
              insertion_vals := insertion_vals || ', 100';
            END IF;
            
            IF has_image_url THEN
              insertion_cols := insertion_cols || ', image_url';
              insertion_vals := insertion_vals || E', \'https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=800&auto=format&fit=crop\'';
            END IF;
            
            -- Only insert if the table is empty
            IF NOT EXISTS (SELECT 1 FROM public.products LIMIT 1) THEN
              EXECUTE 'INSERT INTO public.products (' || insertion_cols || ') VALUES (' || insertion_vals || ')';
            END IF;
          END;
        ELSE
          RAISE NOTICE 'Products table does not exist';
        END IF;
      END;
    ELSE
      RAISE NOTICE 'No categories found, even after trying to insert one';
    END IF;
  ELSE
    RAISE NOTICE 'Categories table does not exist';
  END IF;
END;
$$;

-- Show what was created
SELECT 'Categories' as table_name, COUNT(*) as record_count FROM categories;
SELECT 'Products' as table_name, COUNT(*) as record_count FROM products; 