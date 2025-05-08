/**
 * Logger utility to control console output
 * 
 * This utility provides a way to control console output
 * across the application by setting log levels and
 * conditional logging.
 */

// Log levels
export const LOG_LEVELS = {
  NONE: 0,     // No logs
  ERROR: 1,    // Only errors
  WARN: 2,     // Errors and warnings
  INFO: 3,     // Errors, warnings, and info
  DEBUG: 4,    // All logs including debug
  VERBOSE: 5   // All logs including verbose debug
};

// Default configuration
const config = {
  level: process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO,
  enabledCategories: ['auth', 'error'],
  disabledCategories: ['polling'],
  maxRetries: 3,
  retryCount: {},
};

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Configure logger
export const configureLogger = (options = {}) => {
  Object.assign(config, options);
};

// Get current log level
export const getLogLevel = () => config.level;

// Set log level
export const setLogLevel = (level) => {
  config.level = level;
};

// Enable a category
export const enableCategory = (category) => {
  if (!config.enabledCategories.includes(category)) {
    config.enabledCategories.push(category);
  }
  // Also remove from disabled if present
  const index = config.disabledCategories.indexOf(category);
  if (index > -1) {
    config.disabledCategories.splice(index, 1);
  }
};

// Disable a category
export const disableCategory = (category) => {
  if (!config.disabledCategories.includes(category)) {
    config.disabledCategories.push(category);
  }
  // Also remove from enabled if present
  const index = config.enabledCategories.indexOf(category);
  if (index > -1) {
    config.enabledCategories.splice(index, 1);
  }
};

// Check if a category is enabled
const isCategoryEnabled = (category) => {
  if (!category) return true;
  if (config.disabledCategories.includes(category)) return false;
  if (config.enabledCategories.includes(category)) return true;
  return true; // Default to enabled if not specified
};

// Check if we should log based on retry count
const shouldLogRetry = (category) => {
  if (!category) return true;
  
  // Initialize retry count if not exists
  if (typeof config.retryCount[category] === 'undefined') {
    config.retryCount[category] = 0;
  }
  
  // Increment retry count
  config.retryCount[category]++;
  
  // Reset after max retries
  if (config.retryCount[category] > config.maxRetries) {
    config.retryCount[category] = 0;
    return true;
  }
  
  // Only log first attempt
  return config.retryCount[category] === 1;
};

// Reset retry count for a category
export const resetRetryCount = (category) => {
  if (category) {
    config.retryCount[category] = 0;
  }
};

// Log error
export const logError = (message, category, ...args) => {
  if (config.level >= LOG_LEVELS.ERROR && isCategoryEnabled(category)) {
    // Only log errors if the category isn't throttled
    if (!category || shouldLogRetry(category)) {
      console.error(message, category || '', ...args);
    }
  }
};

// Log warning
export const logWarn = (message, category, ...args) => {
  if (config.level >= LOG_LEVELS.WARN && isCategoryEnabled(category)) {
    console.warn(message, ...args);
  }
};

// Log info
export const logInfo = (message, category, ...args) => {
  if (config.level >= LOG_LEVELS.INFO && isCategoryEnabled(category)) {
    console.log(message, ...args);
  }
};

// Log debug
export const logDebug = (message, category, ...args) => {
  if (config.level >= LOG_LEVELS.DEBUG && isCategoryEnabled(category)) {
    console.log(message, ...args);
  }
};

// Log verbose (only if verbose level is enabled)
export const logVerbose = (message, category, ...args) => {
  if (config.level >= LOG_LEVELS.VERBOSE && isCategoryEnabled(category)) {
    console.log(message, ...args);
  }
};

// Log with retry throttling
export const logWithRetry = (level, message, category, ...args) => {
  if (!shouldLogRetry(category)) return;
  
  switch (level) {
    case LOG_LEVELS.ERROR:
      logError(message, category, ...args);
      break;
    case LOG_LEVELS.WARN:
      logWarn(message, category, ...args);
      break;
    case LOG_LEVELS.INFO:
      logInfo(message, category, ...args);
      break;
    case LOG_LEVELS.DEBUG:
      logDebug(message, category, ...args);
      break;
    case LOG_LEVELS.VERBOSE:
      logVerbose(message, category, ...args);
      break;
    default:
      break;
  }
};

// Initialize with browser detection
if (isBrowser) {
  // Check if verbose logging is enabled via localStorage
  try {
    const verboseLogging = localStorage.getItem('verboseLogging');
    if (verboseLogging === 'true') {
      config.level = LOG_LEVELS.VERBOSE;
    }
  } catch (e) {
    // Ignore localStorage errors
  }
}

export default {
  LOG_LEVELS,
  configureLogger,
  getLogLevel,
  setLogLevel,
  enableCategory,
  disableCategory,
  resetRetryCount,
  logError,
  logWarn,
  logInfo,
  logDebug,
  logVerbose,
  logWithRetry
}; 