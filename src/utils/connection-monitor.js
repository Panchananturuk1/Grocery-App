/**
 * Connection monitoring utility for diagnosing Supabase performance issues
 */

import logger from './logger';

// Detect environment for appropriate thresholds
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

// Configure thresholds based on environment
const thresholds = {
  slowQuery: isLocalhost ? 3000 : 5000,      // Slow query threshold
  slowPing: isLocalhost ? 1000 : 2000,       // Slow ping threshold
  highLatency: isLocalhost ? 500 : 1000,     // High latency threshold
  pingInterval: isLocalhost ? 60000 : 30000  // Ping interval (1min local, 30s production)
};

class ConnectionMonitor {
  constructor() {
    this.queries = [];
    this.maxQueries = 50; // Store last 50 queries
    this.isInitialized = false;
    this.pingResults = [];
    this.maxPingResults = 20;
    this.environment = isLocalhost ? 'localhost' : 'production';
    
    logger.logInfo(`Connection monitor initialized for ${this.environment}`, 'monitor');
  }

  /**
   * Initialize the monitor
   */
  initialize() {
    if (this.isInitialized) return;
    
    // Run periodic connection check if we're in the browser
    if (typeof window !== 'undefined') {
      this.startPeriodicPing();
    }
    
    this.isInitialized = true;
  }

  /**
   * Log a query and its performance
   */
  logQuery(table, operation, startTime, endTime, success, error = null) {
    const duration = endTime - startTime;
    
    const queryInfo = {
      table,
      operation,
      startTime,
      endTime,
      duration,
      success,
      error: error ? {
        message: error.message,
        code: error.code
      } : null,
      timestamp: new Date().toISOString(),
      environment: this.environment
    };
    
    // Add to the beginning of the array
    this.queries.unshift(queryInfo);
    
    // Trim if too many
    if (this.queries.length > this.maxQueries) {
      this.queries = this.queries.slice(0, this.maxQueries);
    }
    
    // Log to console for debugging
    if (!success) {
      logger.logError(`Query failed: ${table}.${operation} (${duration}ms)`, error);
    } else if (duration > thresholds.slowQuery) {
      logger.logWarn(`Slow query: ${table}.${operation} (${duration}ms)`);
    }
    
    return queryInfo;
  }

  /**
   * Start periodic ping to check connection health
   */
  startPeriodicPing() {
    // Run a ping at environment-specific interval
    this.pingInterval = setInterval(() => {
      this.pingSupabase();
    }, thresholds.pingInterval);
    
    // Run an immediate ping
    this.pingSupabase();
    
    logger.logDebug(`Started pinging every ${thresholds.pingInterval/1000}s`, 'monitor');
  }
  
  /**
   * Ping the Supabase server to check connection
   */
  async pingSupabase() {
    const startTime = Date.now();
    let success = false;
    let error = null;
    let duration = 0;
    
    try {
      // Simple fetch to the supabase URL to check connectivity
      const response = await fetch('/api/ping-supabase', { 
        method: 'GET',
        headers: { 
          'Cache-Control': 'no-cache',
          'X-Client-Env': this.environment
        }
      });
      
      success = response.ok;
      if (!response.ok) {
        error = { message: `HTTP error ${response.status}` };
      }
    } catch (err) {
      error = { message: err.message };
    } finally {
      duration = Date.now() - startTime;
      
      const result = {
        timestamp: new Date().toISOString(),
        duration,
        success,
        error,
        environment: this.environment
      };
      
      this.pingResults.unshift(result);
      
      if (this.pingResults.length > this.maxPingResults) {
        this.pingResults = this.pingResults.slice(0, this.maxPingResults);
      }
      
      // Log issues
      if (!success) {
        logger.logWarn(`Supabase connection check failed: ${error?.message || 'Unknown error'}`);
      } else if (duration > thresholds.slowPing) {
        logger.logWarn(`Slow Supabase connection: ${duration}ms ping time`);
      }
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    // Analyze query performance
    const queryStats = this.analyzeQueries();
    
    // Analyze ping results
    const pingStats = this.analyzePings();
    
    return {
      queries: queryStats,
      connection: pingStats,
      environment: this.environment,
      recommendations: this.generateRecommendations(queryStats, pingStats)
    };
  }
  
  /**
   * Analyze the collected queries
   */
  analyzeQueries() {
    if (this.queries.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        maxDuration: 0,
        successRate: 100,
        slowQueries: 0
      };
    }
    
    let totalDuration = 0;
    let maxDuration = 0;
    let successCount = 0;
    let slowCount = 0;
    
    this.queries.forEach(query => {
      totalDuration += query.duration;
      maxDuration = Math.max(maxDuration, query.duration);
      
      if (query.success) successCount++;
      if (query.duration > thresholds.slowQuery) slowCount++;
    });
    
    return {
      count: this.queries.length,
      avgDuration: Math.round(totalDuration / this.queries.length),
      maxDuration,
      successRate: Math.round((successCount / this.queries.length) * 100),
      slowQueries: slowCount
    };
  }
  
  /**
   * Analyze ping results
   */
  analyzePings() {
    if (this.pingResults.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        maxDuration: 0,
        successRate: 100
      };
    }
    
    let totalDuration = 0;
    let maxDuration = 0;
    let successCount = 0;
    
    this.pingResults.forEach(ping => {
      totalDuration += ping.duration;
      maxDuration = Math.max(maxDuration, ping.duration);
      
      if (ping.success) successCount++;
    });
    
    return {
      count: this.pingResults.length,
      avgDuration: Math.round(totalDuration / this.pingResults.length),
      maxDuration,
      successRate: Math.round((successCount / this.pingResults.length) * 100)
    };
  }
  
  /**
   * Generate recommendations based on statistics
   */
  generateRecommendations(queryStats, pingStats) {
    const recommendations = [];
    
    // Connection issues
    if (pingStats.successRate < 100) {
      recommendations.push('Network connectivity issues detected. Check your internet connection.');
    }
    
    if (pingStats.avgDuration > thresholds.highLatency) {
      if (isLocalhost) {
        recommendations.push('High network latency detected even on localhost. Check if Supabase is under high load.');
      } else {
        recommendations.push('High network latency detected. This can cause timeouts with Supabase.');
      }
    }
    
    // Query performance
    if (queryStats.successRate < 90) {
      recommendations.push('High query failure rate. Consider implementing more robust retry logic.');
    }
    
    if (queryStats.slowQueries > 5) {
      recommendations.push('Multiple slow queries detected. Consider optimizing queries or adding indices.');
    }
    
    if (queryStats.avgDuration > 2000) {
      if (isLocalhost) {
        recommendations.push('Slow average query time on localhost. Check for complex queries or Supabase load.');
      } else {
        recommendations.push('Slow average query time. Consider implementing more aggressive caching.');
      }
    }
    
    // Add environment-specific recommendations
    if (isLocalhost && pingStats.avgDuration > 500) {
      recommendations.push('Localhost connection is surprisingly slow. Check for other processes using resources.');
    }
    
    if (!isLocalhost && pingStats.avgDuration > 2000) {
      recommendations.push('Production connection is very slow. Free tier limitations or server load may be affecting performance.');
    }
    
    return recommendations;
  }
}

const connectionMonitor = new ConnectionMonitor();

// Initialize when imported
connectionMonitor.initialize();

export default connectionMonitor; 