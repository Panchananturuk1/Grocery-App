'use client';

import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiLogOut } from 'react-icons/fi';
import supabase from '../utils/supabase';

/**
 * Specialized error boundary for authentication-related components
 * Provides useful debugging and recovery options for auth errors
 */
export default function AuthErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);
  const [authState, setAuthState] = useState(null);

  useEffect(() => {
    // Add window error event listener specific to auth errors
    const handleError = (event) => {
      // Only handle auth-related errors
      const errorMessage = event.error?.message || '';
      const isAuthError = 
        errorMessage.includes('auth') || 
        errorMessage.includes('session') || 
        errorMessage.includes('token') ||
        errorMessage.includes('login') ||
        errorMessage.includes('password') ||
        errorMessage.toLowerCase().includes('supabase');
      
      if (isAuthError) {
        console.error('AuthErrorBoundary caught auth error:', event.error);
        setError(errorMessage || 'Authentication error');
        setHasError(true);
        
        // Get current auth state for debugging
        supabase.auth.getSession().then(({ data }) => {
          setAuthState({
            hasSession: !!data.session,
            user: data.session?.user?.email || null
          });
        });
        
        event.preventDefault(); // Prevent default error handling
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => {
      handleError({ error: event.reason });
    });

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  const handleForceLogout = async () => {
    try {
      // Clear all potential auth data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      // Clear any other potential auth-related storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Call Supabase signOut
      await supabase.auth.signOut();
      
      // Reload page
      window.location.href = '/';
    } catch (err) {
      console.error('Force logout failed:', err);
      // Hard reload as last resort
      window.location.reload();
    }
  };

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mx-auto mb-4">
            <FiAlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">Authentication Error</h2>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 text-sm">
            <p className="font-medium">Error details:</p>
            <p className="text-red-700">{error || 'Unknown authentication error'}</p>
          </div>
          
          {authState && (
            <div className="bg-gray-50 p-3 mb-4 text-sm rounded">
              <p className="font-medium">Auth State:</p>
              <p>Session: {authState.hasSession ? 'Active' : 'None'}</p>
              {authState.user && <p>User: {authState.user}</p>}
            </div>
          )}
          
          <p className="text-gray-600 mb-6 text-center">
            We've encountered an authentication error. This could be due to an expired session or token issues.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={handleForceLogout}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <FiLogOut className="mr-2" /> Force Logout
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <FiRefreshCw className="mr-2" /> Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
} 