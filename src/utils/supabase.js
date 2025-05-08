'use client';

import { createClient } from '@supabase/supabase-js';
import logger from './logger';
import connectionMonitor from './connection-monitor';
// const DB_CONFIG = require('../config/supabase-config');

// Get Supabase credentials from environment variables or fallback to hard-coded values
// This is needed because sometimes Next.js doesn't properly load env variables in certain contexts
// const envConfig = require('../../env-config'); // Keep commented if hardcoding

// Hard-code the credentials directly to ensure they're available
const supabaseUrl = 'https://itetzcqolezorrcegtkf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZXR6Y3FvbGV6b3JyY2VndGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDYwNjgsImV4cCI6MjA2MjEyMjA2OH0.f_RecDERFMBYzffSAzkx3vgENZuaRT5WiFXoL6Na-ss';

// Detect environment
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

// Simplified timeout/retry settings - let Supabase client handle more
const fetchTimeout = isLocalhost ? 30000 : 60000; // General fetch timeout

// Log environment detection
logger.logInfo(`Environment detected: ${isLocalhost ? 'localhost' : 'production'}`, 'supabase');

// Create a memory storage fallback for server-side rendering
class MemoryStorage {
  constructor() {
    this.items = new Map();
  }
  
  getItem(key) {
    return this.items.get(key) || null;
  }
  
  setItem(key, value) {
    this.items.set(key, value);
  }
  
  removeItem(key) {
    this.items.delete(key);
  }
}

// Determine if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create appropriate storage based on environment
let storage;
if (isBrowser) {
  try {
    // Test localStorage access
    window.localStorage.setItem('supabase_test', 'test');
    window.localStorage.removeItem('supabase_test');
    storage = window.localStorage;
    logger.logDebug('Using browser localStorage for Supabase auth', 'supabase');
  } catch (e) {
    logger.logWarn('localStorage not available, using in-memory storage', 'supabase');
    storage = new MemoryStorage();
  }
} else {
  storage = new MemoryStorage();
  logger.logInfo('Using in-memory storage for Supabase auth (server-side)', 'supabase');
}

// Log initial configuration status
logger.logInfo('Supabase configuration:', 'supabase', { 
  url: supabaseUrl ? `${supabaseUrl.substring(0, 12)}...` : 'missing', 
  hasKey: !!supabaseKey,
  environment: isBrowser ? 'browser' : 'server'
});

// Create Supabase client with simplified options
let supabase;
try {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or key.');
  }
  
  console.log('Initializing Supabase with URL:', supabaseUrl);
  console.log('Has Supabase Key:', !!supabaseKey);
  
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: storage,
    },
    global: {
      //fetch: fetch, // Use default fetch or a simpler timeout wrapper if needed
      headers: { 'X-Client-Info': 'orderkaro-web' },
    },
    // Configure default timeout for requests if needed via fetch options
    // Example (requires custom fetch wrapper like fetchWithTimeout): 
    // global: { fetch: (url, options) => fetchWithTimeout(url, { ...options, timeout: fetchTimeout }) }
    realtime: {
      params: {
        eventsPerSecond: 5 // Default is 10, reduce slightly if needed
      }
    },
    db: {
      schema: 'public'
    }
  });

  logger.logInfo('Supabase client initialized successfully (simplified)', 'supabase');
  
  // Optional: Add a simple connection check without blocking
  if (isBrowser) {
    setTimeout(() => {
      supabase.from('profiles').select('id', { head: true, count: 'exact' }).limit(1)
        .then(({ error }) => {
          if (error) {
            logger.logWarn('Initial Supabase connection check failed:', error.message);
          } else {
            logger.logInfo('Initial Supabase connection check successful.');
          }
        });
    }, 2000); // Delay check slightly
  }

} catch (error) {
  logger.logError('CRITICAL: Failed to initialize Supabase client:', error);
  // Handle the error appropriately, maybe show a global error message
  // Assign a dummy client to prevent crashes, although functionality will be broken
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ error: new Error('Supabase client failed to initialize') }),
      insert: () => Promise.resolve({ error: new Error('Supabase client failed to initialize') }),
      update: () => Promise.resolve({ error: new Error('Supabase client failed to initialize') }),
      delete: () => Promise.resolve({ error: new Error('Supabase client failed to initialize') })
    }),
    auth: {
      getSession: () => Promise.resolve({ error: new Error('Supabase client failed to initialize') }),
      // Add other dummy auth methods if needed
    },
    rpc: () => Promise.resolve({ error: new Error('Supabase client failed to initialize') }),
    // Add other dummy methods
    getConnectionStats: () => ({ queries: {}, connection: {}, environment: 'error', recommendations: [] })
  };
}

// Export the initialized client
export default supabase;

// Add helper to get connection stats
supabase.getConnectionStats = () => {
  return connectionMonitor.getStats();
}; 