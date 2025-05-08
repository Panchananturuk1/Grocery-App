# OrderKaro Supabase Setup

This directory contains the database setup files for OrderKaro using Supabase.

## Initial Setup

You need to set up your Supabase project before using the application:

1. Go to [Supabase](https://supabase.com/) and create a new project
2. Get your project URL and anon key from the API settings
3. Update these values in your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Setup

### Option 1: Using the SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy the contents of `migrations/20240508_create_initial_tables.sql`
5. Run the query to create all the necessary tables and functions

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase login
supabase link --project-ref <your-project-id>
supabase db push
```

## Required Tables

The application needs the following tables:

1. `profiles` - User profiles linked to auth users
2. `products` - Product catalog
3. `cart_items` - Shopping cart items for users

## Troubleshooting

If you encounter errors about missing tables:

1. Check that all tables are created in your Supabase project
2. Verify the SQL has executed correctly
3. Make sure your environment variables are correctly set
4. Check the Row Level Security (RLS) policies are in place

## Authentication Setup

Make sure to enable the following in your Supabase Auth settings:

1. Email authentication
2. Customize email templates if desired
3. Set up redirect URLs for your application:
   - Go to Authentication > URL Configuration
   - Add your site URL (e.g., `https://your-domain.com`)
   - Add the following redirect URLs:
     - `https://your-domain.com/reset-password` (for password reset)
     - `https://your-domain.com/auth/callback` (for OAuth callbacks)
     - For local development: `http://localhost:3000/reset-password`
4. Enable password reset functionality:
   - Go to Authentication > Email Templates
   - Customize the "Password Reset" email template if desired

## Password Reset Configuration

For the password reset functionality to work properly:

1. Make sure your site URL is set correctly in Supabase project settings
2. Configure redirect URLs as mentioned above
3. The password reset flow requires:
   - A working email delivery setup (Supabase provides this by default)
   - Proper redirect URL configuration
   - The user to have a valid account 