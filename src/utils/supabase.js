import { createClient } from '@supabase/supabase-js';
import DB_CONFIG from '../config/supabase-config';

// Get Supabase credentials from environment variables or config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DB_CONFIG.url;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DB_CONFIG.anonKey;

// Check if we have the required configuration
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and/or key missing! Authentication will not work.');
  console.error('Make sure to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  
  // Log current environment info for debugging
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Config status:', DB_CONFIG.getConfigStatus());
}

// Create Supabase client
const supabase = createClient(supabaseUrl || 'https://placeholder-url.supabase.co', supabaseKey || 'placeholder-key', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

console.log('Supabase client initialized');

export default supabase; 