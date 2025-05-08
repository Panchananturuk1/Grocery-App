/**
 * Simple caching utility for Supabase queries
 */

class QueryCache {
  constructor(maxAge = 60000) { // Default cache expiry: 1 minute
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  /**
   * Generate a cache key from the query details
   */
  generateKey(table, params) {
    // Create a stable string representation of the params
    const paramsStr = params 
      ? Object.entries(params)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
          .join('&')
      : '';
    
    return `${table}:${paramsStr}`;
  }

  /**
   * Get data from cache if valid
   * @returns {Object|null} The cached data or null if not found/expired
   */
  get(table, params) {
    const key = this.generateKey(table, params);
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if cache is expired
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * Store data in the cache
   */
  set(table, params, data) {
    const key = this.generateKey(table, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all cache or specific table cache
   */
  clear(table = null) {
    if (table) {
      // Clear only cache for the specified table
      const prefix = `${table}:`;
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  /**
   * Get stats about the cache
   */
  getStats() {
    const now = Date.now();
    const total = this.cache.size;
    let expired = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.maxAge) {
        expired++;
      }
    }
    
    return {
      total,
      expired,
      active: total - expired
    };
  }
}

// Create a single instance for the application
const queryCache = new QueryCache();

export default queryCache; 