'use client';

import toast from 'react-hot-toast';

/**
 * Standardized error handler for OrderKaro application
 * 
 * This utility handles common error patterns and provides consistent error messages
 * @param {Error} error - The error object to handle
 * @param {string} context - The context where the error occurred (e.g., 'login', 'profile')
 * @param {Object} options - Additional options for error handling
 * @returns {Object} - Standardized error response
 */
export function handleError(error, context, options = {}) {
  const { showToast = true, logToConsole = true } = options;
  
  // Default error message
  let errorMessage = 'An unexpected error occurred';
  let errorCode = 'unknown';
  
  if (logToConsole) {
    console.error(`Error in ${context}:`, error);
  }
  
  // Handle different error types
  if (error?.message) {
    errorMessage = error.message;
    
    // Look for specific error patterns
    if (error.message.includes('network')) {
      errorMessage = 'Network error. Please check your internet connection.';
      errorCode = 'network';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
      errorCode = 'timeout';
    } else if (error.message.includes('permission')) {
      errorMessage = 'You do not have permission to perform this action.';
      errorCode = 'permission';
    } else if (error.message.includes('not found')) {
      errorMessage = 'The requested resource was not found.';
      errorCode = 'not_found';
    } else if (error.message.includes('already exists')) {
      errorMessage = 'This resource already exists.';
      errorCode = 'duplicate';
    } else if (error.message.includes('login') || error.message.includes('password') || error.message.includes('credentials')) {
      errorMessage = 'Invalid login credentials. Please try again.';
      errorCode = 'auth';
    } else if (error.message.includes('database')) {
      errorMessage = 'Database error. Please try again later.';
      errorCode = 'database';
    }
  }
  
  // Extract error code from Supabase if available
  if (error?.code) {
    errorCode = error.code;
  }
  
  // Show toast notification if requested
  if (showToast) {
    toast.error(errorMessage, {
      id: `error-${context}-${errorCode}`,
      duration: 5000
    });
  }
  
  // Return standardized error object
  return {
    message: errorMessage,
    code: errorCode,
    originalError: error,
    context
  };
}

/**
 * Helper function to safely handle async operations with standardized error handling
 * 
 * @param {Function} asyncFn - The async function to execute
 * @param {string} context - The context for error handling
 * @param {Object} options - Options for error handling
 * @returns {Promise} - Result of the async function or error
 */
export async function safeAsync(asyncFn, context, options = {}) {
  try {
    return await asyncFn();
  } catch (error) {
    return { error: handleError(error, context, options) };
  }
} 