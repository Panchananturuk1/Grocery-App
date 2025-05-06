import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sxnqargkpoojafyshwrc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4bnFhcmdrcG9vamFmeXNod3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2NDYxNzksImV4cCI6MjA2MTIyMjE3OX0.QW47Gjhc_oHmxGjlGw2nvF5GTkYhCoy93ZqeT2GmLHY';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 