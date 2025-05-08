-- Complete database setup script for OrderKaro
-- This will create all required tables with proper structure

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
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

-- Add some basic categories
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

-- Add sample products
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

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Grant USAGE on schema to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.products TO anon;

-- Create RLS policies for anonymous access
DROP POLICY IF EXISTS "public_categories_select" ON public.categories;
DROP POLICY IF EXISTS "public_products_select" ON public.products;

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

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to tables
DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Show counts to verify
SELECT 'Categories' as table_name, COUNT(*) as count FROM public.categories;
SELECT 'Products' as table_name, COUNT(*) as count FROM public.products; 