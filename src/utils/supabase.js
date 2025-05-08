'use client';

import { createClient } from '@supabase/supabase-js';
import logger from './logger';
// const DB_CONFIG = require('../config/supabase-config');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

// Create a custom fetch with timeout
const fetchWithTimeout = (url, options = {}) => {
  const controller = new AbortController();
  const { timeout = 15000 } = options; // Increased timeout to 15 seconds
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Create Supabase client with improved configuration
let supabase;
try {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or key. Check your environment variables.');
  }
  
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
      storageKey: 'sb:session',
      storage: storage
    },
    global: {
      fetch: fetchWithTimeout
    },
    realtime: {
      params: {
        eventsPerSecond: 5
      }
    },
    db: {
      autoRefreshToken: true,
      retryOnAuthError: true,
      retryOnNetworkError: true,
      retryInterval: 500,
      maxRetries: 3
    }
  });
  
  logger.logInfo('Supabase client initialized successfully', 'supabase');
  
  // Only run connection check in browser environment
  if (isBrowser) {
    // Check connection immediately to ensure it's working
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        logger.logError('Supabase connection test failed:', error);
      } else {
        logger.logDebug('Supabase connection verified:', 'supabase', 
          data.session ? 'Active session found' : 'No active session');
      }
    }).catch(err => {
      logger.logError('Fatal Supabase connection error:', err);
    });
  }
  
} catch (error) {
  logger.logError('Error initializing Supabase client:', error);
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
      select: async () => ({ data: null, error: new Error('Supabase client initialization failed') }),
      update: async () => ({ error: new Error('Supabase client initialization failed') }),
      delete: async () => ({ error: new Error('Supabase client initialization failed') }),
    }),
    rpc: () => ({ error: new Error('Supabase client initialization failed') })
  };
}

export default supabase; 