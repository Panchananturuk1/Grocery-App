'use client';

import { createClient } from '@supabase/supabase-js';
import logger from './logger';
import connectionMonitor from './connection-monitor';
// const DB_CONFIG = require('../config/supabase-config');

// Get Supabase credentials from environment variables or fallback to hard-coded values
// This is needed because sometimes Next.js doesn't properly load env variables in certain contexts
const envConfig = require('../../env-config');

// Hard-code the credentials directly to ensure they're available
const supabaseUrl = 'https://itetzcqolezorrcegtkf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZXR6Y3FvbGV6b3JyY2VndGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDYwNjgsImV4cCI6MjA2MjEyMjA2OH0.f_RecDERFMBYzffSAzkx3vgENZuaRT5WiFXoL6Na-ss';

// Detect environment
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

// Configure timeouts based on environment
const timeoutConfig = {
  fetch: isLocalhost ? 30000 : 60000, // 30s local, 60s deployed
  query: isLocalhost ? 25000 : 45000, // 25s local, 45s deployed
  maxRetries: isLocalhost ? 3 : 5     // Fewer retries locally
};

// Log environment detection
logger.logInfo(`Environment detected: ${isLocalhost ? 'localhost' : 'production'}`, 'supabase');
logger.logInfo(`Timeout config: ${JSON.stringify(timeoutConfig)}`, 'supabase');

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

// Create a custom fetch with timeout and monitoring
const fetchWithTimeout = (url, options = {}) => {
  const controller = new AbortController();
  const { timeout = timeoutConfig.fetch } = options; // Use environment-specific timeout
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  // Add monitoring headers
  const headers = {
    ...options.headers,
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'X-Client-Timestamp': Date.now().toString(),
    'X-Client-Env': isLocalhost ? 'localhost' : 'production'
  };
  
  const startTime = Date.now();
  
  return fetch(url, {
    ...options,
    signal: controller.signal,
    headers
  }).finally(() => {
    clearTimeout(timeoutId);
    
    // Log the request duration if it's a Supabase request
    if (url.includes(supabaseUrl)) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (duration > 5000) {
        logger.logWarn(`Slow Supabase request: ${duration}ms`);
      }
    }
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
      builder.withRetry = function(retries = timeoutConfig.maxRetries, delay = 1000) {
        const originalThen = this.then.bind(this);
        
        this.then = async function(onFulfilled, onRejected) {
          let lastError;
          let attempts = 0;
          
          const startTime = Date.now();
          let endTime;
          let success = false;
          
          while (attempts < retries) {
            try {
              logger.logDebug(`Attempt ${attempts + 1}/${retries} for ${table} query`, 'supabase');
              const result = await originalThen(onFulfilled, onRejected);
              
              endTime = Date.now();
              success = true;
              
              // Log successful query
              connectionMonitor.logQuery(table, 'select', startTime, endTime, true);
              
              return result;
            } catch (error) {
              lastError = error;
              attempts++;
              
              logger.logWarn(`Query attempt ${attempts} failed for ${table}:`, error.message);
              
              // Log failed query attempt
              connectionMonitor.logQuery(table, 'select', startTime, Date.now(), false, error);
              
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
      builder.withTimeout = function(timeoutMs = timeoutConfig.query) {
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

// Add helper methods to the client
supabase.getConnectionStats = () => {
  return connectionMonitor.getStats();
};

export default supabase; 