/**
 * Supabase Configuration
 * 
 * This file provides default configuration for Supabase.
 * In production, use environment variables instead.
 */

const DB_CONFIG = {
  // Default values that will be overridden by environment variables
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // For logging purposes
  getConfigStatus: () => {
    return {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
  }
};

module.exports = DB_CONFIG; 