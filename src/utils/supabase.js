import { createClient } from '@supabase/supabase-js';
import DB_CONFIG from '../config/supabase-config';

// Get Supabase credentials from config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DB_CONFIG.url;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DB_CONFIG.anonKey;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

console.log('Supabase client initialized');

export default supabase; 