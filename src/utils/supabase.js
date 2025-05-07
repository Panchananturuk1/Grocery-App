const { createClient } = require('@supabase/supabase-js');
const DB_CONFIG = require('../config/supabase-config');

// Get Supabase credentials from environment variables or hardcoded config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://itetzcqolezorrcegtkf.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZXR6Y3FvbGV6b3JyY2VndGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDYwNjgsImV4cCI6MjA2MjEyMjA2OH0.f_RecDERFMBYzffSAzkx3vgENZuaRT5WiFXoL6Na-ss';

// Log initial configuration status
console.log('Supabase configuration:', { 
  url: supabaseUrl ? `${supabaseUrl.substring(0, 12)}...` : 'missing', 
  hasKey: !!supabaseKey
});

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true, 
    detectSessionInUrl: true
  }
});

console.log('Supabase client initialized');

module.exports = supabase; 