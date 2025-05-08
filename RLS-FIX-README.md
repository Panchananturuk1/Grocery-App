# Fixing "No API key found in request" Errors in OrderKaro

This guide will help you resolve the common "No API key found in request" errors that occur when trying to access categories and products in your OrderKaro app.

## Understanding the Issue

This error appears when Row Level Security (RLS) policies are not properly configured to allow anonymous access to your tables. Even though you have created the tables and they have data, the Supabase security settings prevent unauthenticated users from reading the data.

## Solution Steps

### 1. Run the Fix Script in Supabase SQL Editor

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to the SQL Editor (left sidebar)
4. Create a new query
5. Copy the contents of `fix-rls-policies.sql` and paste it into the SQL Editor
6. Click "Run" to execute the script

The script will:
- Grant necessary permissions to the anonymous role
- Enable RLS on both tables
- Remove any existing conflicting policies
- Create fresh policies that allow public read access
- Add test data if tables are empty

### 2. Verify the Fix with Diagnostic Script

1. Create another SQL query in the Supabase SQL Editor
2. Copy the contents of `check-rls.sql` and paste it
3. Run the script to see the current state of your tables and policies

You should see:
- Both tables exist
- RLS is enabled on both tables
- Policies exist with SELECT permission for the anon role
- The anon role has SELECT privileges on both tables
- The anon role has USAGE privilege on the public schema

### 3. Check Your App

After applying these changes:
1. Restart your Next.js development server (if running)
2. Clear your browser cache (Ctrl+F5 or Cmd+Shift+R)
3. Test your app again - the "No API key found in request" errors should be resolved

## Common Issues and Solutions

### Problem: Fix script runs but errors persist

**Possible causes:**
1. **Caching issues:** Your browser or app might be caching old errors
2. **Wrong Supabase instance:** Ensure you're running the script on the correct Supabase project
3. **Service role required:** Some operations might require admin or service role access

**Solutions:**
1. Hard refresh your app (Ctrl+F5) or restart the development server
2. Double-check the Supabase URL and API key in your app's configuration
3. Try running the SQL with a service role if available

### Problem: Tables exist but are empty

The `fix-rls-policies.sql` script includes logic to add test records if tables are empty. If this doesn't work:

1. Manually run these INSERT statements:

```sql
-- Add a test category
INSERT INTO public.categories (name, description)
VALUES ('Test Category', 'This is a test category');

-- Get the ID of the category
SELECT id FROM public.categories WHERE name = 'Test Category' LIMIT 1;

-- Add a test product (replace 'CATEGORY_ID_HERE' with the actual UUID)
INSERT INTO public.products (name, description, price, category_id)
VALUES ('Test Product', 'This is a test product', 9.99, 'CATEGORY_ID_HERE');
```

### Problem: Policies appear correct but errors persist

Try completely resetting the policies:

```sql
-- Drop all policies
DROP POLICY IF EXISTS "Everyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Everyone can view products" ON public.products;
DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
DROP POLICY IF EXISTS "public_categories_select" ON public.categories;
DROP POLICY IF EXISTS "public_products_select" ON public.products;

-- Disable and re-enable RLS
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "anon_select_categories" 
  ON public.categories 
  FOR SELECT 
  TO anon
  USING (true);

CREATE POLICY "anon_select_products" 
  ON public.products 
  FOR SELECT 
  TO anon
  USING (true);
```

## Understanding Supabase RLS

Row Level Security (RLS) in Supabase lets you control who can access which rows in your database tables. By default, when RLS is enabled on a table, **no rows are accessible** until you create policies.

Key concepts:
- **RLS Enabled/Disabled:** When enabled, access to the table requires policies
- **Policies:** Rules that determine who can do what with which rows
- **anon role:** The role used for unauthenticated requests
- **authenticated role:** The role used for authenticated requests

Learn more in the [Supabase RLS documentation](https://supabase.com/docs/guides/auth/row-level-security). 