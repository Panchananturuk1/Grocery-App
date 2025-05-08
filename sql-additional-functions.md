# Additional SQL Functions for OrderKaro

Run these functions in your Supabase SQL Editor if you're experiencing "No API key found in request" errors.

## Function to Fix Categories RLS Policies

```sql
CREATE OR REPLACE FUNCTION fix_categories_rls_policies()
RETURNS void AS $$
BEGIN
  -- First check if the table exists
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'categories'
  ) THEN
    -- Drop existing RLS policies if they exist
    DROP POLICY IF EXISTS "Everyone can view categories" ON categories;
    
    -- Make sure RLS is enabled
    ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
    
    -- Create a policy for public read access (no authentication required)
    CREATE POLICY "Everyone can view categories"
      ON public.categories
      FOR SELECT
      USING (true);
      
    -- Ensure the auth.role() function is allowed for anon
    GRANT USAGE ON SCHEMA public TO anon;
    GRANT SELECT ON public.categories TO anon;
    
    RAISE NOTICE 'Categories RLS policies fixed successfully';
  ELSE
    RAISE EXCEPTION 'Categories table does not exist';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Function to Fix Products RLS Policies

```sql
CREATE OR REPLACE FUNCTION fix_products_rls_policies()
RETURNS void AS $$
BEGIN
  -- First check if the table exists
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'products'
  ) THEN
    -- Drop existing RLS policies if they exist
    DROP POLICY IF EXISTS "Everyone can view products" ON products;
    
    -- Make sure RLS is enabled
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    
    -- Create a policy for public read access (no authentication required)
    CREATE POLICY "Everyone can view products"
      ON public.products
      FOR SELECT
      USING (true);
      
    -- Ensure the auth.role() function is allowed for anon
    GRANT USAGE ON SCHEMA public TO anon;
    GRANT SELECT ON public.products TO anon;
    
    RAISE NOTICE 'Products RLS policies fixed successfully';
  ELSE
    RAISE EXCEPTION 'Products table does not exist';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Function to Check if a Function Exists

```sql
CREATE OR REPLACE FUNCTION check_function_exists(function_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM pg_proc
    WHERE proname = function_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Direct Functions for Table Permissions

```sql
CREATE OR REPLACE FUNCTION set_public_categories_policy()
RETURNS void AS $$
BEGIN
  -- Grant anonymous access to categories
  GRANT SELECT ON public.categories TO anon;
  ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
  
  -- Drop and recreate the policy
  DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
  CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_public_products_policy()
RETURNS void AS $$
BEGIN
  -- Grant anonymous access to products
  GRANT SELECT ON public.products TO anon;
  ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
  
  -- Drop and recreate the policy
  DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
  CREATE POLICY "Anyone can read products" ON public.products FOR SELECT USING (true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```