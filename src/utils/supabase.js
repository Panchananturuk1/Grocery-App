'use client';

const { createClient } = require('@supabase/supabase-js');
// const DB_CONFIG = require('../config/supabase-config');

// Get Supabase credentials from environment variables or hardcoded config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://itetzcqolezorrcegtkf.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZXR6Y3FvbGV6b3JyY2VndGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDYwNjgsImV4cCI6MjA2MjEyMjA2OH0.f_RecDERFMBYzffSAzkx3vgENZuaRT5WiFXoL6Na-ss';

// Log initial configuration status
console.log('Supabase configuration:', { 
  url: supabaseUrl ? `${supabaseUrl.substring(0, 12)}...` : 'missing', 
  hasKey: !!supabaseKey
});

// Create Supabase client with error handling
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true, 
      detectSessionInUrl: true
    }
  });
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Provide fallback client that logs errors
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: new Error('Supabase client initialization failed') }),
      getUser: async () => ({ data: { user: null }, error: new Error('Supabase client initialization failed') }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase client initialization failed') }),
      signUp: async () => ({ data: null, error: new Error('Supabase client initialization failed') }),
      signOut: async () => ({ error: new Error('Supabase client initialization failed') }),
      onAuthStateChange: () => ({ data: { subscription: null } })
    },
    from: () => ({
      insert: async () => ({ error: new Error('Supabase client initialization failed') }),
      select: async () => ({ data: null, error: new Error('Supabase client initialization failed') })
    })
  };
}

module.exports = supabase; 