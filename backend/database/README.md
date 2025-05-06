# OrderKaro Database Setup

This directory contains the database schema for OrderKaro. Follow these steps to set up your Supabase database:

## Setup Instructions

1. Create a Supabase project at [https://supabase.com](https://supabase.com)

2. Once your project is created, go to the SQL Editor in the Supabase dashboard

3. Copy the contents of `schema.sql` and paste it into the SQL Editor

4. Run the SQL script to create all necessary tables, policies, and indexes

5. Update your `.env` file with the appropriate Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_POSTGRES_URL=your_postgres_connection_string
   ```

## Database Schema

The OrderKaro database consists of the following tables:

- `users`: Stores user information
- `categories`: Product categories
- `products`: Product listings with details
- `addresses`: User delivery addresses
- `cart_items`: Items in user shopping carts
- `orders`: Order information and status
- `order_items`: Individual items in each order

## Row Level Security (RLS)

The schema includes Row Level Security policies to ensure that:

- Users can only see and modify their own data
- Admins have additional permissions to manage products, categories, and view all orders
- Products and categories are publicly viewable

## Testing the Setup

After running the schema, you can verify the setup by:

1. Going to the Table Editor in Supabase
2. Checking that all tables are created with the correct structure
3. Testing queries through the SQL Editor or API

## Seeding Test Data

To insert test data, you can use the following approach:

1. Create categories first
2. Add products with valid category references
3. Create test users (including an admin user)
4. Add test addresses linked to users

Example seed data commands are available in the API documentation. 