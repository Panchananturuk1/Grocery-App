/**
 * Logger initialization module
 * 
 * This module configures the logger with appropriate settings
 * based on the environment and is imported at app startup.
 */

'use client';

import logger, { LOG_LEVELS } from './logger';

/**
 * Initialize the logger with proper configuration
 */
const initLogger = () => {
  // Set log level based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  // Check for debug flag in localStorage
  let debugMode = false;
  try {
    debugMode = localStorage.getItem('debug') === 'true';
  } catch (e) {
    // Ignore localStorage errors
  }
  
  // Set initial log level
  let logLevel = LOG_LEVELS.INFO; // Default
  
  if (isProduction && !debugMode) {
    logLevel = LOG_LEVELS.ERROR; // Production only shows errors by default
  } else if (isDevelopment || debugMode) {
    logLevel = LOG_LEVELS.DEBUG; // Development shows all logs
  } else if (isTest) {
    logLevel = LOG_LEVELS.NONE; // Tests don't show logs
  }
  
  // Configure the logger
  logger.configureLogger({
    level: logLevel,
    enabledCategories: [
      'auth',       // Authentication events
      'cart',       // Cart operations
      'db-setup',   // Database setup
      'orders',     // Order operations
      'error'       // General errors
    ],
    disabledCategories: [
      'polling',    // Background polling
      'verbose'     // Extra verbose logs
    ],
    maxRetries: 3   // Show an error message max 3 times in a row
  });
  
  logger.logInfo('Logger initialized', 'system', {
    environment: process.env.NODE_ENV || 'unknown',
    logLevel: logger.getLogLevel(),
    debugMode
  });
};

// Run initialization
initLogger();

// Allow external re-initialization
export const reinitLogger = initLogger;

export default initLogger; 