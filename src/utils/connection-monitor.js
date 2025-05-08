/**
 * Connection monitoring utility for diagnosing Supabase performance issues
 */

import logger from './logger';
import toastManager from './toast-manager';

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
  pingInterval: isLocalhost ? 120000 : 60000,  // Ping interval (2min local, 1min production)
  errorNotificationInterval: 300000          // Show error notifications max once per 5 minutes
};

class ConnectionMonitor {
  constructor() {
    this.queries = [];
    this.maxQueries = 50; // Store last 50 queries
    this.isInitialized = false;
    this.pingResults = [];
    this.maxPingResults = 20;
    this.environment = isLocalhost ? 'localhost' : 'production';
    this.lastErrorNotification = 0;
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = 3;
    this.pingPaused = false;
    
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
      // Skip ping if paused due to consecutive failures
      if (!this.pingPaused) {
        this.pingSupabase();
      }
    }, thresholds.pingInterval);
    
    // Run an immediate ping but with a short delay to avoid startup issues
    setTimeout(() => {
      this.pingSupabase();
    }, 5000);
    
    logger.logDebug(`Started pinging every ${thresholds.pingInterval/1000}s`, 'monitor');
  }
  
  /**
   * Ping the Supabase server to check connection
   */
  async pingSupabase() {
    // Skip if we're already pinging
    if (this.isPinging) return;
    
    this.isPinging = true;
    const startTime = Date.now();
    let success = false;
    let error = null;
    let duration = 0;
    
    try {
      // Add a timeout controller to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // Simple fetch to the supabase URL to check connectivity
      const response = await fetch('/api/ping-supabase', { 
        method: 'GET',
        signal: controller.signal,
        headers: { 
          'Cache-Control': 'no-cache',
          'X-Client-Env': this.environment
        }
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      // Check if response has cached flag which means the server is backing off
      if (data.cached) {
        logger.logDebug(`Ping server is backing off: ${data.message}`, 'monitor');
        // If server is backing off, we'll pause pinging too
        this.pausePingingTemporarily();
      }
      
      success = response.ok;
      if (!response.ok) {
        error = { message: data.message || `HTTP error ${response.status}` };
      }
    } catch (err) {
      error = { 
        message: err.name === 'AbortError' ? 'Ping request timed out' : err.message,
        isTimeout: err.name === 'AbortError'
      };
    } finally {
      duration = Date.now() - startTime;
      this.isPinging = false;
      
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
      
      // Handle failure
      if (!success) {
        this.handlePingFailure(error);
      } else {
        // Reset consecutive failures on success
        this.consecutiveFailures = 0;
        
        // Log slow connection but don't treat as error
        if (duration > thresholds.slowPing) {
          logger.logWarn(`Slow Supabase connection: ${duration}ms ping time`);
        }
      }
    }
  }
  
  /**
   * Handle ping failure with appropriate error display logic
   */
  handlePingFailure(error) {
    this.consecutiveFailures++;
    const now = Date.now();
    
    // Log the error
    if (error?.isTimeout) {
      logger.logWarn(`Supabase connection check timed out`);
    } else {
      logger.logWarn(`Supabase connection check failed: ${error?.message || 'Unknown error'}`);
    }
    
    // Show notification only if:
    // 1. It's been more than errorNotificationInterval since last notification, and
    // 2. We've had multiple consecutive failures
    if (
      this.consecutiveFailures >= this.maxConsecutiveFailures && 
      (now - this.lastErrorNotification) > thresholds.errorNotificationInterval
    ) {
      // Display a one-time notification for connection issues
      toastManager.error('Having trouble connecting to the server. Some features may be limited.', {
        id: 'connection-issue',
        duration: 5000
      });
      
      this.lastErrorNotification = now;
      
      // Pause pinging temporarily to prevent hammering the server
      this.pausePingingTemporarily();
    }
  }
  
  /**
   * Temporarily pause pinging to allow recovery
   */
  pausePingingTemporarily() {
    this.pingPaused = true;
    
    // Resume after a longer timeout (5 minutes)
    setTimeout(() => {
      logger.logInfo('Resuming ping after temporary pause', 'monitor');
      this.pingPaused = false;
      this.consecutiveFailures = 0;
    }, 300000); // 5 minutes
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