# OrderKaro Database Setup Guide

This guide will help you set up the OrderKaro database from scratch in your Supabase project.

## Complete Database Setup

If you're seeing errors about missing tables, follow these steps to set up the complete database:

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to the **SQL Editor** (left sidebar)
4. Create a new query
5. Copy the entire contents of `setup-database.sql` and paste it into the editor
6. Click **Run** to execute the script

This script will:
- Create the categories and products tables
- Add sample data to both tables
- Configure Row Level Security (RLS) for anonymous access
- Set up triggers for updated_at timestamps

## What This Script Does

1. **Creates Tables**:
   - `categories` table with id, name, description, and timestamps
   - `products` table with id, name, description, price, image_url, category_id, and timestamps

2. **Adds Sample Data**:
   - 5 categories: Fruits, Vegetables, Dairy, Bakery, Beverages
   - 4 sample products (one for each main category)

3. **Configures Security**:
   - Enables Row Level Security on both tables
   - Grants necessary permissions to the anonymous role
   - Creates RLS policies for public read access

## Troubleshooting

If you're still having issues after running the setup script:

1. **Check RLS Policies**: Go to your database, select a table, and check the Policies tab to ensure policies are correctly set up.

2. **Verify Anonymous Access**: Make sure the anon role has the correct permissions:
   ```sql
   GRANT USAGE ON SCHEMA public TO anon;
   GRANT SELECT ON public.categories TO anon;
   GRANT SELECT ON public.products TO anon;
   ```

3. **Check for Errors**: Look for any error messages when running the script. If you see any errors, note them down and try to resolve them one by one.

4. **Run the Diagnostics Tool**: Visit the `/diagnostics` page in your OrderKaro app to run the built-in database diagnostics.

## When Everything is Working

Once the database is properly set up:

1. You should see categories and products on your app's home page
2. The `/diagnostics` page should show a "Connected" status
3. No "API key not found in request" errors should appear in the console

Remember that you can always run the setup script again - it's designed to be safe to run multiple times without creating duplicates. 