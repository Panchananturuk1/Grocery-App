# Supabase SQL Functions Setup

This document provides the SQL functions that need to be added to your Supabase project through the SQL Editor to support OrderKaro app functionality.

## 1. Function to Create Profiles Table If Not Exists

```sql
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
```

## 2. Function to Create Products Table If Not Exists

```sql
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
      stock INTEGER NOT NULL DEFAULT 0,
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

    -- Create trigger for updated_at
    CREATE TRIGGER set_products_updated_at
      BEFORE UPDATE ON public.products
      FOR EACH ROW
      EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 3. Function to Create User Addresses Table If Not Exists

```sql
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
```

## 4. Function for Setting Updated Timestamp

This helper function is required for the triggers:

```sql
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## How to Add These Functions to Supabase

1. Log in to your Supabase project dashboard
2. Go to the "SQL Editor" section
3. Click "New Query"
4. Paste each SQL function one at a time and click "Run"
5. Verify the functions were created by checking the "Database Functions" section

Once these functions are added, your application will be able to automatically create and manage the necessary tables when users log in. 