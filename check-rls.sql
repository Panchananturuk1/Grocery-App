-- Comprehensive check for table and policy status
-- This script will diagnose issues with tables and RLS policies

-- Check if tables exist
SELECT 
  table_name,
  'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('categories', 'products')
ORDER BY table_name;

-- Check if RLS is enabled on these tables
SELECT 
  tablename,
  CASE WHEN oid IN (
    SELECT relid FROM pg_catalog.pg_policy
  ) THEN 'HAS_POLICIES' ELSE 'NO_POLICIES' END as has_policies,
  relrowsecurity as rls_enabled
FROM pg_catalog.pg_class
WHERE relname IN ('categories', 'products')
AND relkind = 'r'
ORDER BY relname;

-- List all RLS policies for these tables
SELECT 
  schemaname,
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename IN ('categories', 'products')
ORDER BY tablename, policyname;

-- Check table grants for anon role
SELECT
  grantee,
  table_name,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name IN ('categories', 'products')
AND grantee = 'anon'
ORDER BY table_name, privilege_type;

-- Check permissions on the schema level
SELECT
  nspname as schema,
  grantee,
  privilege_type
FROM pg_namespace
JOIN information_schema.role_usage_grants 
  ON pg_namespace.nspname = information_schema.role_usage_grants.table_schema
WHERE nspname = 'public'
AND grantee = 'anon'
ORDER BY privilege_type;

-- Check if anon role exists
SELECT
  rolname,
  rolsuper,
  rolinherit,
  rolcreaterole,
  rolcanlogin
FROM pg_roles
WHERE rolname = 'anon';

-- Count number of records in each table
SELECT 'categories' as table_name, COUNT(*) as record_count FROM categories
UNION
SELECT 'products' as table_name, COUNT(*) as record_count FROM products
ORDER BY table_name;

-- Show the exact columns in the products table
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' AND table_name = 'products'
ORDER BY 
  ordinal_position; 