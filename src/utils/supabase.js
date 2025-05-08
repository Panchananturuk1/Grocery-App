'use client';

import { createClient } from '@supabase/supabase-js';
import logger from './logger';
// const DB_CONFIG = require('../config/supabase-config');

// Get Supabase credentials from environment variables or fallback to hard-coded values
// This is needed because sometimes Next.js doesn't properly load env variables in certain contexts
const envConfig = require('../../env-config');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
  const { timeout = 60000 } = options; // Increased to 60 seconds timeout
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  return fetch(url, {
    ...options,
    signal: controller.signal,
    // Add cache control to help with performance
    headers: {
      ...options.headers,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    }
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
  
  // Log configuration values (without sensitive parts)
  console.log('Initializing Supabase with URL:', supabaseUrl);
  console.log('Has Supabase Key:', !!supabaseKey);
  
  // Create the client with more robust options
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'sb:session',
      storage: storage
    },
    global: {
      fetch: fetchWithTimeout,
      headers: {
        'X-Client-Info': 'orderkaro-web'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 1 // Reduced to avoid rate limits
      }
    },
    db: {
      schema: 'public'
    }
  });
  
  // Add connection retry to the client
  const originalFrom = supabase.from.bind(supabase);
  supabase.from = (table) => {
    const queryBuilder = originalFrom(table);
    
    // Track active queries to prevent duplicates
    const activeQueries = new Map();
    
    // Add retry capability to select method
    const originalSelect = queryBuilder.select.bind(queryBuilder);
    queryBuilder.select = function(...args) {
      const builder = originalSelect(...args);
      
      // Add a retry method to the builder
      builder.withRetry = function(retries = 5, delay = 1000) {
        const originalThen = this.then.bind(this);
        
        this.then = async function(onFulfilled, onRejected) {
          let lastError;
          let attempts = 0;
          
          while (attempts < retries) {
            try {
              logger.logDebug(`Attempt ${attempts + 1}/${retries} for ${table} query`, 'supabase');
              const result = await originalThen(onFulfilled, onRejected);
              return result;
            } catch (error) {
              lastError = error;
              attempts++;
              
              logger.logWarn(`Query attempt ${attempts} failed for ${table}:`, error.message);
              
              if (attempts >= retries) break;
              
              // Delay before retrying (with exponential backoff)
              const backoffDelay = delay * Math.pow(2, attempts - 1);
              logger.logDebug(`Retrying in ${backoffDelay}ms...`, 'supabase');
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }
          }
          
          // All retries failed
          throw lastError;
        };
        
        return this;
      };
      
      // Add withTimeout to allow custom timeouts per query
      builder.withTimeout = function(timeoutMs = 45000) {
        const originalThen = this.then.bind(this);
        
        this.then = function(onFulfilled, onRejected) {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Query timeout after ${timeoutMs}ms - Supabase connection is slow`));
            }, timeoutMs);
          });
          
          return Promise.race([originalThen(onFulfilled, onRejected), timeoutPromise]);
        };
        
        return this;
      };
      
      // Automatically apply retry and timeout
      return builder.withRetry().withTimeout();
    };
    
    return queryBuilder;
  };
  
  logger.logInfo('Supabase client initialized successfully', 'supabase');
  
  // Only run connection check in browser environment
  if (isBrowser) {
    // Check connection but don't block initialization
    setTimeout(() => {
      // Check connection immediately to ensure it's working
      supabase.from('profiles').select('id').limit(1).then(({ data, error }) => {
        if (error) {
          logger.logError('Supabase connection test failed:', error);
          console.error('Supabase connection test failed:', error);
        } else {
          logger.logDebug('Supabase connection verified with profiles query', 'supabase');
        }
      }).catch(err => {
        logger.logError('Fatal Supabase connection error:', err);
        console.error('Fatal Supabase profiles query error:', err);
      });
    }, 1000);
  }
  
} catch (error) {
  logger.logError('Error initializing Supabase client:', error);
  console.error('Critical error initializing Supabase client:', error);
  
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
    from: (table) => ({
      insert: async () => ({ error: new Error(`Supabase client initialization failed when accessing ${table}`) }),
      select: async () => ({ data: null, error: new Error(`Supabase client initialization failed when accessing ${table}`) }),
      update: async () => ({ error: new Error(`Supabase client initialization failed when accessing ${table}`) }),
      delete: async () => ({ error: new Error(`Supabase client initialization failed when accessing ${table}`) }),
      eq: () => ({
        select: async () => ({ data: null, error: new Error(`Supabase client initialization failed when accessing ${table}`) }),
      }),
      order: () => ({
        select: async () => ({ data: null, error: new Error(`Supabase client initialization failed when accessing ${table}`) }),
      }),
    }),
    rpc: (func) => ({ error: new Error(`Supabase client initialization failed when calling function ${func}`) })
  };
}

export default supabase; 