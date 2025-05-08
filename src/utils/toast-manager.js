'use client';

import toast from 'react-hot-toast';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

// Store to keep track of recent toast messages
const recentToasts = new Set();
const toastTimeouts = {};
const activeToasts = new Set(); // Track currently active toasts

// Debounce time in milliseconds for different toast types
const DEBOUNCE_TIME = {
  success: 1500,
  error: 2500, // Slightly longer for errors
  loading: 3000,
  default: 1500
};

// Maximum number of each type of toast to show at once
const MAX_TOASTS = {
  success: 3,
  error: 2,
  loading: 1,
  default: 3
};

// Count of toasts by type
const toastCounts = {
  success: 0,
  error: 0,
  loading: 0,
  default: 0
};

/**
 * Show a toast notification with debounce protection against duplicates
 * 
 * @param {string} message - The message to display
 * @param {string} type - Toast type: 'success', 'error', 'loading'
 * @param {Object} options - Additional toast options
 * @returns {string} Toast ID
 */
export const showToast = (message, type = 'default', options = {}) => {
  // Skip toast in non-browser environments
  if (!isBrowser) return null;

  // Default id for the toast
  const id = options.id || `${type}-${Date.now()}`;
  const key = `${message}-${type}`;
  
  // If this exact message is already showing, don't show it again
  if (recentToasts.has(key)) {
    return null;
  }
  
  // If we've hit the maximum number of toasts for this type, dismiss the oldest one
  if (toastCounts[type] >= MAX_TOASTS[type]) {
    // Find oldest toast of this type and dismiss it
    let oldestTime = Date.now();
    let oldestId = null;
    
    activeToasts.forEach(activeToast => {
      if (activeToast.type === type && activeToast.time < oldestTime) {
        oldestTime = activeToast.time;
        oldestId = activeToast.id;
      }
    });
    
    if (oldestId) {
      toast.dismiss(oldestId);
      activeToasts.delete(oldestId);
      toastCounts[type]--;
    }
  }
  
  // Add to recent toasts set
  recentToasts.add(key);
  
  // Set timeout to remove from recent toasts
  if (toastTimeouts[key]) {
    clearTimeout(toastTimeouts[key]);
  }
  
  toastTimeouts[key] = setTimeout(() => {
    recentToasts.delete(key);
    delete toastTimeouts[key];
  }, options.duration || DEBOUNCE_TIME[type] || DEBOUNCE_TIME.default);
  
  // Determine which toast function to use and track the new toast
  let toastId;
  const currentTime = Date.now();
  
  switch (type) {
    case 'success':
      toastId = toast.success(message, { ...options, id });
      break;
    case 'error':
      toastId = toast.error(message, { ...options, id });
      break;
    case 'loading':
      toastId = toast.loading(message, { ...options, id });
      break;
    default:
      toastId = toast(message, { ...options, id });
  }
  
  // Track this toast
  activeToasts.add({
    id: toastId,
    type,
    time: currentTime,
    message
  });
  
  // Increment count
  toastCounts[type]++;
  
  // Auto-dismiss error toasts after a reasonable time if not specified
  if (type === 'error' && !options.duration) {
    setTimeout(() => {
      dismissToast(toastId);
    }, 4000); // Auto-dismiss errors after 4 seconds
  }
  
  return toastId;
};

/**
 * Show a success toast with debounce protection
 */
export const showSuccess = (message, options = {}) => {
  return showToast(message, 'success', options);
};

/**
 * Show an error toast with debounce protection
 */
export const showError = (message, options = {}) => {
  return showToast(message, 'error', options);
};

/**
 * Show a loading toast with debounce protection
 */
export const showLoading = (message, options = {}) => {
  return showToast(message, 'loading', options);
};

/**
 * Dismiss a toast by ID
 */
export const dismissToast = (toastId) => {
  if (!isBrowser || !toastId) return;
  
  toast.dismiss(toastId);
  
  // Update our tracking
  activeToasts.forEach(activeToast => {
    if (activeToast.id === toastId) {
      activeToasts.delete(activeToast);
      toastCounts[activeToast.type]--;
    }
  });
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  if (!isBrowser) return;
  
  // Dismiss all toasts via react-hot-toast API
  toast.dismiss();
  
  // Clear our tracking
  activeToasts.clear();
  recentToasts.clear();
  
  // Reset counts
  Object.keys(toastCounts).forEach(key => {
    toastCounts[key] = 0;
  });
  
  // Clear all timeouts
  Object.keys(toastTimeouts).forEach(key => {
    clearTimeout(toastTimeouts[key]);
    delete toastTimeouts[key];
  });
};

/**
 * Dismiss all error toasts specifically
 */
export const dismissErrorToasts = () => {
  if (!isBrowser) return;
  
  // Find and dismiss all error toasts
  activeToasts.forEach(activeToast => {
    if (activeToast.type === 'error') {
      toast.dismiss(activeToast.id);
      activeToasts.delete(activeToast);
    }
  });
  
  // Reset error count
  toastCounts.error = 0;
};

// Default export with all methods
export default {
  success: showSuccess,
  error: showError,
  loading: showLoading,
  show: showToast,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
  dismissErrors: dismissErrorToasts
}; 