-- Complete OrderKaro Database Setup
-- This script sets up all tables, data, functions, and permissions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create helper function for timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Alternative name for compatibility with existing SQL
CREATE OR REPLACE FUNCTION set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

---------------------------
-- Create Categories Table
---------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Enable RLS and set permissions
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.categories TO authenticated;

-- Create RLS policy for categories
DROP POLICY IF EXISTS "public_categories_select" ON public.categories;
CREATE POLICY "public_categories_select" 
  ON public.categories 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

---------------------------
-- Create Products Table
---------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Enable RLS and set permissions
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;

-- Create RLS policy for products
DROP POLICY IF EXISTS "public_products_select" ON public.products;
CREATE POLICY "public_products_select" 
  ON public.products 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

---------------------------
-- Create Profiles Table
---------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  phone_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  email_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Enable RLS and set permissions
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DROP POLICY IF EXISTS "users_select_own_profile" ON public.profiles;
CREATE POLICY "users_select_own_profile" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
CREATE POLICY "users_insert_own_profile" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

---------------------------
-- Add Sample Data
---------------------------
-- Add categories if the table is empty
INSERT INTO public.categories (name, description)
SELECT * FROM (
  VALUES 
    ('Fruits', 'Fresh fruits'),
    ('Vegetables', 'Fresh vegetables'),
    ('Dairy', 'Milk, cheese, and eggs'),
    ('Bakery', 'Bread and baked goods'),
    ('Beverages', 'Drinks and juices')
) AS data(name, description)
WHERE NOT EXISTS (SELECT 1 FROM public.categories LIMIT 1);

-- Add sample products if the table is empty
DO $$
DECLARE
  fruit_id UUID;
  veggie_id UUID;
  dairy_id UUID;
  bakery_id UUID;
BEGIN
  -- Only proceed if products table is empty
  IF NOT EXISTS (SELECT 1 FROM public.products LIMIT 1) THEN
    -- Get category IDs
    SELECT id INTO fruit_id FROM public.categories WHERE name = 'Fruits' LIMIT 1;
    SELECT id INTO veggie_id FROM public.categories WHERE name = 'Vegetables' LIMIT 1;
    SELECT id INTO dairy_id FROM public.categories WHERE name = 'Dairy' LIMIT 1;
    SELECT id INTO bakery_id FROM public.categories WHERE name = 'Bakery' LIMIT 1;
    
    -- Insert sample products
    IF fruit_id IS NOT NULL THEN
      INSERT INTO public.products (name, description, price, image_url, category_id)
      VALUES ('Fresh Apples', 'Crisp red apples', 99.99, 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=500&auto=format&fit=crop', fruit_id);
    END IF;
    
    IF veggie_id IS NOT NULL THEN
      INSERT INTO public.products (name, description, price, image_url, category_id)
      VALUES ('Carrots', 'Fresh orange carrots', 49.99, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop', veggie_id);
    END IF;
    
    IF dairy_id IS NOT NULL THEN
      INSERT INTO public.products (name, description, price, image_url, category_id)
      VALUES ('Milk', 'Fresh whole milk (1L)', 59.99, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop', dairy_id);
    END IF;
    
    IF bakery_id IS NOT NULL THEN
      INSERT INTO public.products (name, description, price, image_url, category_id)
      VALUES ('Whole Wheat Bread', 'Freshly baked bread', 39.99, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop', bakery_id);
    END IF;
  END IF;
END;
$$;

---------------------------
-- Create SQL Functions
---------------------------
-- Function to Create Profiles Table If Not Exists
CREATE OR REPLACE FUNCTION create_profiles_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    -- Create the profiles table
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id),
      email TEXT,
      full_name TEXT,
      phone_number TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      email_notifications BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable Row Level Security
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view their own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);

    CREATE POLICY "Users can update their own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);

    CREATE POLICY "Users can insert their own profile"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = id);

    -- Create trigger for updated_at
    CREATE TRIGGER set_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to Create Products Table If Not Exists
CREATE OR REPLACE FUNCTION create_products_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Ensure uuid extension is available
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'products'
  ) THEN
    -- Create the products table
    CREATE TABLE public.products (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      image_url TEXT,
      category_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create categories table if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = 'categories'
    ) THEN
      CREATE TABLE public.categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Add some basic categories
      INSERT INTO public.categories (name) VALUES
        ('Fruits'),
        ('Vegetables'),
        ('Dairy'),
        ('Bakery'),
        ('Beverages');
    END IF;

    -- Add foreign key once both tables exist
    ALTER TABLE public.products
      ADD CONSTRAINT fk_category
      FOREIGN KEY (category_id)
      REFERENCES public.categories(id);

    -- Enable Row Level Security
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Everyone can view products"
      ON public.products FOR SELECT
      USING (true);
      
    CREATE POLICY "Everyone can view categories"
      ON public.categories FOR SELECT
      USING (true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to Create User Addresses Table If Not Exists
CREATE OR REPLACE FUNCTION create_user_addresses_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Ensure uuid extension is available
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_addresses'
  ) THEN
    -- Create the user_addresses table
    CREATE TABLE public.user_addresses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      address_line TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      address_type TEXT DEFAULT 'home',
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable Row Level Security
    ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view their own addresses"
      ON public.user_addresses FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own addresses"
      ON public.user_addresses FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own addresses"
      ON public.user_addresses FOR UPDATE
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own addresses"
      ON public.user_addresses FOR DELETE
      USING (auth.uid() = user_id);

    -- Create trigger for updated_at
    CREATE TRIGGER set_user_addresses_updated_at
      BEFORE UPDATE ON public.user_addresses
      FOR EACH ROW
      EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix RLS Policies Functions
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

CREATE OR REPLACE FUNCTION check_function_exists(function_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM pg_proc
    WHERE proname = function_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Direct Functions for Table Permissions
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

---------------------------
-- Fix RLS Policies Now
---------------------------
-- Run the RLS fix functions immediately
SELECT fix_categories_rls_policies();
SELECT fix_products_rls_policies();

-- Grant schema usage to anon again to be sure
GRANT USAGE ON SCHEMA public TO anon;

---------------------------
-- Verify Setup
---------------------------
-- Show counts to verify
SELECT 'Categories' as table_name, COUNT(*) as count FROM public.categories;
SELECT 'Products' as table_name, COUNT(*) as count FROM public.products;

-- Show available functions
SELECT proname, proargnames
FROM pg_proc
WHERE proname IN (
  'create_profiles_table_if_not_exists',
  'create_products_table_if_not_exists',
  'create_user_addresses_table_if_not_exists',
  'fix_categories_rls_policies',
  'fix_products_rls_policies',
  'check_function_exists',
  'set_public_categories_policy',
  'set_public_products_policy'
);

-- Show RLS policies
SELECT
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('categories', 'products')
ORDER BY tablename, policyname; 