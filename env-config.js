/**
 * This file contains environment configurations for the application.
 * Create a .env.local file based on these values.
 * 
 * IMPORTANT: Never commit actual API keys or secrets to version control.
 */

const envConfig = {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: 'https://itetzcqolezorrcegtkf.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZXR6Y3FvbGV6b3JyY2VndGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDYwNjgsImV4cCI6MjA2MjEyMjA2OH0.f_RecDERFMBYzffSAzkx3vgENZuaRT5WiFXoL6Na-ss',
  
  // Database Connection Strings (for ORM if needed)
  DATABASE_URL: 'postgresql://postgres.itetzcqolezorrcegtkf:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  DIRECT_URL: 'postgresql://postgres.itetzcqolezorrcegtkf:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres',
  
  // Other Configuration
  NODE_ENV: 'development',
  
  // Render Deployment URL
  NEXT_PUBLIC_SITE_URL: 'https://grocery-app-y6ty.onrender.com',
};

module.exports = envConfig; 