'use client';

import toast from 'react-hot-toast';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

// Store to keep track of recent toast messages
const recentToasts = new Set();
const toastTimeouts = {};

// Debounce time in milliseconds for different toast types
const DEBOUNCE_TIME = {
  success: 1500,
  error: 2000, 
  loading: 3000,
  default: 1500
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
  
  const key = `${message}-${type}`;
  
  // If this exact message is already showing, don't show it again
  if (recentToasts.has(key)) {
    return null;
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
  
  // Determine which toast function to use
  switch (type) {
    case 'success':
      return toast.success(message, options);
    case 'error':
      return toast.error(message, options);
    case 'loading':
      return toast.loading(message, options);
    default:
      return toast(message, options);
  }
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
  if (!isBrowser) return;
  if (toastId) {
    toast.dismiss(toastId);
  }
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  if (!isBrowser) return;
  toast.dismiss();
  recentToasts.clear();
  Object.keys(toastTimeouts).forEach(key => {
    clearTimeout(toastTimeouts[key]);
    delete toastTimeouts[key];
  });
};

// Default export with all methods
export default {
  success: showSuccess,
  error: showError,
  loading: showLoading,
  show: showToast,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts
}; 